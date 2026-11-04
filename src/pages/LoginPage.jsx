import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { pendingCheckin } from "../api/queue";

export default function LoginPage() {
    const { login, loginMfa } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    // Ikkinchi bosqich (2FA): parol to'g'ri bo'lgach
    const [mfaToken, setMfaToken] = useState(null);
    const [code, setCode] = useState("");
    const [useBackup, setUseBackup] = useState(false);

    function goHome(user, backupRemaining) {
        if (user.mfa_required && !user.mfa_enabled) return navigate("/security");
        if (backupRemaining !== undefined) return navigate("/security", { state: { backupRemaining } });
        if (user.role === "admin") navigate("/admin/users");
        else if (user.role === "doctor") navigate("/patients");
        else if (user.role === "lab") navigate("/lab");
        else if (pendingCheckin.get()) navigate("/arrive"); // QR skanerlangan, kirish so'raldi
        else navigate("/me");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await login(username, password);
            if (result.mfaToken) {
                setMfaToken(result.mfaToken);
                setPassword("");
            } else {
                goHome(result);
            }
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(detail || t("auth.loginError"));
        } finally {
            setLoading(false);
        }
    }

    async function handleCode(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { user, backupRemaining } = await loginMfa(mfaToken, code);
            goHome(user, backupRemaining);
        } catch (err) {
            const d = err.response?.data || {};
            if (d.code === "mfa_expired") {
                setMfaToken(null);
                setError(t("mfa.login.expired"));
            } else if (d.code === "mfa_invalid") {
                setError(t("mfa.login.invalid", { n: d.attempts_left }));
            } else {
                setError(d.detail || t("auth.loginError"));
            }
            setCode("");
        } finally {
            setLoading(false);
        }
    }

    function backToPassword() {
        setMfaToken(null);
        setCode("");
        setUseBackup(false);
        setError("");
    }

    return (
        <div className="auth-page">
            <div style={{ position: "absolute", top: 20, right: 20 }}>
                <LanguageSwitcher />
            </div>
            <div className="auth-card">
                <div className="auth-brand">{t("app.name")}</div>

                {mfaToken ? (
                    <>
                        <div className="mfa-login-head">
                            <span className="mfa-login-icon" aria-hidden="true">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>
                            </span>
                            <div>
                                <div className="mfa-login-title">{t("mfa.login.title")}</div>
                                <div className="auth-sub" style={{ marginBottom: 0 }}>{useBackup ? t("mfa.login.backupLead") : t("mfa.login.lead")}</div>
                            </div>
                        </div>
                        {error && <div className="alert-error">{error}</div>}
                        <form onSubmit={handleCode}>
                            <div className="field">
                                <label htmlFor="mfa-code">{useBackup ? t("mfa.login.backupLabel") : t("mfa.login.codeLabel")}</label>
                                {useBackup ? (
                                    <input id="mfa-code" key="backup" className="mfa-code-input mfa-backup-input" value={code} autoFocus
                                           autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={11}
                                           placeholder="abcde-fghjk" onChange={(e) => setCode(e.target.value)} />
                                ) : (
                                    <input id="mfa-code" key="totp" className="mfa-code-input" value={code} autoFocus
                                           inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000"
                                           onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                                )}
                            </div>
                            <button className="btn btn-primary" type="submit"
                                    disabled={loading || (useBackup ? code.replace(/[\s-]/g, "").length !== 10 : code.length !== 6)}>
                                {loading ? t("auth.loggingIn") : t("mfa.login.submit")}
                            </button>
                        </form>
                        <div className="auth-switch mfa-login-links">
                            <button type="button" className="mfa-linkbtn" onClick={() => { setUseBackup(!useBackup); setCode(""); setError(""); }}>
                                {useBackup ? t("mfa.login.useApp") : t("mfa.login.useBackup")}
                            </button>
                            <button type="button" className="mfa-linkbtn mfa-linkbtn-muted" onClick={backToPassword}>← {t("mfa.login.back")}</button>
                        </div>
                    </>
                ) : (
                    <>
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
                    </>
                )}
            </div>
        </div>
    );
}
