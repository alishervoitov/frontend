import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function ResetPasswordPage() {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError(t("auth.passwordMismatch"));
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
            setError(Array.isArray(detail) ? detail[0] : detail || t("auth.invalidLink"));
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
                <div className="auth-sub">{t("auth.newPasswordTitle")}</div>

                {success ? (
                    <div style={{ background: "var(--success-tint)", color: "#235940", padding: "10px 12px", borderRadius: 6, fontSize: "0.85rem" }}>
                        {t("auth.passwordUpdated")}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert-error">{error}</div>}
                        <div className="field">
                            <label>{t("auth.newPassword")}</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
                        </div>
                        <div className="field">
                            <label>{t("auth.confirmNewPassword")}</label>
                            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={loading}>
                            {loading ? t("auth.saving") : t("auth.updatePassword")}
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