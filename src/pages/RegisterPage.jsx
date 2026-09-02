import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

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
            setError(Array.isArray(firstError) ? firstError[0] : firstError || t("auth.loginError"));
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
                <div className="auth-sub">{t("auth.registerTitle")}</div>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
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
                        <input type="email" value={form.email} onChange={update("email")} required />
                    </div>
                    <div className="field">
                        <label>{t("auth.phone")}</label>
                        <input value={form.phone} onChange={update("phone")} placeholder="+998901234567" />
                    </div>
                    <div className="field">
                        <label>{t("auth.password")}</label>
                        <input type="password" value={form.password} onChange={update("password")} required />
                    </div>
                    <div className="field">
                        <label>{t("auth.confirmPassword")}</label>
                        <input type="password" value={form.password_confirm} onChange={update("password_confirm")} required />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? t("auth.submitting") : t("auth.registerButton")}
                    </button>
                </form>

                <div className="auth-switch">
                    {t("auth.haveAccount")} <Link to="/login">{t("auth.login")}</Link>
                </div>
            </div>
        </div>
    );
}