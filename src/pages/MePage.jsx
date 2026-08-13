import AvatarUpload from "../components/AvatarUpload";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import client, { downloadPatientHistoryPdf } from "../api/client";
import RecordAttachments from "../components/RecordAttachments";
import PrescriptionsSection from "../components/PrescriptionsSection";

export default function MePage() {
    const { user, setUser } = useAuth();

    if (user?.role === "patient") return <PatientHome user={user} onAvatarUpdated={setUser} />;
    if (user?.role === "doctor") return <DoctorHome user={user} onAvatarUpdated={setUser} />;
    return <AdminHome user={user} onAvatarUpdated={setUser} />;
}

function PatientHome({ user, onAvatarUpdated }) {
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
            <div className="patient-header">
                <h1>Salom, {user.first_name || user.username}!</h1>
                <div className="patient-meta">Bu — sizning shaxsiy kabinetingiz.</div>
            </div>

            {loading ? (
                <div className="table-card"><div className="empty-state">Yuklanmoqda...</div></div>
            ) : (
                <>
                    <div className="card">
                        <div className="profile-card-row">
                            <div className="profile-card-fields">
                                <h2 style={{ marginBottom: 12 }}>Profil ma'lumotlari</h2>
                                <p className="timeline-field"><b>Jinsi:</b> {profile?.gender || "kiritilmagan"}</p>
                                <p className="timeline-field"><b>Qon guruhi:</b> {profile?.blood_type || "kiritilmagan"}</p>
                                <p className="timeline-field"><b>Allergiyalar:</b> {profile?.allergies || "kiritilmagan"}</p>
                                <p className="timeline-field"><b>Tibbiy yozuvlar soni:</b> {profile?.records_count ?? 0}</p>
                            </div>
                            <AvatarUpload user={user} onUpdated={onAvatarUpdated} shape="square" size="fill" />
                        </div>
                    </div>

                    <PrescriptionsSection patientId={profile?.id} isDoctor={false} />
                    <div className="page-head">
                        <h2>Kasallik tarixim</h2>
                        <button className="btn btn-secondary" style={{ width: "auto" }} onClick={handleDownload} disabled={downloading}>
                            {downloading ? "Tayyorlanmoqda..." : "⬇ PDF yuklab olish"}
                        </button>
                    </div>

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
                                        <div className="timeline-title">{r.title}</div>
                                        {r.diagnosis && <p className="timeline-field"><b>Tashxis:</b> {r.diagnosis}</p>}
                                        {r.treatment && <p className="timeline-field"><b>Davolash:</b> {r.treatment}</p>}
                                        <div className="timeline-doctor">Shifokor: {r.created_by_name}</div>
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
    return (
        <div className="page">
            <div className="profile-header-row">
                <div className="patient-header" style={{ marginBottom: 0 }}>
                    <h1>Xush kelibsiz, {user.first_name || user.username}!</h1>
                    <div className="patient-meta">Bemorlar ro'yxatini ko'rish va tibbiy yozuv qo'shish uchun quyidagi bo'limga o'ting.</div>
                </div>
                <AvatarUpload user={user} onUpdated={onAvatarUpdated} />
            </div>
            <AvatarUpload user={user} onUpdated={onAvatarUpdated} />
            <Link to="/patients" className="btn btn-primary" style={{ width: "auto", textDecoration: "none" }}>
                Bemorlar ro'yxatiga o'tish →
            </Link>
        </div>
    );
}

function AdminHome({ user, onAvatarUpdated }) {
    return (
        <div className="page">
            <div className="profile-header-row">
                <div className="patient-header" style={{ marginBottom: 0 }}>
                    <h1>Xush kelibsiz, {user.first_name || user.username}!</h1>
                    <div className="patient-meta">Administrator paneli.</div>
                </div>
                <AvatarUpload user={user} onUpdated={onAvatarUpdated} />
            </div>
            <AvatarUpload user={user} onUpdated={onAvatarUpdated} />
            <Link to="/patients" className="btn btn-primary" style={{ width: "auto", textDecoration: "none" }}>
                Bemorlar ro'yxatiga o'tish →
            </Link>
        </div>
    );
}