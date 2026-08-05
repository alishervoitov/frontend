import { useEffect, useState } from "react";
import client from "../api/client";

export default function AdminUsersPage() {
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
                <h1>Foydalanuvchilar</h1>
                <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Bekor qilish" : "+ Yangi hisob yaratish"}
                </button>
            </div>

            {showForm && <NewUserForm onCreated={() => { setShowForm(false); loadUsers(); }} />}

            <div className="table-card">
                {loading ? (
                    <div className="empty-state">Yuklanmoqda...</div>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>F.I.Sh.</th>
                            <th>Foydalanuvchi nomi</th>
                            <th>Email</th>
                            <th>Rol</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.first_name} {u.last_name}</td>
                                <td className="cell-muted">{u.username}</td>
                                <td className="cell-muted">{u.email || "—"}</td>
                                <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function NewUserForm({ onCreated }) {
    const [form, setForm] = useState({
        username: "", first_name: "", last_name: "", email: "", password: "", role: "doctor",
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
            await client.post("/auth/users/", form);
            onCreated();
        } catch (err) {
            const data = err.response?.data;
            const firstError = data && Object.values(data)[0];
            setError(Array.isArray(firstError) ? firstError[0] : firstError || "Xatolik yuz berdi.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card">
            {error && <div className="alert-error">{error}</div>}
            <div className="field">
                <label>Rol</label>
                <select value={form.role} onChange={update("role")}>
                    <option value="doctor">Shifokor</option>
                    <option value="admin">Administrator</option>
                </select>
            </div>
            <div className="field">
                <label>Foydalanuvchi nomi</label>
                <input value={form.username} onChange={update("username")} required />
            </div>
            <div className="field">
                <label>Ism</label>
                <input value={form.first_name} onChange={update("first_name")} required />
            </div>
            <div className="field">
                <label>Familiya</label>
                <input value={form.last_name} onChange={update("last_name")} required />
            </div>
            <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={update("email")} />
            </div>
            <div className="field">
                <label>Parol</label>
                <input type="password" value={form.password} onChange={update("password")} required />
            </div>
            <button className="btn btn-primary" style={{ width: "auto" }} disabled={saving}>
                {saving ? "Yaratilmoqda..." : "Yaratish"}
            </button>
        </form>
    );
}