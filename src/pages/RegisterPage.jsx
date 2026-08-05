import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "", first_name: "", last_name: "",
        email: "", phone: "", password: "", password_confirm: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function update(field) {
        return (e) => setForm({ ...form, [field]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(form);
            navigate("/me");
        } catch (err) {
            const data = err.response?.data;
            const firstError = data && Object.values(data)[0];
            setError(Array.isArray(firstError) ? firstError[0] : firstError || "Xatolik yuz berdi.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">MedKarta</div>
                <div className="auth-sub">Bemor sifatida ro'yxatdan o'tish</div>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
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
                        <input type="email" value={form.email} onChange={update("email")} required />
                    </div>
                    <div className="field">
                        <label>Telefon</label>
                        <input value={form.phone} onChange={update("phone")} placeholder="+998901234567" />
                    </div>
                    <div className="field">
                        <label>Parol</label>
                        <input type="password" value={form.password} onChange={update("password")} required />
                    </div>
                    <div className="field">
                        <label>Parolni tasdiqlang</label>
                        <input type="password" value={form.password_confirm} onChange={update("password_confirm")} required />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
                    </button>
                </form>

                <div className="auth-switch">
                    Hisobingiz bormi? <Link to="/login">Kirish</Link>
                </div>
            </div>
        </div>
    );
}