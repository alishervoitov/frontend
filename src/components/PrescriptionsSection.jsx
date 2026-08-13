import { useEffect, useState } from "react";
import client from "../api/client";

const FREQUENCY_OPTIONS = [
    { value: "once", label: "Bir marta" },
    { value: "daily_1", label: "Kuniga 1 marta" },
    { value: "daily_2", label: "Kuniga 2 marta" },
    { value: "daily_3", label: "Kuniga 3 marta" },
    { value: "daily_4", label: "Kuniga 4 marta" },
    { value: "weekly", label: "Haftada bir marta" },
    { value: "as_needed", label: "Zarurat bo'yicha" },
];

export default function PrescriptionsSection({ patientId, isDoctor }) {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    function load() {
        setLoading(true);
        client.get("/records/prescriptions/", { params: { patient: patientId } })
            .then((res) => setPrescriptions(res.data))
            .finally(() => setLoading(false));
    }

    useEffect(load, [patientId]);

    async function toggleActive(prescription) {
        try {
            await client.patch(`/records/prescriptions/${prescription.id}/`, {
                is_active: !prescription.is_active,
            });
            load();
        } catch {
            alert("O'zgartirib bo'lmadi.");
        }
    }

    return (
        <div style={{ marginBottom: 28 }}>
            <div className="page-head">
                <h2>Retseptlar</h2>
                {isDoctor && (
                    <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setShowForm(!showForm)}>
                        {showForm ? "Bekor qilish" : "+ Retsept yozish"}
                    </button>
                )}
            </div>

            {showForm && (
                <NewPrescriptionForm
                    patientId={patientId}
                    onCreated={() => { setShowForm(false); load(); }}
                />
            )}

            {loading ? (
                <div className="table-card"><div className="empty-state">Yuklanmoqda...</div></div>
            ) : prescriptions.length === 0 ? (
                <div className="table-card"><div className="empty-state">Hozircha retseptlar yo'q.</div></div>
            ) : (
                <div className="table-card">
                    <table>
                        <thead>
                        <tr>
                            <th>Dori</th>
                            <th>Dozasi</th>
                            <th>Chastota</th>
                            <th>Davomiyligi</th>
                            <th>Boshlangan sana</th>
                            <th>Holati</th>
                        </tr>
                        </thead>
                        <tbody>
                        {prescriptions.map((p) => (
                            <tr key={p.id}>
                                <td><b>{p.medication_name}</b></td>
                                <td className="cell-muted">{p.dosage}</td>
                                <td className="cell-muted">{p.frequency_display}</td>
                                <td className="cell-muted">{p.duration_days} kun</td>
                                <td className="cell-muted">{p.start_date}</td>
                                <td>
                                    {isDoctor ? (
                                        <button
                                            className={`badge ${p.is_active ? "badge-doctor" : "badge-admin"}`}
                                            style={{ border: "none", cursor: "pointer" }}
                                            onClick={() => toggleActive(p)}
                                        >
                                            {p.is_active ? "Faol" : "Tugagan"}
                                        </button>
                                    ) : (
                                        <span className={`badge ${p.is_active ? "badge-doctor" : "badge-admin"}`}>
                        {p.is_active ? "Faol" : "Tugagan"}
                      </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function NewPrescriptionForm({ patientId, onCreated }) {
    const [form, setForm] = useState({
        medication_name: "", dosage: "", frequency: "daily_1",
        duration_days: 7, instructions: "",
        start_date: new Date().toISOString().slice(0, 10),
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
            await client.post("/records/prescriptions/", { ...form, patient: patientId });
            onCreated();
        } catch {
            setError("Retseptni saqlab bo'lmadi. Maydonlarni tekshiring.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card">
            {error && <div className="alert-error">{error}</div>}
            <div className="form-row" style={{ display: "flex", gap: 12 }}>
                <div className="field" style={{ flex: 2 }}>
                    <label>Dori nomi</label>
                    <input value={form.medication_name} onChange={update("medication_name")} required />
                </div>
                <div className="field" style={{ flex: 1 }}>
                    <label>Dozasi</label>
                    <input value={form.dosage} onChange={update("dosage")} placeholder="500mg" required />
                </div>
            </div>
            <div className="form-row" style={{ display: "flex", gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                    <label>Chastota</label>
                    <select value={form.frequency} onChange={update("frequency")}>
                        {FREQUENCY_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>
                <div className="field" style={{ flex: 1 }}>
                    <label>Davomiyligi (kun)</label>
                    <input type="number" min="1" value={form.duration_days} onChange={update("duration_days")} required />
                </div>
                <div className="field" style={{ flex: 1 }}>
                    <label>Boshlangan sana</label>
                    <input type="date" value={form.start_date} onChange={update("start_date")} required />
                </div>
            </div>
            <div className="field">
                <label>Qo'shimcha ko'rsatmalar</label>
                <input value={form.instructions} onChange={update("instructions")} placeholder="Ovqatdan keyin ichilsin..." />
            </div>
            <button className="btn btn-primary" style={{ width: "auto" }} disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
        </form>
    );
}