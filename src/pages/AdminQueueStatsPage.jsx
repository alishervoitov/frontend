import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { specLabel } from "../api/specialty";

const PERIODS = [7, 30, 90];
const SERIES = [
    { key: "done", color: "var(--chart-done)" },
    { key: "no_show", color: "var(--chart-noshow)" },
];

const fmtMin = (v, t) => (v == null ? "—" : `${String(v).replace(".", ",")} ${t("queue.min")}`);
const fmtPct = (v) => (v == null ? "—" : `${String(v).replace(".", ",")}%`);

// Ustunli grafik (SVG). series: [{key,color}], bitta bo'lsa oddiy ustun, ko'p bo'lsa ustma-ust.
function BarChart({ data, series, labelOf, tooltipOf, height = 180 }) {
    const [hover, setHover] = useState(null);
    const box = useRef(null);
    const [W, setW] = useState(640);
    // SVG haqiqiy piksel kengligida chiziladi: yozuvlar kichik ekranda ham bir xil o'lchamda
    useEffect(() => {
        if (!box.current) return undefined;
        const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
        ro.observe(box.current);
        return () => ro.disconnect();
    }, []);
    const H = height, padL = 32, padB = 22, padT = 8;
    const totals = data.map((d) => series.reduce((s, x) => s + (d[x.key] || 0), 0));
    const max = Math.max(1, ...totals);
    // "Yumaloq" qadam: 1, 2, 5 x 10^k
    const raw = max / 4, mag = 10 ** Math.floor(Math.log10(raw || 1));
    const step = Math.max(1, [1, 2, 5, 10].map((m) => m * mag).find((v) => v >= raw));
    const ticks = Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
    const top = ticks[ticks.length - 1] || 1;
    const bw = (W - padL) / data.length;
    const barW = Math.max(3, Math.min(28, bw - 4));
    const y = (v) => H - padB - (v / top) * (H - padB - padT);
    const labelEvery = Math.ceil(data.length / Math.max(3, Math.floor(W / 64)));

    return (
        <div className="qs-chart" ref={box} onMouseLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
                {ticks.map((v) => (
                    <g key={v}>
                        <line x1={padL} x2={W} y1={y(v)} y2={y(v)} className="qs-grid" />
                        <text x={padL - 6} y={y(v) + 4} className="qs-axis" textAnchor="end">{v}</text>
                    </g>
                ))}
                {data.map((d, i) => {
                    const x = padL + i * bw + (bw - barW) / 2;
                    let acc = 0;
                    return (
                        <g key={i}>
                            {series.map((s, si) => {
                                const v = d[s.key] || 0;
                                if (!v) return null;
                                const y0 = y(acc), y1 = y(acc + v);
                                acc += v;
                                const isTop = series.slice(si + 1).every((n) => !(d[n.key] > 0));
                                const h = Math.max(1, y0 - y1 - (isTop ? 0 : 2));
                                return isTop ? (
                                    <path key={s.key} fill={s.color}
                                          d={`M${x},${y0} V${y1 + Math.min(4, h)} Q${x},${y1} ${x + Math.min(4, barW / 2)},${y1} H${x + barW - Math.min(4, barW / 2)} Q${x + barW},${y1} ${x + barW},${y1 + Math.min(4, h)} V${y0} Z`} />
                                ) : (
                                    <rect key={s.key} x={x} y={y0 - h} width={barW} height={h} fill={s.color} />
                                );
                            })}
                            {i % labelEvery === 0 && (
                                <text x={x + barW / 2} y={H - 6} className="qs-axis" textAnchor="middle">{labelOf(d)}</text>
                            )}
                            <rect x={padL + i * bw} y={padT} width={bw} height={H - padB - padT} fill="transparent"
                                  onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />
                            {hover === i && <rect x={padL + i * bw} y={padT} width={bw} height={H - padB - padT} className="qs-hover" />}
                        </g>
                    );
                })}
            </svg>
            {hover != null && (
                <div className="qs-tip" style={{ left: `${((padL + (hover + 0.5) * bw) / W) * 100}%` }}>
                    {tooltipOf(data[hover])}
                </div>
            )}
        </div>
    );
}

