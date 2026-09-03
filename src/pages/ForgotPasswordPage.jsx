import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
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
            setError(t("auth.loginError"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div style={{ position: "absolute", top: 20, right: 20 }}>
                <LanguageSwitcher />
            </div>
            <div className="auth-card">
                <div className="auth-brand">{t("app.name")}</div>
                <div className="auth-sub">{t("auth.resetPasswordTitle")}</div>

                {message && (
                    <div style={{ background: "var(--success-tint)", color: "#235940", padding: "10px 12px", borderRadius: 6, fontSize: "0.85rem", marginBottom: 14 }}>
                        {message}
                    </div>
                )}
                {error && <div className="alert-error">{error}</div>}

                {!message && (
                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label>{t("auth.resetEmailLabel")}</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={loading}>
                            {loading ? t("auth.sending") : t("auth.sendResetLink")}
                        </button>
                    </form>
                )}

                <div className="auth-switch">
                    <Link to="/login">{t("auth.backToLogin")}</Link>
                </div>
            </div>
        </div>
    );
}