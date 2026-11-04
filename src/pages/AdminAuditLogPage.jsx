import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { fmtDateTime } from "../api/dates";

export default function AdminAuditLogPage() {
    const { t } = useTranslation();

    const ACTION_LABELS = {
        view: t("auditActions.view"), create: t("auditActions.create"), update: t("auditActions.update"),
        delete: t("auditActions.delete"), login: t("auditActions.login"), login_failed: t("auditActions.login_failed"),
        export: t("auditActions.export"),
    };

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [check, setCheck] = useState(null);
    const [checking, setChecking] = useState(false);

    // Xesh zanjirini serverda boshidan oxirigacha qayta hisoblab tekshirish
    async function verify() {
        setChecking(true);
        try {
            const r = await client.get("/records/audit-logs/verify/");
            setCheck(r.data);
        } catch {
            setCheck({ error: true });
        } finally {
            setChecking(false);
        }
    }
    const broken = new Set((check?.problems || []).map((p) => p.id));

    useEffect(() => {
        client.get("/records/audit-logs/").then((res) => setLogs(res.data)).finally(() => setLoading(false));
    }, []);

    return (
        <div className="page" style={{ maxWidth: 1100 }}>
            <div className="page-head">
                <h1>{t("admin.auditTitle")}</h1>
                <button className="btn btn-primary q-btn-auto" disabled={checking} onClick={verify}>
                    {checking ? t("integrity.checking") : t("integrity.verify")}
                </button>
            </div>

            {check && !check.error && (
                <div className={`integrity ${check.ok ? "integrity-ok" : "integrity-bad"}`} role="status">
                    <div className="integrity-icon" aria-hidden="true">{check.ok ? "✓" : "!"}</div>
                    <div className="integrity-body">
                        <b>{check.ok ? t("integrity.ok", { count: check.checked }) : t("integrity.bad", { count: check.problems.length })}</b>
                        {check.ok ? (
                            <span>{t("integrity.okHint")}</span>
                        ) : (
                            <ul className="integrity-list">
                                {check.problems.map((p, i) => (
                                    <li key={i}><code>#{p.id}</code> — {t(`integrity.type.${p.type}`)}</li>
                                ))}
                            </ul>
                        )}
                        <span className="integrity-meta">
                            {t("integrity.head")}: <code>{(check.head || "").slice(0, 16)}…</code>
                            {check.last_checkpoint && <> · {t("integrity.checkpoint")}: #{check.last_checkpoint.last_id} ({fmtDateTime(check.last_checkpoint.created_at)})</>}
                        </span>
                    </div>
                </div>
            )}
            {check?.error && <div className="alert-error">{t("integrity.error")}</div>}
            <p className="q-muted integrity-note">{t("integrity.note")}</p>

            <div className="table-card">
                {loading ? (
                    <div className="empty-state">{t("admin.loading")}</div>
                ) : logs.length === 0 ? (
                    <div className="empty-state">{t("admin.noEntries")}</div>
                ) : (
                    <table className="audit-table">
                        <thead>
                        <tr>
                            <th>{t("admin.time")}</th>
                            <th>{t("admin.who")}</th>
                            <th>{t("admin.action")}</th>
                            <th>{t("admin.patient")}</th>
                            <th>{t("admin.detail")}</th>
                            <th>IP</th>
                            <th title={t("integrity.hashCol")}>{t("integrity.hashCol")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {logs.map((l) => (
                            <tr key={l.id} className={broken.has(l.id) ? "integrity-row-bad" : ""}>
                                <td className="cell-muted" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                                    {fmtDateTime(l.timestamp)}
                                </td>
                                <td>{l.actor_name || "—"}</td>
                                <td>{ACTION_LABELS[l.action] || l.action}</td>
                                <td className="cell-muted">{l.patient_name || "—"}</td>
                                <td className="cell-muted">{l.detail}</td>
                                <td className="cell-muted" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                                    {l.ip_address || "—"}
                                </td>
                                <td className="cell-muted integrity-hash" title={l.entry_hash}>
                                    {l.entry_hash ? l.entry_hash.slice(0, 10) : "—"}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}