export default function AdminQueueStatsPage() {
    const { t } = useTranslation();
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        setError("");
        client.get("/queue/admin/stats/", { params: { days } })
            .then((r) => setData(r.data))
            .catch(() => setError(t("queue.errors.load")));
    }, [days, t]);

    const tot = data?.totals;
    const maxDocTickets = Math.max(1, ...(data?.doctors || []).map((d) => d.tickets));
    const dayLabel = (d) => d.date.slice(8, 10) + "." + d.date.slice(5, 7);

    return (
        <div className="page qs-page">
            <div className="page-head">
                <h1>{t("qstats.title")}</h1>
                <div className="qs-periods" role="group" aria-label={t("qstats.period")}>
                    {PERIODS.map((p) => (
                        <button key={p} type="button" className={`qs-period ${days === p ? "active" : ""}`} onClick={() => setDays(p)}>
                            {t("qstats.days", { n: p })}
                        </button>
                    ))}
                </div>
            </div>
            {error && <div className="alert-error">{error}</div>}
            {!data ? (
                <div className="empty-state">{t("me.loading")}</div>
            ) : (
                <>
                    <div className="qs-tiles">
                        <div className="qs-tile">
                            <span>{t("qstats.tickets")}</span>
                            <b>{tot.tickets}</b>
                            <small>{t("qstats.ticketsSub", { done: tot.done, cancelled: tot.cancelled })}</small>
                        </div>
                        <div className="qs-tile">
                            <span>{t("qstats.avgWait")}</span>
                            <b>{fmtMin(tot.avg_wait_min, t)}</b>
                            <small>{t("qstats.median")}: {fmtMin(tot.median_wait_min, t)}</small>
                        </div>
                        <div className="qs-tile">
                            <span>{t("qstats.noShowRate")}</span>
                            <b>{fmtPct(tot.no_show_rate)}</b>
                            <small>{t("qstats.noShowSub", { n: tot.no_show })}</small>
                        </div>
                        <div className="qs-tile">
                            <span>{t("qstats.avgService")}</span>
                            <b>{fmtMin(tot.avg_service_min, t)}</b>
                            <small>{t("qstats.avgServiceSub")}</small>
                        </div>
                    </div>

                    {tot.tickets === 0 ? (
                        <div className="empty-state">{t("qstats.empty")}</div>
                    ) : (
                        <>
                            <div className="qs-grid2">
                                <section className="card qs-card qs-wide">
                                    <div className="qs-card-head">
                                        <h2>{t("qstats.byDay")}</h2>
                                        <div className="qs-legend">
                                            {SERIES.map((s) => (
                                                <span key={s.key}><i style={{ background: s.color }} />{t(`qstats.series.${s.key}`)}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <BarChart data={data.by_day} series={SERIES} labelOf={dayLabel}
                                              tooltipOf={(d) => (<>
                                                  <b>{dayLabel(d)}</b>
                                                  <span>{t("qstats.series.done")}: {d.done}</span>
                                                  <span>{t("qstats.series.no_show")}: {d.no_show}</span>
                                                  {d.cancelled > 0 && <span>{t("qstats.cancelled")}: {d.cancelled}</span>}
                                              </>)} />
                                </section>

                                <section className="card qs-card">
                                    <div className="qs-card-head"><h2>{t("qstats.byHour")}</h2></div>
                                    <p className="q-muted qs-hint">{t("qstats.byHourHint")}</p>
                                    {data.by_hour.length ? (
                                        <BarChart data={data.by_hour} series={[{ key: "count", color: "var(--chart-done)" }]}
                                                  labelOf={(h) => String(h.hour).padStart(2, "0")} height={160}
                                                  tooltipOf={(h) => (<><b>{String(h.hour).padStart(2, "0")}:00–{String(h.hour + 1).padStart(2, "0")}:00</b><span>{t("qstats.arrivals", { n: h.count })}</span></>)} />
                                    ) : <div className="empty-state">—</div>}
                                </section>

                                <section className="card qs-card">
                                    <div className="qs-card-head"><h2>{t("qstats.bySource")}</h2></div>
                                    <table className="qs-table">
                                        <thead><tr><th>{t("queue.sourceCol")}</th><th>{t("qstats.tickets")}</th><th>{t("qstats.noShowShort")}</th></tr></thead>
                                        <tbody>
                                        {data.by_source.map((s) => (
                                            <tr key={s.source}>
                                                <td><span className={`q-src q-src-${s.source}`}>{t(`queue.source.${s.source}`)}</span></td>
                                                <td>{s.tickets}</td>
                                                <td>{fmtPct(s.no_show_rate)}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                    <p className="q-muted qs-hint">{t("qstats.bySourceHint")}</p>
                                </section>
                            </div>

                            <h2 className="q-h2">{t("qstats.doctors")}</h2>
                            <div className="table-card">
                                <table className="qs-doctors">
                                    <thead>
                                    <tr>
                                        <th>#</th><th>{t("queue.doctor")}</th><th>{t("qstats.tickets")}</th>
                                        <th>{t("qstats.series.done")}</th><th>{t("qstats.noShowShort")}</th>
                                        <th>{t("qstats.avgWait")}</th><th>{t("qstats.avgService")}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {data.doctors.map((d, i) => (
                                        <tr key={d.id}>
                                            <td className="cell-muted">{i + 1}</td>
                                            <td><b>{d.name}</b><div className="q-muted qs-spec">{d.specialty ? specLabel(t, d.specialty) : "—"}</div></td>
                                            <td>
                                                <div className="qs-inline">
                                                    <span className="qs-inline-bar" style={{ width: `${(d.tickets / maxDocTickets) * 100}%` }} />
                                                    <span>{d.tickets}</span>
                                                </div>
                                            </td>
                                            <td>{d.done}</td>
                                            <td>{fmtPct(d.no_show_rate)}</td>
                                            <td>{fmtMin(d.avg_wait_min, t)}</td>
                                            <td>{fmtMin(d.avg_service_min, t)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="q-muted qs-note">{t("qstats.note")}</p>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
