import { useState } from "react";
import { useTranslation } from "react-i18next";
import { queueApi } from "../api/queue";
import { fmtDateTime } from "../api/dates";
import "../styles/registry.css";

// Faqat parol qog'ozini chop etish: registratura chiptasi (q-print-area) shu payt yashiriladi
function printSlip() {
    document.body.classList.add("printing-pw");
    try { window.print(); } finally { document.body.classList.remove("printing-pw"); }
}

/**
 * Registratura: bemorga ilovaga kirish uchun vaqtinchalik parol berish.
 * Parol serverdan bir marta keladi va faqat shu oynada ko'rinadi; yopilgach qayta ko'rsatib bo'lmaydi.
 */
export default function TempPasswordDialog({ patient, onClose, onIssued }) {
    const { t } = useTranslation();
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    async function issue() {
        setBusy(true);
        setError("");
        try {
            const r = await queueApi.registryTempPassword(patient.id);
            setResult(r);
            onIssued?.(r);
        } catch (err) {
            setError(err?.response?.data?.detail || t("tp.error"));
        } finally {
            setBusy(false);
        }
    }

    async function copy() {
        try {
            await navigator.clipboard.writeText(result.temp_password);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard ruxsati yo'q - qo'lda ko'chiriladi */ }
    }

    const site = window.location.host;

    return (
        <div className="cs-overlay" onMouseDown={(e) => e.target === e.currentTarget && !result && onClose()}>
            <div className="cs-modal tp-modal" role="dialog" aria-modal="true" aria-labelledby="tp-title">
                <div className="cs-modal-head">
                    <span className="tp-icon" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10.5" width="16" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></svg>
                    </span>
                    <div>
                        <h2 id="tp-title">{t("tp.title")}</h2>
                        <div className="cs-modal-sub">{patient.full_name}</div>
                    </div>
                </div>

                {!result ? (
                    <>
                        <p className="tp-lead">{t("tp.lead", { hours: 72 })}</p>
                        {patient.has_login && <div className="tp-warn">{t("tp.warnExisting")}</div>}
                        {patient.temp_password_expires && !patient.has_login && (
                            <div className="tp-warn">{t("tp.warnReissue")}</div>
                        )}
                        {error && <div className="alert-error">{error}</div>}
                        <div className="cs-modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>{t("consent.cancel")}</button>
                            <button type="button" className="btn btn-primary" disabled={busy} onClick={issue}>
                                {busy ? t("auth.saving") : t("tp.issue")}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="pw-print-area">
                            <div className="tp-slip">
                                <div className="tp-slip-brand">{t("app.name")}</div>
                                <div className="tp-slip-title">{t("tp.slipTitle")}</div>
                                <div className="tp-slip-name">{result.full_name}</div>
                                <dl className="tp-slip-rows">
                                    <dt>{t("tp.site")}</dt><dd>{site}</dd>
                                    <dt>{t("auth.username")}</dt><dd className="tp-mono">{result.username}</dd>
                                    <dt>{t("tp.password")}</dt><dd className="tp-mono tp-pass">{result.temp_password}</dd>
                                    <dt>{t("tp.validUntil")}</dt><dd>{fmtDateTime(result.expires_at)}</dd>
                                </dl>
                                <p className="tp-slip-note">{t("tp.slipNote")}</p>
                            </div>
                        </div>
                        <p className="tp-once">{t("tp.shownOnce")}</p>
                        <div className="cs-modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={copy}>{copied ? t("tp.copied") : t("tp.copy")}</button>
                            <button type="button" className="btn btn-secondary" onClick={printSlip}>{t("queue.print")}</button>
                            <button type="button" className="btn btn-primary" onClick={onClose}>{t("tp.done")}</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
