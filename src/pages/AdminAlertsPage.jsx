import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";

const FILTERS = ["open", "acknowledged", "all"];

function fmt(iso) {
    return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminAlertsPage() {
    const { t } = useTranslation();
    const [filter, setFilter] = useState("open");
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);

    const load = useCallback(() => {
        client
            .get("/monitoring/alerts/", { params: filter === "all" ? {} : { status: filter } })
            .then((r) => { setData(r.data); setError(false); })
            .catch(() => setError(true));
    }, [filter]);

    useEffect(() => { setData(null); load(); }, [load]);

    async function ack(a) {
        await client.post(`/monitoring/alerts/${a.id}/ack/`);
        load();
        window.dispatchEvent(new Event("alerts-changed"));
    }

    const rules = data?.rules;
    return (
        <div className="page page-wide">
            <div className="page-head"><h1>{t("alerts.title")}</h1></div>
            <p className="access-lead">{t("alerts.lead")}</p>

            {rules && (
                <div className="alert-rules">
                    <div><b>{t("alerts.rules.mass_access")}</b><span>{t("alerts.ruleText.mass_access", { n: rules.MASS_ACCESS_PATIENTS, m: rules.MASS_ACCESS_MINUTES })}</span></div>
                    <div><b>{t("alerts.rules.off_hours")}</b><span>{t("alerts.ruleText.off_hours", { from: String(rules.NIGHT_START_HOUR).padStart(2, "0"), to: String(rules.NIGHT_END_HOUR).padStart(2, "0") })}</span></div>
                    <div><b>{t("alerts.rules.bulk_export")}</b><span>{t("alerts.ruleText.bulk_export", { n: rules.EXPORT_COUNT, m: rules.EXPORT_MINUTES })}</span></div>
                </div>
            )}

            <div className="access-toolbar">
                <div className="au-tabs">
                    {FILTERS.map((f) => (
                        <button key={f} type="button" className={`au-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                            {t(`alerts.filter.${f}`)}{f === "open" && data ? <span> {data.open_count}</span> : null}
                        </button>
                    ))}
                </div>
            </div>

            {error ? (
                <div className="table-card"><div className="empty-state">{t("alerts.loadError")}</div></div>
            ) : !data ? (
                <div className="table-card"><div className="empty-state">{t("me.loading")}</div></div>
            ) : data.results.length === 0 ? (
                <div className="table-card"><div className="empty-state">{filter === "open" ? t("alerts.emptyOpen") : t("alerts.empty")}</div></div>
            ) : (
                <div className="alert-list">
                    {data.results.map((a) => (
                        <div key={a.id} className={`alert-card alert-${a.severity} ${a.status === "acknowledged" ? "alert-done" : ""}`}>
                            <div className="alert-main">
                                <div className="alert-head">
                                    <span className={`alert-sev alert-sev-${a.severity}`}>{t(`alerts.severity.${a.severity}`)}</span>
                                    <b>{t(`alerts.rules.${a.rule}`)}</b>
                                    {a.count > 1 && <span className="alert-count">×{a.count}</span>}
                                </div>
                                <div className="alert-who">
                                    {a.actor_name || t("access.unknownUser")}
                                    {a.actor_role && <span className={`badge badge-${a.actor_role}`}>{t(`roles.${a.actor_role}`)}</span>}
                                </div>
                                <div className="alert-detail">{a.detail}</div>
                                <div className="alert-time">
                                    {fmt(a.first_seen)}{a.last_seen !== a.first_seen ? ` – ${fmt(a.last_seen)}` : ""}
                                    {a.status === "acknowledged" && ` · ${t("alerts.ackedBy", { name: a.acknowledged_by_name || "—" })}`}
                                </div>
                            </div>
                            {a.status === "open" && (
                                <button type="button" className="q-act q-act-ok" onClick={() => ack(a)}>{t("alerts.ack")}</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <p className="q-note access-foot">{t("alerts.note")}</p>
        </div>
    );
}
