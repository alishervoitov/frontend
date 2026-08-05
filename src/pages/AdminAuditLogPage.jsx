import { useEffect, useState } from "react";
import client from "../api/client";

const ACTION_LABELS = {
    view: "Ko'rish", create: "Yaratish", update: "Tahrirlash",
    delete: "O'chirish", login: "Kirish", login_failed: "Muvaffaqiyatsiz kirish",
};

export default function AdminAuditLogPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.get("/records/audit-logs/").then((res) => setLogs(res.data)).finally(() => setLoading(false));
    }, []);

    return (
        <div className="page" style={{ maxWidth: 1100 }}>
            <div className="page-head">
                <h1>Audit jurnali</h1>
            </div>

            <div className="table-card">
                {loading ? (
                    <div className="empty-state">Yuklanmoqda...</div>
                ) : logs.length === 0 ? (
                    <div className="empty-state">Hozircha yozuvlar yo'q.</div>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>Vaqt</th>
                            <th>Kim</th>
                            <th>Harakat</th>
                            <th>Bemor</th>
                            <th>Tafsilot</th>
                            <th>IP</th>
                        </tr>
                        </thead>
                        <tbody>
                        {logs.map((l) => (
                            <tr key={l.id}>
                                <td className="cell-muted" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                                    {new Date(l.timestamp).toLocaleString("uz-UZ")}
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