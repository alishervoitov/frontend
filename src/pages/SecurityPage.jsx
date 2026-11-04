import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { fmtDate } from "../api/dates";

function CodeInput({ value, onChange, autoFocus, id }) {
    return (
        <input id={id} className="mfa-code-input" value={value} autoFocus={autoFocus} inputMode="numeric"
               autoComplete="one-time-code" maxLength={6} placeholder="000000"
               onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} />
    );
}

// Zaxira kodlar faqat bir marta ko'rsatiladi: nusxa, yuklab olish yoki chop etish
function BackupCodes({ codes, username, onDone }) {
    const { t } = useTranslation();
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const text = `ShifoSafe — ${t("mfa.codes.fileTitle")} (${username})\n${new Date().toLocaleString()}\n\n${codes.join("\n")}\n\n${t("mfa.codes.fileNote")}\n`;

    function download() {
        const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `shifosafe-zaxira-kodlar-${username}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setSaved(true);
    }
    async function copy() {
        try { await navigator.clipboard.writeText(codes.join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* */ }
    }
    function print() {
        const w = window.open("", "_blank", "width=480,height=640");
        if (!w) return;
        const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
        w.document.write(`<!doctype html><meta charset="utf-8"><title>ShifoSafe</title><body style="font-family:sans-serif;padding:24px">
<h2 style="margin:0 0 4px">ShifoSafe</h2><p style="margin:0 0 16px;color:#555">${esc(t("mfa.codes.fileTitle"))} · ${esc(username)}</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font:18px monospace">${codes.map((c) => `<div>☐ ${esc(c)}</div>`).join("")}</div>
<p style="margin-top:20px;color:#555;font-size:13px">${esc(t("mfa.codes.fileNote"))}</p></body>`);
        w.document.close();
        w.focus();
        w.print();
        setSaved(true);
    }

    return (
        <section className="mfa-card">
            <h2>{t("mfa.codes.title")}</h2>
            <p className="mfa-muted">{t("mfa.codes.lead")}</p>
            <ol className="mfa-codes">
                {codes.map((c) => <li key={c}><code>{c}</code></li>)}
            </ol>
            <div className="mfa-row">
                <button type="button" className="btn btn-secondary" onClick={copy}>{copied ? `✓ ${t("mfa.codes.copied")}` : t("mfa.codes.copy")}</button>
                <button type="button" className="btn btn-secondary" onClick={download}>{t("mfa.codes.download")}</button>
                <button type="button" className="btn btn-secondary" onClick={print}>{t("mfa.codes.print")}</button>
            </div>
            <label className="mfa-check">
                <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
                {t("mfa.codes.saved")}
            </label>
            <button type="button" className="btn btn-primary" disabled={!saved} onClick={onDone}>{t("mfa.codes.done")}</button>
        </section>
    );
}

export default function SecurityPage() {
    const { t } = useTranslation();
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const { state } = useLocation();
    const [status, setStatus] = useState(null);
    const [setup, setSetup] = useState(null);
    const [code, setCode] = useState("");
    const [codes, setCodes] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [regen, setRegen] = useState(false);
    const [disable, setDisable] = useState(false);
    const [password, setPassword] = useState("");
    const [copiedKey, setCopiedKey] = useState(false);

    const load = () => client.get("/auth/2fa/").then((r) => setStatus(r.data)).catch(() => setError(t("mfa.loadError")));
    useEffect(() => { load(); }, []);

    const errText = (err) => err?.response?.data?.detail || t("mfa.error");

    async function startSetup() {
        setBusy(true); setError("");
        try { setSetup((await client.post("/auth/2fa/setup/")).data); setCode(""); } catch (err) { setError(errText(err)); }
        setBusy(false);
    }
    async function confirm(e) {
        e.preventDefault();
        setBusy(true); setError("");
        try {
            const r = await client.post("/auth/2fa/confirm/", { code });
            setCodes(r.data.backup_codes);
            setSetup(null);
        } catch (err) { setError(errText(err)); setCode(""); }
        setBusy(false);
    }
    async function regenerate(e) {
        e.preventDefault();
        setBusy(true); setError("");
        try { setCodes((await client.post("/auth/2fa/backup-codes/", { code })).data.backup_codes); setRegen(false); }
        catch (err) { setError(errText(err)); }
        setCode(""); setBusy(false);
    }
    async function turnOff(e) {
        e.preventDefault();
        setBusy(true); setError("");
        try {
            await client.post("/auth/2fa/disable/", { code, password });
            setUser({ ...user, mfa_enabled: false });
            setDisable(false); setPassword("");
            await load();
        } catch (err) { setError(errText(err)); }
        setCode(""); setBusy(false);
    }
    function finish() {
        const wasForced = user?.mfa_required && !user?.mfa_enabled;
        setUser({ ...user, mfa_enabled: true });
        setCodes(null);
        load();
        if (wasForced) navigate(user.role === "admin" ? "/admin/users" : "/patients");
    }
    async function copyKey() {
        try { await navigator.clipboard.writeText(setup.secret); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); } catch { /* */ }
    }

    const forced = status && status.required && !status.enabled;

    return (
        <div className="page mfa-page">
            <div className="page-head"><h1>{t("mfa.title")}</h1></div>
            <p className="access-lead">{t("mfa.lead")}</p>

            {forced && !codes && <div className="mfa-banner mfa-banner-warn">{t("mfa.forced")}</div>}
            {state?.backupRemaining !== undefined && status?.enabled && !codes && (
                <div className={`mfa-banner ${state.backupRemaining <= 3 ? "mfa-banner-warn" : ""}`}>
                    {t("mfa.usedBackup", { n: state.backupRemaining })}
                </div>
            )}
            {error && <div className="alert-error">{error}</div>}

            {!status ? (
                <div className="table-card"><div className="empty-state">{t("me.loading")}</div></div>
            ) : codes ? (
                <BackupCodes codes={codes} username={user?.username} onDone={finish} />
            ) : !status.enabled ? (
                <section className="mfa-card">
                    <ol className="mfa-steps">
                        <li className={setup ? "done" : "current"}>
                            <b>{t("mfa.step1")}</b>
                            <span>{t("mfa.step1Text")}</span>
                        </li>
                        <li className={setup ? "current" : ""}>
                            <b>{t("mfa.step2")}</b>
                            {setup ? (
                                <div className="mfa-qr-wrap">
                                    <div className="mfa-qr" dangerouslySetInnerHTML={{ __html: setup.qr_svg }} />
                                    <div className="mfa-key">
                                        <span>{t("mfa.manualKey")}</span>
                                        <code>{setup.secret.match(/.{1,4}/g).join(" ")}</code>
                                        <button type="button" className="mfa-linkbtn" onClick={copyKey}>{copiedKey ? `✓ ${t("mfa.codes.copied")}` : t("mfa.codes.copy")}</button>
                                    </div>
                                </div>
                            ) : (
                                <span>{t("mfa.step2Text")}</span>
                            )}
                        </li>
                        <li className={setup ? "current" : ""}>
                            <b>{t("mfa.step3")}</b>
                            {setup ? (
                                <form className="mfa-inline" onSubmit={confirm}>
                                    <CodeInput id="mfa-confirm" value={code} onChange={setCode} autoFocus />
                                    <button className="btn btn-primary" disabled={busy || code.length !== 6}>{t("mfa.confirm")}</button>
                                </form>
                            ) : <span>{t("mfa.step3Text")}</span>}
                        </li>
                    </ol>
                    {!setup && <button type="button" className="btn btn-primary mfa-start" disabled={busy} onClick={startSetup}>{t("mfa.start")}</button>}
                </section>
            ) : (
                <>
                    <section className="mfa-card mfa-on">
                        <div className="mfa-on-head">
                            <span className="mfa-shield" aria-hidden="true">✓</span>
                            <div>
                                <b>{t("mfa.enabledTitle")}</b>
                                <span>{status.confirmed_at ? t("mfa.since", { date: fmtDate(status.confirmed_at) }) : ""}{status.required ? ` · ${t("mfa.requiredRole")}` : ""}</span>
                            </div>
                        </div>
                        <div className={`mfa-remaining ${status.backup_remaining <= 3 ? "low" : ""}`}>
                            {t("mfa.remaining", { n: status.backup_remaining })}
                        </div>
                        {regen ? (
                            <form className="mfa-inline" onSubmit={regenerate}>
                                <CodeInput value={code} onChange={setCode} autoFocus />
                                <button className="btn btn-primary" disabled={busy || code.length !== 6}>{t("mfa.regenerate")}</button>
                                <button type="button" className="btn btn-secondary" onClick={() => { setRegen(false); setCode(""); }}>{t("consent.cancel")}</button>
                            </form>
                        ) : (
                            <button type="button" className="btn btn-secondary mfa-auto" onClick={() => { setRegen(true); setDisable(false); setCode(""); setError(""); }}>
                                {t("mfa.regenerate")}
                            </button>
                        )}
                        {regen && <p className="mfa-muted mfa-small">{t("mfa.regenHint")}</p>}
                    </section>

                    {!status.required && (
                        <section className="mfa-card">
                            <h2>{t("mfa.disableTitle")}</h2>
                            {disable ? (
                                <form className="mfa-disable" onSubmit={turnOff}>
                                    <div className="field"><label>{t("auth.password")}</label>
                                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
                                    <div className="field"><label>{t("mfa.codeOrBackup")}</label>
                                        <input className="mfa-code-input" value={code} onChange={(e) => setCode(e.target.value)} maxLength={11} autoComplete="off" /></div>
                                    <div className="mfa-row">
                                        <button type="button" className="btn btn-secondary" onClick={() => setDisable(false)}>{t("consent.cancel")}</button>
                                        <button className="btn cs-btn-danger" disabled={busy || !password || code.length < 6}>{t("mfa.disable")}</button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <p className="mfa-muted">{t("mfa.disableText")}</p>
                                    <button type="button" className="cs-revoke" onClick={() => { setDisable(true); setRegen(false); setCode(""); setError(""); }}>{t("mfa.disable")}</button>
                                </>
                            )}
                        </section>
                    )}
                </>
            )}
            <p className="q-note access-foot">{t("mfa.note")}</p>
        </div>
    );
}
