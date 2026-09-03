import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";

export default function AdminAuditLogPage() {
    const { t } = useTranslation();

    const ACTION_LABELS = {
        view: t("auditActions.view"), create: t("auditActions.create"), update: t("auditActions.update"),
        delete: t("auditActions.delete"), login: t("auditActions.login"), login_failed: t("auditActions.login_failed"),
        export: t("auditActions.export"),
    };

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.get("/records/audit-logs/").then((res) => setLogs(res.data)).finally(() => setLoading(false));
    }, []);

    return (
        <div className="page" style={{ maxWidth: 1100 }}>
            <div className="page-head">
                <h1>{t("admin.auditTitle")}</h1>
            </div>

            <div className="table-card">
                {loading ? (
                    <div className="empty-state">{t("admin.loading")}</div>
                ) : logs.length === 0 ? (
                    <div className="empty-state">{t("admin.noEntries")}</div>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>{t("admin.time")}</th>
                            <th>{t("admin.who")}</th>
                            <th>{t("admin.action")}</th>
                            <th>{t("admin.patient")}</th>
                            <th>{t("admin.detail")}</th>
                            <th>IP</th>
                        </tr>
                        </thead>
                        <tbody>
                        {logs.map((l) => (
                            <tr key={l.id}>
                                <td className="cell-muted" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                                    {new Date(l.timestamp).toLocaleString()}
                                </td>
                                <td>{l.actor_name || "—"}</td>
                                <td>{ACTION_LABELS[l.action] || l.action}</td>
                                <td className="cell-muted">{l.patient_name || "—"}</td>
                                <td className="cell-muted">{l.detail}</td>
                                <td className="cell-muted" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                                    {l.ip_address || "—"}
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