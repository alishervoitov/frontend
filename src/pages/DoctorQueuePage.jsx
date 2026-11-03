import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { errorText, hhmm, queueApi } from "../api/queue";
import { SPECIALTIES, specLabel } from "../api/specialty";

const POLL_MS = 15000;
const FRESH_MS = 3 * 60 * 1000; // shu vaqt ichida kelganlar "Yangi" deb belgilanadi

function Settings({ initial, onSaved }) {
    const { t } = useTranslation();
    const [form, setForm] = useState(initial);
    const [msg, setMsg] = useState("");
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

    async function save(e) {
        e.preventDefault();
        setMsg("");
        try {
            await queueApi.saveSettings({ ...form, avg_minutes: Number(form.avg_minutes) });
            setMsg(t("queue.saved"));
            onSaved();
        } catch (err) {
            const d = err?.response?.data;
            setMsg(d?.work_end?.[0] || d?.avg_minutes?.[0] || d?.specialty?.[0] || errorText(err, t));
        }
    }

    return (
        <form className="card q-settings" onSubmit={save}>
            <h2 className="q-h2">{t("queue.settings")}</h2>
            <div className="q-form-grid">
                <div className="field"><label>{t("queue.specialty")}</label>
                    <select className="q-select" value={form.specialty} onChange={set("specialty")}>
                        <option value="">{t("queue.selectSpecialty")}</option>
                        {SPECIALTIES.map((c) => <option key={c} value={c}>{specLabel(t, c)}</option>)}
                    </select>
                </div>
                <div className="field"><label>{t("queue.room")}</label><input value={form.room} onChange={set("room")} /></div>
                <div className="field"><label>{t("queue.workStart")}</label><input type="time" value={form.work_start?.slice(0, 5)} onChange={set("work_start")} /></div>
                <div className="field"><label>{t("queue.workEnd")}</label><input type="time" value={form.work_end?.slice(0, 5)} onChange={set("work_end")} /></div>
                <div className="field"><label>{t("queue.avgMinutes")}</label><input type="number" min="3" max="120" value={form.avg_minutes} onChange={set("avg_minutes")} /></div>
                <label className="q-check"><input type="checkbox" checked={form.accepts_queue} onChange={set("accepts_queue")} /> {t("queue.acceptsQueue")}</label>
            </div>
            <div className="q-settings-foot">
                <button className="btn btn-primary q-btn-auto" type="submit">{t("queue.save")}</button>
                {msg && <span className="q-muted">{msg}</span>}
            </div>
        </form>
    );
}

