import { useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);
        try {
            const res = await client.post("/auth/password-reset/", { email });
            setMessage(res.data.detail);
        } catch {
            setError("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">MedKarta</div>
                <div className="auth-sub">Parolni tiklash</div>

                {message && <div className="alert" style={{ background: "var(--success-tint)", color: "#235940", padding: "10px 12px", borderRadius: 6, fontSize: "0.85rem", marginBottom: 14 }}>{message}</div>}
                {error && <div className="alert-error">{error}</div>}

                {!message && (
                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label>Email manzilingiz</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={loading}>
                            {loading ? "Yuborilmoqda..." : "Tiklash havolasini yuborish"}
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