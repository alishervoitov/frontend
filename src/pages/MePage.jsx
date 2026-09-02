import AvatarUpload from "../components/AvatarUpload";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import client, { downloadPatientHistoryPdf } from "../api/client";
import PrescriptionsSection from "../components/PrescriptionsSection";
import RecordAttachments from "../components/RecordAttachments";

export default function MePage() {
    const { user, setUser } = useAuth();

    if (user?.role === "patient") return <PatientHome user={user} onAvatarUpdated={setUser} />;
    if (user?.role === "doctor") return <DoctorHome user={user} onAvatarUpdated={setUser} />;
    return <AdminHome user={user} onAvatarUpdated={setUser} />;
}

function PatientHome({ user, onAvatarUpdated }) {
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        Promise.all([
            client.get("/records/patients/me/"),
            client.get("/records/medical-records/"),
        ])
            .then(([p, r]) => { setProfile(p.data); setRecords(r.data); })
            .finally(() => setLoading(false));
    }, []);

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
            <div className="profile-header-row">
                <div className="patient-header" style={{ marginBottom: 0 }}>
                    <h1>{t("me.hello", { name: user.first_name || user.username })}</h1>
                    <div className="patient-meta">{t("me.patientSubtitle")}</div>
                </div>
                <AvatarUpload user={user} onUpdated={onAvatarUpdated} />
            </div>

            {loading ? (
                <div className="table-card"><div className="empty-state">{t("me.loading")}</div></div>
            ) : (
                <>
                    <div className="card">
                        <h2 style={{ marginBottom: 12 }}>{t("me.profileInfo")}</h2>
                        <p className="timeline-field"><b>{t("me.gender")}:</b> {profile?.gender || t("me.notProvided")}</p>
                        <p className="timeline-field"><b>{t("me.bloodType")}:</b> {profile?.blood_type || t("me.notProvided")}</p>
                        <p className="timeline-field"><b>{t("me.allergies")}:</b> {profile?.allergies || t("me.notProvided")}</p>
                        <p className="timeline-field"><b>{t("me.recordsCount")}:</b> {profile?.records_count ?? 0}</p>
                    </div>

                    <PrescriptionsSection patientId={profile?.id} isDoctor={false} />

                    <div className="page-head">
                        <h2>{t("me.myHistory")}</h2>
                        <button className="btn btn-secondary" style={{ width: "auto" }} onClick={handleDownload} disabled={downloading}>
                            {downloading ? t("me.preparing") : `⬇ ${t("me.downloadPdf")}`}
                        </button>
                    </div>

                    {records.length === 0 ? (
                        <div className="table-card"><div className="empty-state">{t("me.noRecords")}</div></div>
                    ) : (
                        <div className="timeline">
                            {records.map((r) => (
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