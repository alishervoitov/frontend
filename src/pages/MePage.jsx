import AvatarUpload from "../components/AvatarUpload";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import client, { downloadPatientHistoryPdf } from "../api/client";
import PrescriptionsSection from "../components/PrescriptionsSection";
import RecordAttachments from "../components/RecordAttachments";
import { LabResultCard } from "../components/LabResultsSection";
import { labApi, mergeHistory } from "../api/labs";

export default function MePage() {
    const { user, setUser } = useAuth();

    if (user?.role === "patient") return <PatientHome user={user} onAvatarUpdated={setUser} />;
    if (user?.role === "doctor") return <DoctorHome user={user} onAvatarUpdated={setUser} />;
    if (user?.role === "lab") return <LabHome user={user} onAvatarUpdated={setUser} />;
    return <AdminHome user={user} onAvatarUpdated={setUser} />;
}

function PatientHome({ user, onAvatarUpdated }) {
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [records, setRecords] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        Promise.all([
            client.get("/records/patients/me/"),
            client.get("/records/medical-records/"),
            labApi.results().catch(() => []),
        ])
            .then(([p, r, l]) => { setProfile(p.data); setRecords(r.data); setLabs(l); })
            .finally(() => setLoading(false));
    }, []);
    const history = mergeHistory(records, labs);

    async function handleDownload() {
        setDownloading(true);
        try {
            await downloadPatientHistoryPdf(profile.id, `kasallik_tarixi_${user.username}.pdf`);
        } catch {
            alert("PDF yuklab bo'lmadi.");
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="page">
            <div className="patient-header">
                <h1>{t("me.hello", { name: user.first_name || user.username })}</h1>
                <div className="patient-meta">{t("me.patientSubtitle")}</div>
            </div>

            {loading ? (
                <div className="table-card"><div className="empty-state">{t("me.loading")}</div></div>
            ) : (
                <>
                    <div className="card profile-photo-card">
                        <div className="profile-photo-fields">
                        <h2 style={{ marginBottom: 12 }}>{t("me.profileInfo")}</h2>
                        <p className="timeline-field"><b>{t("me.fullName", { defaultValue: "F.I.Sh." })}:</b> {[user.last_name, user.first_name].filter(Boolean).join(" ") || user.username}</p>
                        <p className="timeline-field"><b>{t("me.gender")}:</b> {profile?.gender ? t(`me.genderValue.${profile.gender}`, { defaultValue: profile.gender }) : t("me.notProvided")}</p>
                        <p className="timeline-field"><b>{t("me.bloodType")}:</b> {profile?.blood_type || t("me.notProvided")}</p>
                        <p className="timeline-field"><b>{t("me.allergies")}:</b> {profile?.allergies || t("me.notProvided")}</p>
                        <p className="timeline-field"><b>{t("me.recordsCount")}:</b> {profile?.records_count ?? 0}</p>
                        <Link to="/my-access" className="q-back profile-access-link">{t("access.link")} →</Link>
                        </div>
                        <AvatarUpload user={user} onUpdated={onAvatarUpdated} shape="portrait" />
                    </div>

                    <PrescriptionsSection patientId={profile?.id} isDoctor={false} />

                    <div className="page-head">
                        <h2>{t("me.myHistory")}</h2>
                        <button className="btn btn-secondary" style={{ width: "auto" }} onClick={handleDownload} disabled={downloading}>
                            {downloading ? t("me.preparing") : `⬇ ${t("me.downloadPdf")}`}
                        </button>
                    </div>

                    {history.length === 0 ? (
                        <div className="table-card"><div className="empty-state">{t("me.noRecords")}</div></div>
                    ) : (
                        <div className="timeline">
                            {history.map(({ kind, item: r }, i) => kind === "lab" ? (
                                <div key={`lab-${r.id}`} className="timeline-item timeline-lab">
                                    <div className="timeline-date">
                                        {new Date(r.collected_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                                    </div>
                                    <LabResultCard result={r} open={i === 0} />
                                </div>
                            ) : (
                                <div key={r.id} className="timeline-item">
                                    <div className="timeline-date">
                                        {new Date(r.visit_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                                    </div>
                                    <div className="timeline-card">
                                        <div className="timeline-title">{r.title}</div>
                                        {r.diagnosis && <p className="timeline-field"><b>{t("patientDetail.diagnosis")}:</b> {r.diagnosis}</p>}
                                        {r.treatment && <p className="timeline-field"><b>{t("patientDetail.treatment")}:</b> {r.treatment}</p>}
                                        <div className="timeline-doctor">{t("me.doctorLabel")}: {r.created_by_name}</div>
                                        <RecordAttachments recordId={r.id} isDoctor={false} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function DoctorHome({ user, onAvatarUpdated }) {
    const { t } = useTranslation();
    return (
        <div className="page">
            <div className="card">
                <div className="profile-card-row">
                    <div className="profile-card-fields">
                        <h1 style={{ marginBottom: 6 }}>{t("me.welcome", { name: user.first_name || user.username })}</h1>
                        <p className="patient-meta" style={{ margin: 0 }}>{t("me.doctorSubtitle")}</p>
                        <Link to="/patients" className="btn btn-primary" style={{ width: "auto", textDecoration: "none", marginTop: 16, display: "inline-flex" }}>
                            {t("me.goToPatients")}
                        </Link>
                    </div>
                    <AvatarUpload user={user} onUpdated={onAvatarUpdated} shape="square" size="fill" />
                </div>
            </div>
        </div>
    );
}

function LabHome({ user, onAvatarUpdated }) {
    const { t } = useTranslation();
    return (
        <div className="page">
            <div className="card">
                <div className="profile-card-row">
                    <div className="profile-card-fields">
                        <h1 style={{ marginBottom: 6 }}>{t("me.welcome", { name: user.first_name || user.username })}</h1>
                        <p className="patient-meta" style={{ margin: 0 }}>{t("labs.homeSubtitle")}</p>
                        <Link to="/lab" className="btn btn-primary" style={{ width: "auto", textDecoration: "none", marginTop: 16, display: "inline-flex" }}>
                            {t("labs.goToLab")}
                        </Link>
                    </div>
                    <AvatarUpload user={user} onUpdated={onAvatarUpdated} shape="square" size="fill" />
                </div>
            </div>
        </div>
    );
}

function AdminHome({ user, onAvatarUpdated }) {
    const { t } = useTranslation();
    return (
        <div className="page">
            <div className="card">
                <div className="profile-card-row">
                    <div className="profile-card-fields">
                        <h1 style={{ marginBottom: 6 }}>{t("me.welcome", { name: user.first_name || user.username })}</h1>
                        <p className="patient-meta" style={{ margin: 0 }}>{t("me.adminSubtitle")}</p>
                        <Link to="/patients" className="btn btn-primary" style={{ width: "auto", textDecoration: "none", marginTop: 16, display: "inline-flex" }}>
                            {t("me.goToPatients")}
                        </Link>
                    </div>
                    <AvatarUpload user={user} onUpdated={onAvatarUpdated} shape="square" size="fill" />
                </div>
            </div>
        </div>
    );
}