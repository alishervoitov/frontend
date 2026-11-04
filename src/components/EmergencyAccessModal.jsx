import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";

const MIN = 20;

// Favqulodda kirish: shifokor sababni yozadi, kirish 60 daqiqaga ochiladi,
// bemorga bildirishnoma boradi va xavfsizlik ogohlantirishi yaratiladi
export default function EmergencyAccessModal({ patientId, patientName, onClose, onOpened }) {
    const { t } = useTranslation();
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const area = useRef(null);
    const len = reason.trim().replace(/\s+/g, " ").length;

    useEffect(() => {
        area.current?.focus();
        const esc = (e) => e.key === "Escape" && !busy && onClose();
        document.addEventListener("keydown", esc);
        return () => document.removeEventListener("keydown", esc);
    }, [busy, onClose]);

    async function submit(e) {
        e.preventDefault();
        if (len < MIN) return;
        setBusy(true);
        setError("");
        try {
            const r = await client.post(`/records/patients/${patientId}/emergency-access/`, { reason });
            onOpened(r.data);
        } catch (err) {
            const st = err?.response?.status;
            setError(st === 429 ? t("consent.em.throttled") : err?.response?.data?.detail || t("consent.em.error"));
            setBusy(false);
        }
    }

    return (
        <div className="cs-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
            <form className="cs-modal" role="dialog" aria-modal="true" aria-labelledby="em-title" onSubmit={submit}>
                <div className="cs-modal-head">
                    <span className="cs-siren" aria-hidden="true">!</span>
                    <div>
                        <h2 id="em-title">{t("consent.em.title")}</h2>
                        {patientName && <div className="cs-modal-sub">{patientName}</div>}
                    </div>
                </div>
                <ul className="cs-em-facts">
                    <li>{t("consent.em.fact1")}</li>
                    <li>{t("consent.em.fact2")}</li>
                    <li>{t("consent.em.fact3")}</li>
                </ul>
                <div className="field">
                    <label htmlFor="em-reason">{t("consent.em.reason")}</label>
                    <textarea id="em-reason" ref={area} rows={4} maxLength={500} value={reason}
                              placeholder={t("consent.em.placeholder")} onChange={(e) => setReason(e.target.value)} />
                    <div className={`cs-count ${len >= MIN ? "ok" : ""}`}>
                        {len >= MIN ? t("consent.em.enough") : t("consent.em.more", { n: MIN - len })}
                    </div>
                </div>
                {error && <div className="alert-error">{error}</div>}
                <div className="cs-modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>{t("consent.cancel")}</button>
                    <button type="submit" className="btn cs-btn-danger" disabled={busy || len < MIN}>
                        {busy ? t("me.loading") : t("consent.em.submit")}
                    </button>
                </div>
            </form>
        </div>
    );
}
