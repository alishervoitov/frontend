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

    if (loading) return <div style={{ padding: 40 }}>Yuklanmoqda...</div>;
    if (error) return <div style={{ padding: 40 }} className="alert-error">{error}</div>;
    if (!patient) return null;

    return (
        <div style={{ padding: "32px 40px", maxWidth: 800 }}>
            <h1>{patient.user.first_name} {patient.user.last_name}</h1>
            <p style={{ color: "#55716A" }}>
                Foydalanuvchi: {patient.user.username} · Jinsi: {patient.gender || "—"} ·
                {" "}Qon guruhi: {patient.blood_type || "—"}
            </p>

            {isDoctor && (
                <button className="btn btn-primary" style={{ width: "auto", marginBottom: 24 }} onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Bekor qilish" : "+ Yangi yozuv qo'shish"}
                </button>
            )}

            {showForm && (
                <NewRecordForm
                    patientId={id}
                    onCreated={() => {
                        setShowForm(false);
                        loadData();
                    }}
                />
            )}

            <h2 style={{ marginTop: 32 }}>Kasallik tarixi</h2>
            {records.length === 0 ? (
                <p>Hozircha tibbiy yozuvlar yo'q.</p>
            ) : (
                <div style={{ borderLeft: "2px solid #C3D2CC", paddingLeft: 24, marginLeft: 6 }}>
                    {records.map((r) => (
                        <div key={r.id} style={{ marginBottom: 24, position: "relative" }}>
                            <div style={{ fontSize: 12, color: "#55716A", fontFamily: "monospace" }}>
                                {new Date(r.visit_date).toLocaleDateString("uz-UZ")}
                            </div>
                            <div style={{ background: "#fff", border: "1px solid #DCE6E2", borderRadius: 10, padding: 16, marginTop: 4 }}>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                                    {r.title} <span style={{ fontWeight: 400, fontSize: 12, color: "#55716A" }}>({RECORD_TYPES.find(t => t.value === r.record_type)?.label})</span>
                                </div>
                                {r.diagnosis && <p><b>Tashxis:</b> {r.diagnosis}</p>}
                                {r.treatment && <p><b>Davolash:</b> {r.treatment}</p>}
                                {r.notes && <p><b>Izoh:</b> {r.notes}</p>}
                                <div style={{ fontSize: 12, color: "#8AA39C" }}>Shifokor: {r.created_by_name}</div>
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
        } catch (err) {
            setError("Yozuvni saqlab bo'lmadi. Maydonlarni tekshiring.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #DCE6E2", borderRadius: 10, padding: 20, marginBottom: 24 }}>
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