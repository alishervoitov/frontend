import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { fmtDateTime } from "../api/dates";

const KioskIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="2.5" width="14" height="13" rx="2" /><path d="M9 15.5v3 M15 15.5v3 M7 21.5h10 M9 7h6 M9 10.5h4" />
    </svg>
);

// Administrator: har bir kiosk ekraniga alohida kalit; kalit bir marta ko'rsatiladi, bekor qilish darhol
export default function AdminKiosksPage() {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);
    const [created, setCreated] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const [copied, setCopied] = useState(false);

    const load = useCallback(() => client.get("/queue/kiosks/")
        .then((r) => { setData(r.data); setError(""); })
        .catch(() => setError(t("kiosks.loadError"))), [t]);

    useEffect(() => { load(); }, [load]);

    async function create(e) {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const r = await client.post("/queue/kiosks/", { name });
            setCreated(r.data);
            setName("");
            load();
        } catch (err) {
            const d = err?.response?.data || {};
            setError([].concat(d.name || d.detail || t("kiosks.createError")).join(" "));
        } finally {
            setBusy(false);
        }
    }

    async function revoke(id) {
        setBusy(true);
        try {
            await client.post(`/queue/kiosks/${id}/revoke/`);
            setConfirmId(null);
            load();
        } catch {
            setError(t("kiosks.revokeError"));
        } finally {
            setBusy(false);
        }
    }

    async function copy() {
        try {
            await navigator.clipboard.writeText(created.key);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* qo'lda ko'chiriladi */ }
    }

    const active = (data?.results || []).filter((d) => !d.revoked_at);
    const revoked = (data?.results || []).filter((d) => d.revoked_at);

    return (
        <div className="page sessions-page">
            <Link className="q-back" to="/registry">← {t("nav.registry")}</Link>
            <div className="page-head"><h1>{t("kiosks.title")}</h1></div>
            <p className="q-muted sessions-lead">{t("kiosks.lead")}</p>
            {error && <div className="alert-error">{error}</div>}

            {created ? (
                <div className="card ks-created" role="status">
                    <div className="ks-created-head">✓ {t("kiosks.created", { name: created.name })}</div>
                    <div className="ks-key">{created.key}</div>
                    <ol className="ks-steps">
                        <li>{t("kiosks.step1")}</li>
                        <li>{t("kiosks.step2")}</li>
                    </ol>
                    <p className="ks-once">{t("kiosks.shownOnce")}</p>
                    <div className="ks-created-actions">
                        <button type="button" className="btn btn-secondary q-btn-auto" onClick={copy}>{copied ? t("tp.copied") : t("tp.copy")}</button>
                        <button type="button" className="btn btn-primary q-btn-auto" onClick={() => setCreated(null)}>{t("tp.done")}</button>
                    </div>
                </div>
            ) : (
                <form className="card ks-new" onSubmit={create}>
                    <label htmlFor="ks-name">{t("kiosks.nameLabel")}</label>
                    <div className="ks-new-row">
                        <input id="ks-name" value={name} maxLength={80} placeholder={t("kiosks.namePlaceholder")}
                               onChange={(e) => setName(e.target.value)} />
                        <button className="btn btn-primary q-btn-auto" disabled={busy || !name.trim()}>{t("kiosks.create")}</button>
                    </div>
                </form>
            )}

            {data?.legacy_key_active && (
                <div className="q-hint ks-legacy">{t("kiosks.legacy")}</div>
            )}

            {!data ? (
                !error && <div className="empty-state">{t("me.loading")}</div>
            ) : active.length === 0 ? (
                <div className="empty-state">{t("kiosks.empty")}</div>
            ) : (
                <div className="sessions-list">
                    {active.map((d) => (
                        <div key={d.id} className="card sessions-item">
                            <span className="ks-icon"><KioskIcon /></span>
                            <div className="sessions-body">
                                <div className="sessions-name">{d.name} <code className="ks-prefix">{d.key_prefix}…</code></div>
                                <div className="q-muted sessions-meta">
                                    {d.last_used_at
                                        ? t("kiosks.lastUsed", { when: fmtDateTime(d.last_used_at), ip: d.last_ip || "—" })
                                        : t("kiosks.neverUsed")}
                                </div>
                                <div className="q-muted sessions-meta">
                                    {t("kiosks.createdBy", { when: fmtDateTime(d.created_at), who: d.created_by || "—" })}
                                </div>
                            </div>
                            {confirmId === d.id ? (
                                <span className="ks-confirm">
                                    <button className="btn btn-secondary q-btn-auto" disabled={busy} onClick={() => setConfirmId(null)}>{t("consent.cancel")}</button>
                                    <button className="btn btn-primary q-btn-auto ks-danger" disabled={busy} onClick={() => revoke(d.id)}>{t("kiosks.revokeConfirm")}</button>
                                </span>
                            ) : (
                                <button className="btn btn-secondary q-btn-auto sessions-out" onClick={() => setConfirmId(d.id)}>{t("kiosks.revoke")}</button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {revoked.length > 0 && (
                <details className="ks-revoked">
                    <summary>{t("kiosks.revokedTitle", { n: revoked.length })}</summary>
                    <ul>
                        {revoked.map((d) => (
                            <li key={d.id}>
                                <b>{d.name}</b> <code className="ks-prefix">{d.key_prefix}…</code>
                                <span className="q-muted"> · {t("kiosks.revokedAt", { when: fmtDateTime(d.revoked_at) })}</span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
            <p className="q-muted sessions-note">{t("kiosks.note")}</p>
        </div>
    );
}