export default function DoctorQueuePage() {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [info, setInfo] = useState("");

    const load = useCallback(() => queueApi.doctorQueue().then((d) => {
        setData(d);
        window.dispatchEvent(new Event("queue-changed"));
    }).catch(() => setError(t("queue.errors.load"))), [t]);

    useEffect(() => {
        load();
        const id = setInterval(load, POLL_MS);
        return () => clearInterval(id);
    }, [load]);

    async function act(fn) {
        setBusy(true);
        setError("");
        setInfo("");
        try {
            const res = await fn();
            if (res?.called && res.skipped?.length) {
                setInfo(t("queue.skippedInfo", { called: res.called.number, list: res.skipped.map((n) => `№${n}`).join(", ") }));
            }
            await load();
        } catch (err) {
            setError(errorText(err, t));
        } finally {
            setBusy(false);
        }
    }

    if (!data) return <div className="page"><div className="empty-state">{error || t("me.loading")}</div></div>;

    const current = data.tickets.find((x) => x.status === "called");
    const waiting = data.tickets.filter((x) => x.status === "waiting" && x.arrived);
    const pending = data.tickets.filter((x) => x.status === "waiting" && !x.arrived);
    const past = data.tickets.filter((x) => !["waiting", "called"].includes(x.status)).reverse();
    const d = data.doctor;

    return (
        <div className="page">
            <div className="page-head">
                <h1>{t("queue.doctorTitle")}</h1>
                <button className="btn btn-secondary q-btn-auto" onClick={() => setShowSettings((v) => !v)}>
                    {t("queue.settings")}
                </button>
            </div>
            {error && <div className="alert-error">{error}</div>}
            {info && <div className="q-hint q-info" role="status">{info}</div>}
            {!data.settings.specialty && !showSettings && (
                <div className="q-hint">
                    {t("queue.setSpecialtyHint")}{" "}
                    <button type="button" className="q-back" onClick={() => setShowSettings(true)}>{t("queue.settings")} →</button>
                </div>
            )}
            {showSettings && <Settings initial={data.settings} onSaved={load} />}

            <div className="q-doctor-top">
                <div className="q-current">
                    <div className="q-current-label">{t("queue.current")}</div>
                    {current ? (
                        <>
                            <div className="q-current-num">{current.number}</div>
                            <div className="q-current-name">
                                {current.patient_id ? (
                                    <Link to={`/patients/${current.patient_id}`}>{current.name}</Link>
                                ) : (current.name || t("queue.walkIn"))}
                            </div>
                            <div className="q-muted">{t(`queue.source.${current.source}`)} · {hhmm(current.called_at)}</div>
                        </>
                    ) : (
                        <div className="q-current-empty">{t("queue.nobody")}</div>
                    )}
                    <div className="q-current-actions">
                        <button className="btn btn-primary" disabled={busy || (!current && waiting.length === 0)} onClick={() => act(queueApi.callNext)}>
                            {waiting.length ? t("queue.callNext") : t("queue.finishOnly")}
                        </button>
                        {current && (
                            <button className="btn btn-secondary" disabled={busy} onClick={() => act(() => queueApi.noShow(current.id))}>
                                {t("queue.markNoShow")}
                            </button>
                        )}
                    </div>
                </div>
                <div className="q-summary">
                    <div><span>{t("queue.waiting")}</span><b>{waiting.length}{pending.length ? <small className="q-pending"> +{pending.length} {t("queue.onlineShort")}</small> : null}</b></div>
                    <div><span>{t("queue.avgNow")}</span><b>{d.avg_minutes} {t("queue.min")}</b></div>
                    <div><span>{t("queue.etaIfNow")}</span><b>{d.accepting ? `~${hhmm(d.next_eta)}` : "—"}</b></div>
                    <div><span>{t("queue.hours")}</span><b>{d.work_start}–{d.work_end}</b></div>
                </div>
            </div>

            <h2 className="q-h2">{t("queue.waitingList")}</h2>
            <div className="table-card">
                {waiting.length === 0 ? (
                    <div className="empty-state">{t("queue.emptyQueue")}</div>
                ) : (
                    <table>
                        <thead><tr><th>№</th><th>{t("queue.patient")}</th><th>{t("queue.sourceCol")}</th><th>{t("admin.status")}</th><th>{t("queue.eta")}</th><th /></tr></thead>
                        <tbody>
                        {waiting.map((x) => (
                            <tr key={x.id} className={x.source === "online" && x.arrived_at && Date.now() - new Date(x.arrived_at) < FRESH_MS ? "q-row-new" : ""}>
                                <td><b>{x.number}</b></td>
                                <td>{x.patient_id ? <Link to={`/patients/${x.patient_id}`}>{x.name}</Link> : (x.name || <span className="cell-muted">{t("queue.walkIn")}</span>)}</td>
                                <td><span className={`q-src q-src-${x.source}`}>{t(`queue.source.${x.source}`)}</span></td>
                                <td>
                                    <span className="q-state q-state-here">{t("queue.statePresent")}</span>
                                    {x.source === "online" && x.arrived_at && Date.now() - new Date(x.arrived_at) < FRESH_MS && (
                                        <span className="q-state q-state-new">{t("queue.justArrived")}</span>
                                    )}
                                    {x.source === "online" && x.arrived_at && <div className="q-muted q-arrived-at">{t("queue.arrivedAt", { time: hhmm(x.arrived_at) })}</div>}
                                </td>
                                <td className="cell-muted">~{hhmm(x.eta)}</td>
                                <td><button className="q-act q-act-danger" disabled={busy} onClick={() => act(() => queueApi.noShow(x.id))}>{t("queue.markNoShow")}</button></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pending.length > 0 && (
                <>
                    <h2 className="q-h2">{t("queue.pendingTitle")}</h2>
                    <p className="q-note q-note-top">{t("queue.pendingNote")}</p>
                    <div className="table-card">
                        <table>
                            <tbody>
                            {pending.map((x) => (
                                <tr key={x.id}>
                                    <td><b>{x.number}</b></td>
                                    <td>{x.patient_id ? <Link to={`/patients/${x.patient_id}`}>{x.name}</Link> : x.name}</td>
                                    <td><span className="q-state q-state-away">{t("queue.stateAway")}</span></td>
                                    <td className="cell-muted">{t("queue.ifArrives")} ~{hhmm(x.eta)}</td>
                                    <td><button className="q-act q-act-ok" disabled={busy} onClick={() => act(() => queueApi.arrive(x.id))}>{t("queue.markArrived")}</button></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {past.length > 0 && (
                <>
                    <h2 className="q-h2">{t("queue.history")}</h2>
                    <div className="table-card">
                        <table>
                            <tbody>
                            {past.map((x) => (
                                <tr key={x.id}>
                                    <td><b>{x.number}</b></td>
                                    <td>{x.name || <span className="cell-muted">{t("queue.walkIn")}</span>}</td>
                                    <td className="cell-muted">{t(`queue.status.${x.status}`)}</td>
                                    <td className="cell-muted">{x.called_at && x.finished_at ? `${hhmm(x.called_at)}–${hhmm(x.finished_at)}` : ""}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
