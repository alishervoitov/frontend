import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const ICON = { desktop: "💻", mobile: "📱", tablet: "📲", unknown: "🖥️" };

function when(t, iso) {
    const d = new Date(iso);
    const min = Math.max(0, Math.round((Date.now() - d) / 60000));
    if (min < 2) return t("sessions.justNow");
    if (min < 60) return t("notif.minAgo", { n: min });
    if (min < 1440) return t("notif.hourAgo", { n: Math.round(min / 60) });
    return d.toLocaleString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// Faol sessiyalar: foydalanuvchi qaysi qurilmalardan kirganini ko'radi va ularni yopadi
export default function SessionsPage() {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(() => client.get("/auth/sessions/").then((r) => setData(r.data)).catch(() => setError(t("sessions.loadError"))), [t]);
    useEffect(() => { load(); }, [load]);

    async function run(fn, confirmText) {
        if (confirmText && !window.confirm(confirmText)) return;
        setBusy(true);
        setError("");
        setMsg("");
        try {
            await fn();
        } catch {
            setError(t("sessions.actionError"));
        } finally {
            setBusy(false);
        }
    }

    const revokeOne = (s) => run(async () => {
        await client.post(`/auth/sessions/${s.id}/revoke/`);
        setMsg(t("sessions.revokedOne"));
        await load();
    }, t("sessions.confirmOne"));

    const revokeOthers = () => run(async () => {
        const r = await client.post("/auth/sessions/revoke-others/", {});
        setMsg(t("sessions.revokedOthers", { count: r.data.revoked }));
        await load();
    }, t("sessions.confirmOthers"));

    const revokeAll = () => run(async () => {
        await client.post("/auth/sessions/revoke-others/", { include_current: true });
        await logout();
        navigate("/login");
    }, t("sessions.confirmAll"));

    if (!data) return <div className="page"><div className="empty-state">{error || t("me.loading")}</div></div>;
    const others = data.results.filter((s) => !s.current);

    return (
        <div className="page sessions-page">
            <div className="page-head">
                <h1>{t("sessions.title")}</h1>
            </div>
            <p className="q-muted sessions-lead">{t("sessions.lead")}</p>
            {error && <div className="alert-error">{error}</div>}
            {msg && <div className="q-hint q-info" role="status">{msg}</div>}
            {!data.current_known && <div className="q-hint">{t("sessions.relogin")}</div>}

            <div className="sessions-list">
                {data.results.map((s) => {
                    const name = [s.device.browser, s.device.os].filter(Boolean).join(" · ") || t("sessions.unknownDevice");
                    return (
                        <div key={s.id} className={`card sessions-item ${s.current ? "is-current" : ""}`}>
                            <span className="sessions-icon" aria-hidden="true">{ICON[s.device.kind] || ICON.unknown}</span>
                            <div className="sessions-body">
                                <div className="sessions-name">
                                    {name}
                                    {s.current && <span className="sessions-badge">{t("sessions.thisDevice")}</span>}
                                </div>
                                <div className="q-muted sessions-meta">
                                    {t(`sessions.kind.${s.device.kind}`)}{s.ip ? ` · IP ${s.ip}` : ""}
                                </div>
                                <div className="q-muted sessions-meta">
                                    {t("sessions.signedIn")}: {when(t, s.created_at)} · {t("sessions.lastSeen")}: {s.current ? t("sessions.now") : when(t, s.last_seen)}
                                </div>
                            </div>
                            {!s.current && (
                                <button className="btn btn-secondary q-btn-auto sessions-out" disabled={busy} onClick={() => revokeOne(s)}>
                                    {t("sessions.signOut")}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="sessions-actions">
                {others.length > 0 && (
                    <button className="btn btn-primary q-btn-auto" disabled={busy} onClick={revokeOthers}>
                        {t("sessions.signOutOthers", { count: others.length })}
                    </button>
                )}
                <button className="btn btn-secondary q-btn-auto q-danger-text" disabled={busy} onClick={revokeAll}>
                    {t("sessions.signOutAll")}
                </button>
            </div>
            <p className="q-muted sessions-note">{t("sessions.note")}</p>
        </div>
    );
}
