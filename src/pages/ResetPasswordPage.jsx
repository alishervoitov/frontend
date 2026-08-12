import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import client from "../api/client";

export default function ResetPasswordPage() {
    const { uid, token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Parollar mos kelmadi.");
            return;
        }

        setLoading(true);
        try {
            await client.post("/auth/password-reset-confirm/", {
                uid, token, new_password: password,
            });
            setSuccess(true);
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(Array.isArray(detail) ? detail[0] : detail || "Havola yaroqsiz yoki muddati tugagan.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">MedKarta</div>
                <div className="auth-sub">Yangi parol o'rnatish</div>

                {success ? (
                    <div style={{ background: "var(--success-tint)", color: "#235940", padding: "10px 12px", borderRadius: 6, fontSize: "0.85rem" }}>
                        Parol muvaffaqiyatli yangilandi. Kirish sahifasiga yo'naltirilmoqdasiz...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert-error">{error}</div>}
                        <div className="field">
                            <label>Yangi parol</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
                        </div>
                        <div className="field">
                            <label>Yangi parolni tasdiqlang</label>
                            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={loading}>
                            {loading ? "Saqlanmoqda..." : "Parolni yangilash"}
                        </button>
                    </form>
                )}

                <div className="auth-switch">
                    <Link to="/login">← Kirish sahifasiga qaytish</Link>
                </div>
            </div>
        </div>
    );
}