import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { fmtDate, fmtTime } from "../api/dates";

const PERIODS = ["30", "90", "all"];

function dayKey(iso) {
    return fmtDate(iso);
}

// "Kartamni kim ko'rdi": bemor o'z tibbiy ma'lumotlariga kim va qachon murojaat qilganini ko'radi
export default function AccessLogPage() {
    const { t } = useTranslation();
    const [period, setPeriod] = useState("30");
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        setData(null);
        setError(false);
        client
            .get("/records/access-log/me/", { params: period === "all" ? {} : { days: period } })
            .then((r) => setData(r.data))
            .catch(() => setError(true));
    }, [period]);

    const groups = [];
    for (const row of data?.results || []) {
        const key = dayKey(row.timestamp);
        const last = groups[groups.length - 1];
        if (last && last.key === key) last.rows.push(row);
        else groups.push({ key, rows: [row] });
    }

    return (
        <div className="page">
            <div className="page-head"><h1>{t("access.title")}</h1></div>
            <p className="access-lead">{t("access.lead")}</p>

            <div className="access-toolbar">
                <div className="au-tabs">
                    {PERIODS.map((p) => (
                        <button key={p} type="button" className={`au-tab ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
                            {t(`access.period.${p}`)}
                        </button>
                    ))}
                </div>
                {data && data.summary.events > 0 && (
                    <span className="access-summary">{t("access.summary", { events: data.summary.events, people: data.summary.people })}</span>
                )}
            </div>

            {error ? (
                <div className="table-card"><div className="empty-state">{t("access.loadError")}</div></div>
            ) : !data ? (
                <div className="table-card"><div className="empty-state">{t("me.loading")}</div></div>
            ) : data.results.length === 0 ? (
                <div className="table-card"><div className="empty-state">{t("access.empty")}</div></div>
            ) : (
                groups.map((g) => (
                    <section key={g.key} className="access-day">
                        <h2 className="access-date">{g.key}</h2>
                        <div className="access-list">
                            {g.rows.map((r) => (
                                <div key={r.id} className={`access-row access-${r.action}`}>
                                    <span className="access-time">
                                        {fmtTime(r.timestamp)}
                                    </span>
                                    <div className="access-body">
                                        <div className="access-who">
                                            <b>{r.actor_name || t("access.unknownUser")}</b>
                                            {r.actor_role && <span className={`badge badge-${r.actor_role}`}>{t(`roles.${r.actor_role}`)}</span>}
                                        </div>
                                        <div className="access-what">
                                            {t(`access.actions.${r.action}`, { defaultValue: r.action })}
                                            {r.detail && <span className="access-detail"> · {r.detail}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))
            )}
            <p className="q-note access-foot">{t("access.note")}</p>
        </div>
    );
}
