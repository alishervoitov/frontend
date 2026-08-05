import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

export default function MePage() {
    const { user } = useAuth();

    if (user?.role === "patient") return <PatientHome user={user} />;
    if (user?.role === "doctor") return <DoctorHome user={user} />;
    return <AdminHome user={user} />;
}

function PatientHome({ user }) {
    const [profile, setProfile] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            client.get("/records/patients/me/"),
            client.get("/records/medical-records/"),
        ])
            .then(([p, r]) => { setProfile(p.data); setRecords(r.data); })
            .finally(() => setLoading(false));
    }, []);

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
                        <h2 style={{ marginBottom: 12 }}>Profil ma'lumotlari</h2>
                        <p className="timeline-field"><b>Jinsi:</b> {profile?.gender || "kiritilmagan"}</p>
                        <p className="timeline-field"><b>Qon guruhi:</b> {profile?.blood_type || "kiritilmagan"}</p>
                        <p className="timeline-field"><b>Allergiyalar:</b> {profile?.allergies || "kiritilmagan"}</p>
                        <p className="timeline-field"><b>Tibbiy yozuvlar soni:</b> {profile?.records_count ?? 0}</p>
                    </div>

                    <h2 style={{ marginTop: 28, marginBottom: 16 }}>Kasallik tarixim</h2>
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

function DoctorHome({ user }) {
    return (
        <div className="page">
            <div className="patient-header">
                <h1>Xush kelibsiz, {user.first_name || user.username}!</h1>
                <div className="patient-meta">Bemorlar ro'yxatini ko'rish va tibbiy yozuv qo'shish uchun quyidagi bo'limga o'ting.</div>
            </div>
            <Link to="/patients" className="btn btn-primary" style={{ width: "auto", textDecoration: "none" }}>
                Bemorlar ro'yxatiga o'tish →
            </Link>
        </div>
    );
}

function AdminHome({ user }) {
    return (
        <div className="page">
            <div className="patient-header">
                <h1>Xush kelibsiz, {user.first_name || user.username}!</h1>
                <div className="patient-meta">Administrator paneli.</div>
            </div>
            <Link to="/patients" className="btn btn-primary" style={{ width: "auto", textDecoration: "none" }}>
                Bemorlar ro'yxatiga o'tish →
            </Link>
        </div>
    );
}