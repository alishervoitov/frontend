import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const RESEND_WAIT = 60;

// Email tasdiqlanmagan bo'lsa barcha sahifalar tepasida chiqadi. Kod ro'yxatdan o'tishda avtomatik
// yuboriladi; parolni tiklash faqat tasdiqlangan emailga ishlaydi (backend: users/email_verify.py).
export default function EmailVerifyBanner() {
    const { t } = useTranslation();
    const { user, setUser } = useAuth();
    const [code, setCode] = useState("");
    const [msg, setMsg] = useState(null);       // { kind: "error" | "info", text }
    const [busy, setBusy] = useState(false);
    const [wait, setWait] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (wait <= 0) return undefined;
        const id = setTimeout(() => setWait((w) => w - 1), 1000);
        return () => clearTimeout(id);
    }, [wait]);

    if (done) {
        return (
            <div className="ev-banner ev-ok" role="status">
                <span>{t("emailVerify.done")}</span>
                <button type="button" className="ev-link" onClick={() => setDone(false)} aria-label={t("emailVerify.close")}>×</button>
            </div>
        );
    }
    if (!user || !user.email || user.email_verified) return null;

    function errorText(err) {
        const key = err.response?.data?.code;
        return key && t(`emailVerify.errors.${key}`, { defaultValue: "" }) || err.response?.data?.detail || t("queue.errors.generic");
    }

    async function verify(e) {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
            await client.post("/auth/email/verify/", { code });
            setDone(true);
            setUser((u) => ({ ...u, email_verified: true }));
        } catch (err) {
            setMsg({ kind: "error", text: errorText(err) });
        } finally {
            setBusy(false);
        }
    }

    async function resend() {
        setBusy(true);
        setMsg(null);
        try {
            await client.post("/auth/email/send-code/");
            setMsg({ kind: "info", text: t("emailVerify.sent", { email: user.email }) });
            setWait(RESEND_WAIT);
        } catch (err) {
            setMsg({ kind: "error", text: errorText(err) });
            if (err.response?.data?.code === "cooldown") setWait(RESEND_WAIT);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="ev-banner" role="region" aria-label={t("emailVerify.title")}>
            <div className="ev-text">
                <b>{t("emailVerify.title")}</b>
                <span>{t("emailVerify.hint", { email: user.email })}</span>
            </div>
            <form className="ev-form" onSubmit={verify}>
                <input className="ev-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                       placeholder="000000" value={code} aria-label={t("emailVerify.codeLabel")}
                       onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                <button type="submit" className="btn btn-primary ev-btn" disabled={busy || code.length !== 6}>
                    {t("emailVerify.confirm")}
                </button>
                <button type="button" className="btn btn-secondary ev-btn" onClick={resend} disabled={busy || wait > 0}>
                    {wait > 0 ? t("emailVerify.resendIn", { s: wait }) : t("emailVerify.resend")}
                </button>
            </form>
            {msg && <p className={msg.kind === "error" ? "ev-msg ev-err" : "ev-msg"} role="alert">{msg.text}</p>}
        </div>
    );
}
