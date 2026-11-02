import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { errorText, hhmm, queueApi } from "../api/queue";
import TicketSlip from "../components/TicketSlip";
import { groupBySpecialty, specLabel } from "../api/specialty";

const POLL_MS = 20000;

export default function RegistryPage() {
    const { t } = useTranslation();
    const [rows, setRows] = useState([]);
    const [doctor, setDoctor] = useState("");
    const [name, setName] = useState("");
    const [ticket, setTicket] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => queueApi.registry().then(setRows).catch(() => setError(t("queue.errors.load"))), [t]);

    useEffect(() => {
        load();
        const id = setInterval(load, POLL_MS);
        return () => clearInterval(id);
    }, [load]);

    async function issue(e) {
        e.preventDefault();
        if (!doctor) return;
        setBusy(true);
        setError("");
        try {
            const tk = await queueApi.registryIssue(Number(doctor), name);
            setTicket(tk);
            setName("");
            load();
        } catch (err) {
            setError(errorText(err, t));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="page">
            <div className="page-head">
                <h1>{t("queue.registryTitle")}</h1>
                <a className="btn btn-secondary q-btn-auto" href="/kiosk" target="_blank" rel="noreferrer">{t("queue.openKiosk")}</a>
            </div>
            {error && <div className="alert-error">{error}</div>}

            <div className="q-registry">
                <form className="card q-issue" onSubmit={issue}>
                    <h2 className="q-h2">{t("queue.issueTitle")}</h2>
                    <div className="field">
                        <label>{t("queue.doctor")}</label>
                        <select value={doctor} onChange={(e) => setDoctor(e.target.value)} required>
                            <option value="">{t("queue.selectDoctor")}</option>
                            {groupBySpecialty(rows.map((r) => r.doctor)).map(([code, list]) => (
                                <optgroup key={code} label={specLabel(t, code)}>
                                    {list.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name} ({t("queue.waiting").toLowerCase()}: {d.waiting})
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>{t("queue.visitorName")}</label>
                        <input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder={t("queue.optional")} />
                    </div>
                    <button className="btn btn-primary" disabled={busy || !doctor}>{t("queue.issue")}</button>
                </form>

                {ticket && (
                    <div className="q-issued">
                        <div className="q-print-area"><TicketSlip ticket={ticket} /></div>
                        <div className="btn-row">
                            <button className="btn btn-primary q-btn-auto" onClick={() => window.print()}>{t("queue.print")}</button>
                            <button className="btn btn-secondary q-btn-auto" onClick={() => setTicket(null)}>{t("queue.close")}</button>
                        </div>
                    </div>
                )}
            </div>

            <h2 className="q-h2">{t("queue.todayAll")}</h2>
            <div className="q-board">
                {rows.map(({ doctor: d, tickets }) => {
                    const waiting = tickets.filter((x) => x.status === "waiting" && x.arrived);
                    const pending = tickets.filter((x) => x.status === "waiting" && !x.arrived);
                    const cur = tickets.find((x) => x.status === "called");
                    return (
                        <div key={d.id} className="q-board-col">
                            <div className="q-board-head">
                                <b>{d.name}</b>
                                <span className="q-muted">{specLabel(t, d.specialty)}{d.room ? ` · ${t("queue.room")} ${d.room}` : ""}</span>
                            </div>
                            <div className="q-board-now">{t("queue.nowServing")}: <b>{cur ? cur.number : "—"}</b></div>
                            <ul>
                                {waiting.slice(0, 8).map((x) => (
                                    <li key={x.id}>
                                        <b>{x.number}</b>
                                        <span>{x.name || t("queue.walkIn")}</span>
                                        <span className="q-muted">~{hhmm(x.eta)}</span>
                                    </li>
                                ))}
                                {waiting.length > 8 && <li className="q-muted q-board-empty">+{waiting.length - 8}</li>}
                                {waiting.length === 0 && <li className="q-muted q-board-empty">{t("queue.emptyQueue")}</li>}
                            </ul>
                            {pending.length > 0 && (
                                <div className="q-board-pending">
                                    <div className="q-board-pending-title">{t("queue.pendingTitle")}</div>
                                    {pending.map((x) => (
                                        <div key={x.id} className="q-board-pending-row">
                                            <b>{x.number}</b>
                                            <span>{x.name}</span>
                                            <button type="button" className="q-link q-link-ok" onClick={() => queueApi.arrive(x.id).then(load).catch((err) => setError(errorText(err, t)))}>
                                                {t("queue.markArrived")}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
