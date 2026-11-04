import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fmtDate, fmtTime } from "../api/dates";
import client, { downloadPatientHistoryPdf} from "../api/client";
import { useAuth } from "../context/AuthContext";
import RecordAttachments from "../components/RecordAttachments";
import PrescriptionsSection from "../components/PrescriptionsSection";
import { LabResultCard } from "../components/LabResultsSection";
import { labApi, mergeHistory } from "../api/labs";
import EmergencyAccessModal from "../components/EmergencyAccessModal";
import { PatientPhotoBox } from "../components/PatientPhoto";

function ageOf(dob) {
    if (!dob) return null;
    const b = new Date(dob), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a -= 1;
    return a >= 0 ? a : null;
}

// Bemor ruxsat bermagan: karta yopiq, faqat favqulodda kirish mumkin
function LockedCard({ id, onOpened }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    return (
        <div className="page">
            <div className="cs-locked">
                <div className="cs-locked-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                </div>
                <h1>{t("consent.lockedTitle")}</h1>
                <p>{t("consent.lockedText")}</p>
                <div className="btn-row">
                    <Link className="btn btn-secondary" to="/patients">{t("consent.back")}</Link>
                    <button type="button" className="btn cs-btn-danger" onClick={() => setOpen(true)}>{t("consent.em.open")}</button>
                </div>
            </div>
            {open && <EmergencyAccessModal patientId={id} onClose={() => setOpen(false)} onOpened={() => { setOpen(false); onOpened(); }} />}
        </div>
    );
}

const RECORD_TYPES = [
    { value: "visit", label: "Tashrif" },
    { value: "diagnosis", label: "Tashxis" },
    { value: "prescription", label: "Retsept" },
    { value: "lab_result", label: "Laboratoriya natijasi" },
    { value: "procedure", label: "Muolaja" },
];

