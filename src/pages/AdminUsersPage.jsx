import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { SPECIALTIES, specLabel } from "../api/specialty";

export default function AdminUsersPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    function loadUsers() {
        setLoading(true);
        client.get("/auth/users/").then((res) => setUsers(res.data)).finally(() => setLoading(false));
    }

    useEffect(loadUsers, []);

    return (
        <div className="page">
            <div className="page-head">
                <h1>{t("admin.usersTitle")}</h1>
                <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setShowForm(!showForm)}>
                    {showForm ? t("prescriptions.cancel") : t("admin.createUser")}
                </button>
            </div>

            {showForm && <NewUserForm onCreated={() => { setShowForm(false); loadUsers(); }} />}

            <div className="table-card">
                {loading ? (
                    <div className="empty-state">{t("admin.loading")}</div>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>{t("patients.fullName")}</th>
                            <th>{t("patients.username")}</th>
                            <th>{t("admin.email")}</th>
                            <th>{t("admin.role")}</th>
                            <th>{t("queue.specialty")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.first_name} {u.last_name}</td>
                                <td className="cell-muted">{u.username}</td>
                                <td className="cell-muted">{u.email || "—"}</td>
                                <td><span className={`badge badge-${u.role}`}>{t(`roles.${u.role}`)}</span></td>
                                <td>{u.role === "doctor" ? <SpecialtyCell user={u} /> : <span className="cell-muted">—</span>}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// Mavjud shifokorning mutaxassisligini jadvalning o'zida o'zgartirish
function SpecialtyCell({ user }) {
    const { t } = useTranslation();
    const [value, setValue] = useState(user.specialty || "");
    const [state, setState] = useState("");

    async function change(e) {
        const next = e.target.value;
        const prev = value;
        setValue(next);
        setState("saving");
        try {
            await client.patch(`/queue/doctors/${user.id}/profile/`, { specialty: next });
            setState("saved");
        } catch {
            setValue(prev);
            setState("error");
        }
    }

    return (
        <span className="q-spec-cell">
            <select className={`q-select q-select-sm ${value ? "" : "q-select-empty"}`} value={value} onChange={change}>
                <option value="">{t("queue.selectSpecialty")}</option>
                {SPECIALTIES.map((c) => <option key={c} value={c}>{specLabel(t, c)}</option>)}
            </select>
            {state === "saved" && <span className="q-ok">✓</span>}
            {state === "error" && <span className="q-err">!</span>}
        </span>
    );
}

function NewUserForm({ onCreated }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        username: "", first_name: "", last_name: "", email: "", password: "", role: "doctor",
        specialty: "", room: "",
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
            const payload = form.role === "doctor" ? form : { ...form, specialty: "", room: "" };
            await client.post("/auth/users/", payload);
            onCreated();
        } catch (err) {
            const data = err.response?.data;
            const firstError = data && Object.values(data)[0];
            setError(Array.isArray(firstError) ? firstError[0] : firstError || t("auth.loginError"));
        } finally {
            setSaving(false);
        }
        {saving ? t("auth.saving") : t("admin.createButton")}
    }

    return (
        <form onSubmit={handleSubmit} className="card">
            {error && <div className="alert-error">{error}</div>}
            <div className="field">
                <label>{t("admin.roleField")}</label>
                <select value={form.role} onChange={update("role")}>
                    <option value="doctor">{t("admin.doctorRole")}</option>
                    <option value="admin">{t("admin.adminRole")}</option>
                </select>
            </div>
            {form.role === "doctor" && (
                <div className="q-form-grid q-form-grid-2">
                    <div className="field">
                        <label>{t("queue.specialty")}</label>
                        <select className="q-select" value={form.specialty} onChange={update("specialty")} required>
                            <option value="">{t("queue.selectSpecialty")}</option>
                            {SPECIALTIES.map((c) => <option key={c} value={c}>{specLabel(t, c)}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label>{t("queue.room")}</label>
                        <input value={form.room} onChange={update("room")} maxLength={20} />
                    </div>
                </div>
            )}
            <div className="field">
                <label>{t("auth.username")}</label>
                <input value={form.username} onChange={update("username")} required />
            </div>
            <div className="field">
                <label>{t("auth.firstName")}</label>
                <input value={form.first_name} onChange={update("first_name")} required />
            </div>
            <div className="field">
                <label>{t("auth.lastName")}</label>
                <input value={form.last_name} onChange={update("last_name")} required />
            </div>
            <div className="field">
                <label>{t("auth.email")}</label>
                <input type="email" value={form.email} onChange={update("email")} />
            </div>
            <div className="field">
                <label>{t("auth.password")}</label>
                <input type="password" value={form.password} onChange={update("password")} required />
            </div>
            <button className="btn btn-primary" style={{ width: "auto" }} disabled={saving}>
                {saving ? t("auth.saving") : t("prescriptions.save").replace("Saqlash", "Yaratish")}
            </button>
        </form>
    );
}