import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const RECORD_TYPES = [
    { value: "visit", label: "Tashrif" },
    { value: "diagnosis", label: "Tashxis" },
    { value: "prescription", label: "Retsept" },
    { value: "lab_result", label: "Laboratoriya natijasi" },
    { value: "procedure", label: "Muolaja" },
];

export default function PatientDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const isDoctor = user?.role === "doctor";

    const [patient, setPatient] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    function loadData() {
        setLoading(true);
        Promise.all([
            client.get(`/records/patients/${id}/`),
            client.get(`/records/medical-records/`, { params: { patient: id } }),
        ])
            .then(([patientRes, recordsRes]) => {
                setPatient(patientRes.data);
                setRecords(recordsRes.data);
            })
            .catch(() => setError("Ma'lumotlarni yuklab bo'lmadi."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) return <div className="page">Yuklanmoqda...</div>;
    if (error) return <div className="page"><div className="alert-error">{error}</div></div>;
    if (!patient) return null;

    return (
        <div className="page">
            <div className="patient-header">
                <h1>{patient.user.first_name} {patient.user.last_name}</h1>
                <div className="patient-meta">
                    Foydalanuvchi: <b>{patient.user.username}</b> · Jinsi: <b>{patient.gender || "—"}</b> ·{" "}
                    Qon guruhi: <b>{patient.blood_type || "—"}</b>
                </div>
            </div>

            {isDoctor && (
                <button className="btn btn-primary" style={{ width: "auto", marginBottom: 20 }} onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Bekor qilish" : "+ Yangi yozuv qo'shish"}
                </button>
            )}

            {showForm && (
                <NewRecordForm
                    patientId={id}
                    onCreated={() => { setShowForm(false); loadData(); }}
                />
            )}

            <h2 style={{ marginTop: 28, marginBottom: 16 }}>Kasallik tarixi</h2>

            {records.length === 0 ? (
                <div className="table-card"><div className="empty-state">Hozircha tibbiy yozuvlar yo'q.</div></div>
            ) : (
                <div className="timeline">
                    {records.map((r) => (
                        <div key={r.id} className="timeline-item">
                            <div className="timeline-date">
                                {new Date(r.visit_date).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" })}
                            </div>
                            <div className="timeline-card">
                                <div className="timeline-title">
                                    {r.title} <span className="timeline-type">({RECORD_TYPES.find(t => t.value === r.record_type)?.label})</span>
                                </div>
                                {r.diagnosis && <p className="timeline-field"><b>Tashxis:</b> {r.diagnosis}</p>}
                                {r.treatment && <p className="timeline-field"><b>Davolash:</b> {r.treatment}</p>}
                                {r.notes && <p className="timeline-field"><b>Izoh:</b> {r.notes}</p>}
                                <div className="timeline-doctor">Shifokor: {r.created_by_name}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
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
                    {RECORD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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