export default function PatientDetailPage() {
    const { id } = useParams();
    const { t } = useTranslation();
    const { user } = useAuth();
    const isDoctor = user?.role === "doctor";
    const canEditProfile = user?.role === "doctor" || user?.role === "admin";

    const [patient, setPatient] = useState(null);
    const [records, setRecords] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [locked, setLocked] = useState(false);

    function loadData() {
        setLoading(true);
        setLocked(false);
        setError("");
        Promise.all([
            client.get(`/records/patients/${id}/`),
            client.get(`/records/medical-records/`, { params: { patient: id } }),
            labApi.results(id).catch(() => []),
        ])
            .then(([patientRes, recordsRes, labsRes]) => {
                setPatient(patientRes.data);
                setRecords(recordsRes.data);
                setLabs(labsRes);
            })
            .catch((err) => {
                if (err?.response?.data?.code === "consent_required") setLocked(true);
                else setError("Ma'lumotlarni yuklab bo'lmadi.");
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) return <div className="page">Yuklanmoqda...</div>;
    if (locked) return <LockedCard id={id} onOpened={loadData} />;
    if (error) return <div className="page"><div className="alert-error">{error}</div></div>;
    if (!patient) return null;

    const fullName = [patient.user.first_name, patient.user.last_name].filter(Boolean).join(" ") || patient.user.username;
    const age = ageOf(patient.date_of_birth);

    return (
        <div className="page">
            {patient.access?.via === "emergency" && (
                <div className="cs-access-bar emergency" role="status">
                    <span className="cs-siren" aria-hidden="true">!</span>
                    {t("consent.emOpenUntil", {
                        time: fmtTime(patient.access.until),
                    })}
                </div>
            )}

            <section className="pd-head">
                <PatientPhotoBox patientId={patient.id} version={patient.photo_updated_at} name={fullName}
                                 editable={user?.role === "admin" || isDoctor} />
                <div className="pd-main">
                    <div className="pd-title">
                        <h1>{fullName}</h1>
                        {patient.access?.via && (
                            <span className={`cs-via cs-via-${patient.access.via}`}>{t(`consent.via.${patient.access.via}`)}</span>
                        )}
                    </div>
                    <div className="pd-facts">
                        <div className="pd-fact">
                            <span>{t("pd.age")}</span>
                            <b>{age !== null ? t("pd.years", { n: age }) : "—"}</b>
                            {patient.date_of_birth && <small>{fmtDate(patient.date_of_birth)}</small>}
                        </div>
                        <div className="pd-fact">
                            <span>{t("patientDetail.genderLabel")}</span>
                            <b>{patient.gender ? t(`me.genderValue.${patient.gender}`, { defaultValue: patient.gender }) : "—"}</b>
                        </div>
                        <div className={`pd-fact ${patient.blood_type ? "pd-blood" : ""}`}>
                            <span>{t("patientDetail.bloodTypeLabel")}</span>
                            <b>{patient.blood_type || "—"}</b>
                        </div>
                        <div className="pd-fact">
                            <span>{t("patientDetail.userLabel")}</span>
                            <b className="pd-login">@{patient.user.username}</b>
                        </div>
                    </div>
                    {patient.allergies && (
                        <div className="pd-allergy" role="note">
                            <span aria-hidden="true">⚠</span>
                            <div><b>{t("pd.allergies")}:</b> {patient.allergies}</div>
                        </div>
                    )}
                    <div className="pd-actions">
                        {isDoctor && (
                            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                                {showForm ? t("patientDetail.cancel") : t("patientDetail.addRecord")}
                            </button>
                        )}
                        {canEditProfile && (
                            <button className="btn btn-secondary" onClick={() => setShowEdit(!showEdit)}>
                                {showEdit ? t("patientDetail.cancel") : isDoctor ? t("pe.medicalBtn") : t("patientDetail.editProfile")}
                            </button>
                        )}
                        <button
                            className="btn btn-secondary"
                            onClick={() => downloadPatientHistoryPdf(id, `kasallik_tarixi_${patient.user.username}.pdf`)}
                        >
                            ⬇ {t("patientDetail.downloadPdf")}
                        </button>
                    </div>
                </div>
            </section>

            {showEdit && (
                <EditProfileForm
                    patient={patient}
                    medicalOnly={isDoctor}
                    onCancel={() => setShowEdit(false)}
                    onSaved={(updated) => { setPatient((p) => ({ ...p, ...updated })); setShowEdit(false); }}
                />
            )}

            {showForm && (
                <NewRecordForm
                    patientId={id}
                    onCreated={() => { setShowForm(false); loadData(); }}
                />
            )}

            <PrescriptionsSection patientId={id} isDoctor={isDoctor} />
            <h2 style={{ marginTop: 28, marginBottom: 16 }}>Kasallik tarixi</h2>

            {mergeHistory(records, labs).length === 0 ? (
                <div className="table-card"><div className="empty-state">Hozircha tibbiy yozuvlar yo'q.</div></div>
            ) : (
                <div className="timeline">
                    {mergeHistory(records, labs).map(({ kind, item: r }, i) => kind === "lab" ? (
                        <div key={`lab-${r.id}`} className="timeline-item timeline-lab">
                            <div className="timeline-date">
                                {fmtDate(r.collected_at)}
                            </div>
                            <LabResultCard result={r} open={i === 0} />
                        </div>
                    ) : (
                        <div key={r.id} className="timeline-item">
                            <div className="timeline-date">
                                {fmtDate(r.visit_date)}
                            </div>
                            <div className="timeline-card">
                                <div className="timeline-title">
                                    {r.title} <span className="timeline-type">({RECORD_TYPES.find(t => t.value === r.record_type)?.label})</span>
                                </div>
                                {r.diagnosis && <p className="timeline-field"><b>Tashxis:</b> {r.diagnosis}</p>}
                                {r.treatment && <p className="timeline-field"><b>Davolash:</b> {r.treatment}</p>}
                                {r.notes && <p className="timeline-field"><b>Izoh:</b> {r.notes}</p>}
                                <div className="timeline-doctor">Shifokor: {r.created_by_name}</div>
                                <RecordAttachments recordId={r.id} isDoctor={isDoctor} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const MEDICAL_FIELDS = ["blood_type", "allergies"];
const PERSONAL_FIELDS = ["date_of_birth", "gender", "national_id", "address", "emergency_contact"];

// medicalOnly: shifokor faqat tibbiy maydonlarni ko'radi va yuboradi (backend ham boshqasini rad etadi)
function EditProfileForm({ patient, onSaved, onCancel, medicalOnly }) {
    const { t } = useTranslation();
    const fields = medicalOnly ? MEDICAL_FIELDS : [...PERSONAL_FIELDS, ...MEDICAL_FIELDS];
    const [form, setForm] = useState(Object.fromEntries(fields.map((f) => [f, patient[f] || ""])));
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSaving(true);
        // Faqat o'zgargan maydonlar
        const changed = Object.fromEntries(Object.entries(form).filter(([k, v]) => v !== (patient[k] || "")));
        if (!Object.keys(changed).length) { onCancel(); return; }
        try {
            const res = await client.patch(`/records/patients/${patient.id}/`, changed);
            onSaved(res.data);
        } catch (err) {
            setError(err?.response?.data?.detail || t("pe.error"));
            setSaving(false);
        }
    }

    const bloodOptions = form.blood_type && !BLOOD_TYPES.includes(form.blood_type) ? [form.blood_type, ...BLOOD_TYPES] : BLOOD_TYPES;

    return (
        <form onSubmit={handleSubmit} className="card pe-form">
            <h2>{medicalOnly ? t("pe.medicalTitle") : t("patientDetail.editProfileTitle")}</h2>
            {medicalOnly && <p className="pe-hint">{t("pe.doctorHint")}</p>}
            {error && <div className="alert-error">{error}</div>}

            {!medicalOnly && (
                <fieldset className="pe-group">
                    <legend>{t("pe.personal")}</legend>
                    <div className="pe-grid">
                        <div className="field">
                            <label htmlFor="pe-dob">{t("patientDetail.birthDate")}</label>
                            <input id="pe-dob" type="date" value={form.date_of_birth} onChange={set("date_of_birth")} />
                        </div>
                        <div className="field">
                            <label htmlFor="pe-gender">{t("patientDetail.genderLabel")}</label>
                            <select id="pe-gender" value={form.gender} onChange={set("gender")}>
                                <option value="">{t("patientDetail.genderNotSet")}</option>
                                <option value="M">{t("patientDetail.male")}</option>
                                <option value="F">{t("patientDetail.female")}</option>
                                <option value="O">{t("patientDetail.other")}</option>
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="pe-nid">{t("patientDetail.nationalId")}</label>
                            <input id="pe-nid" value={form.national_id} onChange={set("national_id")} autoComplete="off" />
                        </div>
                        <div className="field">
                            <label htmlFor="pe-em">{t("patientDetail.emergencyContact")}</label>
                            <input id="pe-em" type="tel" value={form.emergency_contact} onChange={set("emergency_contact")} />
                        </div>
                        <div className="field pe-wide">
                            <label htmlFor="pe-addr">{t("patientDetail.address")}</label>
                            <input id="pe-addr" value={form.address} onChange={set("address")} />
                        </div>
                    </div>
                </fieldset>
            )}

            <fieldset className="pe-group">
                <legend>{t("pe.medical")}</legend>
                <div className="pe-grid">
                    <div className="field">
                        <label htmlFor="pe-blood">{t("patientDetail.bloodTypeLabel")}</label>
                        <select id="pe-blood" value={form.blood_type} onChange={set("blood_type")}>
                            <option value="">{t("pe.unknown")}</option>
                            {bloodOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="field pe-wide">
                        <label htmlFor="pe-all">{t("pd.allergies")}</label>
                        <textarea id="pe-all" rows={2} value={form.allergies} onChange={set("allergies")} placeholder={t("pe.allergiesPh")} />
                    </div>
                </div>
            </fieldset>

            <div className="pe-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>{t("patientDetail.cancel")}</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? t("me.loading") : t("patientDetail.save")}</button>
            </div>
            {!medicalOnly && <p className="pe-hint pe-foot">{t("pe.auditNote")}</p>}
        </form>
    );
}

function NewRecordForm({ patientId, onCreated }) {
    const [form, setForm] = useState({
        record_type: "visit", title: "", diagnosis: "", treatment: "", notes: "",
        visit_date: new Date().toISOString().slice(0, 16),
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function update(field) {
        return (e) => setForm({ ...form, [field]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            await client.post("/records/medical-records/", {
                ...form,
                patient: patientId,
                visit_date: new Date(form.visit_date).toISOString(),
            });
            onCreated();
        } catch {
            setError("Yozuvni saqlab bo'lmadi. Maydonlarni tekshiring.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card">
            {error && <div className="alert-error">{error}</div>}
            <div className="field">
                <label>Yozuv turi</label>
                <select value={form.record_type} onChange={update("record_type")}>
                    {RECORD_TYPES.filter((t) => t.value !== "lab_result").map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
            </div>
            <div className="field">
                <label>Sarlavha</label>
                <input value={form.title} onChange={update("title")} required />
            </div>
            <div className="field">
                <label>Tashrif sanasi</label>
                <input type="datetime-local" value={form.visit_date} onChange={update("visit_date")} required />
            </div>
            <div className="field">
                <label>Tashxis</label>
                <input value={form.diagnosis} onChange={update("diagnosis")} />
            </div>
            <div className="field">
                <label>Davolash</label>
                <input value={form.treatment} onChange={update("treatment")} />
            </div>
            <div className="field">
                <label>Izoh</label>
                <input value={form.notes} onChange={update("notes")} />
            </div>
            <button className="btn btn-primary" style={{ width: "auto" }} disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
        </form>
    );
}
