import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const user = await login(username, password);
            if (user.role === "admin") navigate("/admin");
            else if (user.role === "doctor") navigate("/patients");
            else navigate("/me");
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(detail || t("auth.loginError"));
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
                <div className="auth-sub">{t("auth.loginTitle")}</div>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="username">{t("auth.username")}</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="password">{t("auth.password")}</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? t("auth.loggingIn") : t("auth.loginButton")}
                    </button>
                </form>

                <div className="auth-switch">
                    {t("auth.noAccount")} <Link to="/register">{t("auth.register")}</Link>
                    <div style={{ marginTop: 8 }}>
                        <Link to="/forgot-password">{t("auth.forgotPassword")}</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}