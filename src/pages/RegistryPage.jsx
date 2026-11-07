import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { errorText, gateOk, hhmm, queueApi } from "../api/queue";
import TicketSlip from "../components/TicketSlip";
import PrintedCheckinQr from "../components/PrintedCheckinQr";
import PatientPicker, { PhotoGate } from "../components/PatientPicker";
import { groupBySpecialty, matchesQuery, specLabel } from "../api/specialty";
import "../styles/registry.css";

const POLL_MS = 20000;
const SHOW_WAITING = 5;

// Brauzerlarda o'zbekcha sana formati yo'q ("M11 3, Tue"), shuning uchun qo'lda
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const UZ_DAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
function formatToday(lang) {
    const d = new Date();
    if ((lang || "uz").startsWith("uz")) return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${UZ_DAYS[d.getDay()]}`;
    return d.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" });
}

const initials = (name) => (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

// Bitta shifokorning bugungi navbati
// Kioskdan olingan chipta egasi noma'lum: registratura uni bemor kartasiga bog'laydi
function TicketName({ x, onLink, t }) {
    if (x.patient_id) return x.name;
    return (
        <>
            <span className="reg-unid">{x.name || t("reg.unidentified")}</span>
            <button type="button" className="reg-link-btn" onClick={() => onLink(x)}>{t("reg.link")}</button>
        </>
    );
}

function DoctorCard({ row, onQuickIssue, onArrive, onLink, busyId }) {
    const { t } = useTranslation();
    const d = row.doctor;
    const waiting = row.tickets.filter((x) => x.status === "waiting" && x.arrived);
    const pending = row.tickets.filter((x) => x.status === "waiting" && !x.arrived);
    const cur = row.tickets.find((x) => x.status === "called");
    const done = row.tickets.filter((x) => x.status === "done").length;
    return (
        <article className={`reg-doc ${d.accepting_walkin ? "" : "is-closed"}`}>
            <header className="reg-doc-head">
                <span className="reg-avatar" aria-hidden="true">{initials(d.name)}</span>
                <div className="reg-doc-id">
                    <b>{d.name}</b>
                    <span>{specLabel(t, d.specialty)}{d.room ? ` · ${t("queue.room")} ${d.room}` : ""}</span>
                </div>
                <button type="button" className="reg-quick" disabled={!d.accepting_walkin}
                        title={t("reg.quickIssue")} aria-label={`${t("reg.quickIssue")}: ${d.name}`} onClick={() => onQuickIssue(d)}>+</button>
            </header>

            <div className={`reg-now ${cur ? "" : "is-idle"}`}>
                <div className="reg-now-num">{cur ? cur.number : "—"}</div>
                <div className="reg-now-text">
                    <span>{t("queue.nowServing")}</span>
                    <b>{cur ? <TicketName x={cur} onLink={(x) => onLink(x, d)} t={t} /> : t("reg.free")}</b>
                </div>
            </div>

            <div className="reg-meta">
                <span><b>{waiting.length}</b> {t("reg.inLine")}</span>
                <span><b>{done}</b> {t("reg.doneToday")}</span>
                <span>{d.accepting_walkin ? <>{t("reg.next")} <b>~{hhmm(d.next_eta_walkin)}</b></> : <span className="reg-closed">{t("reg.closedToday")}</span>}</span>
            </div>

            {waiting.length > 0 ? (
                <ol className="reg-line">
                    {waiting.slice(0, SHOW_WAITING).map((x) => (
                        <li key={x.id}>
                            <span className="reg-num">{x.number}</span>
                            <span className="reg-line-name"><TicketName x={x} onLink={(y) => onLink(y, d)} t={t} /></span>
                            <span className={`q-src q-src-${x.source}`}>{t(`queue.source.${x.source}`)}</span>
                            <span className="reg-eta">~{hhmm(x.eta)}</span>
                        </li>
                    ))}
                    {waiting.length > SHOW_WAITING && <li className="reg-more">+{waiting.length - SHOW_WAITING}</li>}
                </ol>
            ) : (
                <div className="reg-empty">{t("queue.emptyQueue")}</div>
            )}

            {pending.length > 0 && (
                <div className="reg-pending">
                    <div className="reg-pending-title">{t("queue.pendingTitle")} · {pending.length}</div>
                    {pending.map((x) => (
                        <div key={x.id} className="reg-pending-row">
                            <span className="reg-num reg-num-ghost">{x.number}</span>
                            <span className="reg-line-name">{x.name}</span>
                            <button type="button" className="q-act q-act-ok" disabled={busyId === x.id} onClick={() => onArrive(x)}>
                                {t("queue.markArrived")}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </article>
    );
}

export default function RegistryPage() {
    const { t, i18n } = useTranslation();
    const [rows, setRows] = useState(null);
    const [doctorId, setDoctorId] = useState(null);
    const [query, setQuery] = useState("");
    const [patient, setPatient] = useState(null);
    const [linkFor, setLinkFor] = useState(null);
    const [linkPatient, setLinkPatient] = useState(null);
    const [noPhoto, setNoPhoto] = useState("");
    const [linkNoPhoto, setLinkNoPhoto] = useState("");
    const [ticket, setTicket] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(() => queueApi.registry().then((r) => { setRows(r); setError(""); })
        .catch(() => setError(t("queue.errors.load"))), [t]);

    useEffect(() => {
        load();
        const id = setInterval(load, POLL_MS);
        return () => clearInterval(id);
    }, [load]);

    const doctors = useMemo(() => (rows || []).map((r) => r.doctor), [rows]);
    const selected = doctors.find((d) => d.id === doctorId) || null;
    const groups = groupBySpecialty(doctors.filter((d) => matchesQuery(d, query)));

    const totals = useMemo(() => {
        const all = (rows || []).flatMap((r) => r.tickets);
        return {
            doctors: doctors.filter((d) => d.accepting_walkin).length,
            waiting: all.filter((x) => x.status === "waiting" && x.arrived).length,
            serving: all.filter((x) => x.status === "called").length,
            pending: all.filter((x) => x.status === "waiting" && !x.arrived).length,
            done: all.filter((x) => x.status === "done").length,
            unidentified: all.filter((x) => !x.patient_id && (x.status === "waiting" || x.status === "called")).length,
        };
    }, [rows, doctors]);

    async function issue(e) {
        e.preventDefault();
        if (!selected || !patient) return;
        setBusy(true);
        setError("");
        try {
            const tk = await queueApi.registryIssue(selected.id, patient.id, patient.photo_updated_at ? "" : noPhoto);
            setTicket(tk);
            setPatient(null);
            setNoPhoto("");
            load();
        } catch (err) {
            setError(errorText(err, t));
        } finally {
            setBusy(false);
        }
    }

    async function arrive(x) {
        setBusyId(x.id);
        try { await queueApi.arrive(x.id); await load(); } catch (err) { setError(errorText(err, t)); } finally { setBusyId(null); }
    }

    function quickIssue(d) {
        setTicket(null);
        setDoctorId(d.id);
        setQuery("");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => document.querySelector(".reg-panel .pp-search input")?.focus(), 250);
    }

    function closeLink() {
        setLinkFor(null);
        setLinkPatient(null);
        setLinkNoPhoto("");
    }

    async function link() {
        const x = linkFor, p = linkPatient;
        closeLink();
        setError("");
        try { await queueApi.registryLink(x.ticket.id, p.id, p.photo_updated_at ? "" : linkNoPhoto); } catch (err) { setError(errorText(err, t)); }
        load();
    }

    const today = formatToday(i18n.language);

    return (
        <div className="page reg-page">
            <div className="reg-top">
                <div>
                    <h1>{t("queue.registryTitle")}</h1>
                    <p className="reg-date">{today}</p>
                </div>
                <div className="reg-top-actions">
                    <Link className="btn btn-secondary q-btn-auto" to="/admin/queue-stats">{t("nav.queueStats")}</Link>
                    <Link className="btn btn-secondary q-btn-auto" to="/admin/kiosks">{t("nav.kiosks")}</Link>
                    <a className="btn btn-secondary q-btn-auto" href="/kiosk" target="_blank" rel="noreferrer">{t("queue.openKiosk")} ↗</a>
                </div>
            </div>

            <div className="reg-stats">
                <div><span>{t("reg.statDoctors")}</span><b>{totals.doctors}</b></div>
                <div><span>{t("reg.statWaiting")}</span><b>{totals.waiting}</b></div>
                <div><span>{t("reg.statServing")}</span><b>{totals.serving}</b></div>
                <div><span>{t("reg.statDone")}</span><b>{totals.done}</b></div>
                <div className={totals.pending ? "is-warn" : ""}><span>{t("reg.statPending")}</span><b>{totals.pending}</b></div>
                {totals.unidentified > 0 && (
                    <div className="is-alert"><span>{t("reg.statUnidentified")}</span><b>{totals.unidentified}</b></div>
                )}
            </div>

            {error && <div className="alert-error">{error}</div>}

            <div className="reg-layout">
                <aside className="reg-panel card">
                    {ticket ? (
                        <div className="reg-issued">
                            <div className="reg-issued-ok">✓ {t("reg.issued")}{ticket.patient_name ? ` · ${ticket.patient_name}` : ""}</div>
                            <div className="q-print-area"><TicketSlip ticket={ticket} /></div>
                            <div className="reg-issued-actions">
                                <button className="btn btn-primary" onClick={() => window.print()}>{t("queue.print")}</button>
                                <button className="btn btn-secondary" onClick={() => setTicket(null)}>{t("reg.nextTicket")}</button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={issue}>
                            <h2 className="reg-panel-title">{t("queue.issueTitle")}</h2>
                            <label className="reg-label" htmlFor="reg-search">1. {t("queue.doctor")}</label>
                            <input id="reg-search" className="reg-search" type="search" value={query}
                                   onChange={(e) => setQuery(e.target.value)} placeholder={t("reg.search")} />
                            <div className="reg-pick" role="radiogroup" aria-label={t("queue.doctor")}>
                                {rows === null && <div className="reg-empty">{t("me.loading")}</div>}
                                {rows !== null && groups.length === 0 && <div className="reg-empty">{t("reg.noDoctor")}</div>}
                                {groups.map(([code, list]) => (
                                    <div key={code} className="reg-pick-group">
                                        <div className="reg-pick-spec">{specLabel(t, code)}</div>
                                        {list.map((d) => (
                                            <button type="button" key={d.id} role="radio" aria-checked={d.id === doctorId}
                                                    disabled={!d.accepting_walkin}
                                                    className={`reg-pick-item ${d.id === doctorId ? "is-selected" : ""}`}
                                                    onClick={() => setDoctorId(d.id)}>
                                                <span className="reg-radio" aria-hidden="true" />
                                                <span className="reg-pick-name">
                                                    <b>{d.name}</b>
                                                    <small>{d.room ? `${t("queue.room")} ${d.room} · ` : ""}{t("reg.waitingN", { n: d.waiting })}</small>
                                                </span>
                                                <span className="reg-pick-eta">
                                                    {d.accepting_walkin ? `~${hhmm(d.next_eta_walkin)}` : t("reg.closedShort")}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="reg-label">2. {t("reg.patientStep")}</div>
                            <PatientPicker value={patient} onChange={(p) => { setPatient(p); if (!p) setNoPhoto(""); }} />
                            <PhotoGate key={patient?.id ?? "none"} patient={patient} reason={noPhoto} onReason={setNoPhoto} />
                            <button className="btn btn-primary reg-submit" disabled={busy || !selected || !gateOk(patient, noPhoto)}>
                                {!selected ? t("reg.chooseDoctor") : !patient ? t("reg.choosePatient") : t("reg.issueFor", { name: selected.name })}
                            </button>
                        </form>
                    )}
                </aside>

                <section className="reg-board" aria-label={t("queue.todayAll")}>
                    <h2 className="reg-board-title">{t("queue.todayAll")}</h2>
                    <div className="reg-grid">
                        {(rows || []).map((r) => (
                            <DoctorCard key={r.doctor.id} row={r} onQuickIssue={quickIssue} onArrive={arrive}
                                        onLink={(x, d) => setLinkFor({ ticket: x, doctor: d })} busyId={busyId} />
                        ))}
                    </div>
                </section>
            </div>

            {linkFor && (
                <div className="cs-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeLink()}>
                    <div className="cs-modal pp-modal" role="dialog" aria-modal="true" aria-labelledby="link-title">
                        <div className="cs-modal-head">
                            <span className="reg-num">{linkFor.ticket.number}</span>
                            <div>
                                <h2 id="link-title">{t("reg.linkTitle")}</h2>
                                <div className="cs-modal-sub">{linkFor.doctor.name} · {t(`queue.source.${linkFor.ticket.source}`)}</div>
                            </div>
                        </div>
                        <p className="pp-hint" style={{ marginBottom: 12 }}>{t("reg.linkHint")}</p>
                        <PatientPicker value={linkPatient} onChange={(p) => { setLinkPatient(p); setLinkNoPhoto(""); }} autoFocus />
                        <PhotoGate key={linkPatient?.id ?? "none"} patient={linkPatient} reason={linkNoPhoto} onReason={setLinkNoPhoto} />
                        <div className="cs-modal-actions" style={{ marginTop: 14 }}>
                            <button type="button" className="btn btn-secondary" onClick={closeLink}>{t("consent.cancel")}</button>
                            <button type="button" className="btn btn-primary" disabled={!gateOk(linkPatient, linkNoPhoto)} onClick={link}>{t("reg.link")}</button>
                        </div>
                    </div>
                </div>
            )}

            <details className="reg-backup">
                <summary>{t("queue.printedTitle")}</summary>
                <PrintedCheckinQr />
            </details>
        </div>
    );
}
