import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";

export default function PrescriptionsSection({ patientId, isDoctor }) {
    const { t } = useTranslation();

    const FREQUENCY_OPTIONS = [
        { value: "once", label: t("frequency.once") },
        { value: "daily_1", label: t("frequency.daily_1") },
        { value: "daily_2", label: t("frequency.daily_2") },
        { value: "daily_3", label: t("frequency.daily_3") },
        { value: "daily_4", label: t("frequency.daily_4") },
        { value: "weekly", label: t("frequency.weekly") },
        { value: "as_needed", label: t("frequency.as_needed") },
    ];

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
            alert(t("patients.loadError"));
        }
    }

    return (
        <div style={{ marginBottom: 28 }}>
            <div className="page-head">
                <h2>{t("prescriptions.title")}</h2>
                {isDoctor && (
                    <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setShowForm(!showForm)}>
                        {showForm ? t("prescriptions.cancel") : t("prescriptions.add")}
                    </button>
                )}
            </div>

            {showForm && (
                <NewPrescriptionForm
                    patientId={patientId}
                    frequencyOptions={FREQUENCY_OPTIONS}
                    onCreated={() => { setShowForm(false); load(); }}
                />
            )}

            {loading ? (
                <div className="table-card"><div className="empty-state">{t("me.loading")}</div></div>
            ) : prescriptions.length === 0 ? (
                <div className="table-card"><div className="empty-state">{t("prescriptions.noPrescriptions")}</div></div>
            ) : (
                <div className="table-card">
                    <table>
                        <thead>
                        <tr>
                            <th>{t("prescriptions.medication")}</th>
                            <th>{t("prescriptions.dosage")}</th>
                            <th>{t("prescriptions.frequency")}</th>
                            <th>{t("prescriptions.duration")}</th>
                            <th>{t("prescriptions.startDate")}</th>
                            <th>{t("prescriptions.status")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {prescriptions.map((p) => (
                            <tr key={p.id}>
                                <td><b>{p.medication_name}</b></td>
                                <td className="cell-muted">{p.dosage}</td>
                                <td className="cell-muted">{FREQUENCY_OPTIONS.find(f => f.value === p.frequency)?.label || p.frequency_display}</td>
                                <td className="cell-muted">{p.duration_days} {t("prescriptions.days")}</td>
                                <td className="cell-muted">{p.start_date}</td>
                                <td>
                                    {isDoctor ? (
                                        <button
                                            className={`badge ${p.is_active ? "badge-doctor" : "badge-admin"}`}
                                            style={{ border: "none", cursor: "pointer" }}
                                            onClick={() => toggleActive(p)}
                                        >
                                            {p.is_active ? t("prescriptions.active") : t("prescriptions.expired")}
                                        </button>
                                    ) : (
                                        <span className={`badge ${p.is_active ? "badge-doctor" : "badge-admin"}`}>
                        {p.is_active ? t("prescriptions.active") : t("prescriptions.expired")}
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

function NewPrescriptionForm({ patientId, frequencyOptions, onCreated }) {
    const { t } = useTranslation();
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
            setError(t("patients.loadError"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card">
            {error && <div className="alert-error">{error}</div>}
            <div className="form-row" style={{ display: "flex", gap: 12 }}>
                <div className="field" style={{ flex: 2 }}>
                    <label>{t("prescriptions.medicationName")}</label>
                    <input value={form.medication_name} onChange={update("medication_name")} required />
                </div>
                <div className="field" style={{ flex: 1 }}>
                    <label>{t("prescriptions.dosage")}</label>
                    <input value={form.dosage} onChange={update("dosage")} placeholder="500mg" required />
                </div>
            </div>
            <div className="form-row" style={{ display: "flex", gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                    <label>{t("prescriptions.frequency")}</label>
                    <select value={form.frequency} onChange={update("frequency")}>
                        {frequencyOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>
                <div className="field" style={{ flex: 1 }}>
                    <label>{t("prescriptions.durationDays")}</label>
                    <input type="number" min="1" value={form.duration_days} onChange={update("duration_days")} required />
                </div>
                <div className="field" style={{ flex: 1 }}>
                    <label>{t("prescriptions.startDate")}</label>
                    <input type="date" value={form.start_date} onChange={update("start_date")} required />
                </div>
            </div>
            <div className="field">
                <label>{t("prescriptions.instructions")}</label>
                <input value={form.instructions} onChange={update("instructions")} />
            </div>
            <button className="btn btn-primary" style={{ width: "auto" }} disabled={saving}>
                {saving ? t("auth.saving") : t("prescriptions.save")}
            </button>
        </form>
    );
}