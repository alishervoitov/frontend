import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { errorText, hhmm, queueApi } from "../api/queue";
import { groupBySpecialty, matchesQuery, specLabel } from "../api/specialty";
import SpecialtyPicker from "../components/SpecialtyPicker";

const POLL_MS = 30000;

function MyTicket({ ticket, onCancel }) {
    const { t } = useTranslation();
    const active = ticket.status === "waiting" || ticket.status === "called";
    return (
        <div className={`q-my q-my-${ticket.status}`}>
            <div className="q-my-num">
                <span>{t("queue.number")}</span>
                <b>{ticket.number}</b>
            </div>
            <div className="q-my-body">
                <div className="q-my-doctor">{ticket.doctor.name}</div>
                <div className="q-muted">
                    {specLabel(t, ticket.doctor.specialty)}
                    {ticket.doctor.room ? ` · ${t("queue.room")} ${ticket.doctor.room}` : ""}
                </div>
                {ticket.status === "waiting" && (
                    <div className="q-my-stats">
                        <div><span>{t("queue.ahead")}</span><b>{ticket.ahead}</b></div>
                        <div><span>{ticket.arrived ? t("queue.eta") : t("queue.etaIfArrive")}</span><b>~{hhmm(ticket.eta)}</b></div>
                    </div>
                )}
                {ticket.status === "waiting" && !ticket.arrived && (
                    <div className="q-arrive q-arrive-qr">
                        <span className="q-arrive-qr-icon" aria-hidden="true">▣</span>
                        <p>{t("queue.arriveQrHint")}</p>
                    </div>
                )}
                {ticket.status === "waiting" && ticket.arrived && <div className="q-arrived">✓ {t("queue.arrivedNote")}</div>}
                {ticket.status === "called" && <div className="q-callout">{t("queue.calledNow")}</div>}
                {!active && <div className="q-muted">{t(`queue.status.${ticket.status}`)}</div>}
            </div>
            {ticket.status === "waiting" && (
                <button className="btn btn-secondary q-btn-sm" onClick={() => onCancel(ticket)}>
                    {t("queue.cancel")}
                </button>
            )}
        </div>
    );
}

export default function QueuePage() {
    const { t } = useTranslation();
    const [doctors, setDoctors] = useState([]);
    const [mine, setMine] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("");
    const [spec, setSpec] = useState(null);

    const load = useCallback(() => {
        return Promise.all([queueApi.doctors(), queueApi.myTickets()])
            .then(([d, m]) => {
                setDoctors(d);
                setMine(m);
            })
            .catch(() => setError(t("queue.errors.load")))
            .finally(() => setLoading(false));
    }, [t]);

    useEffect(() => {
        load();
        const id = setInterval(load, POLL_MS);
        return () => clearInterval(id);
    }, [load]);

    async function take(doctor) {
        setBusy(doctor.id);
        setError("");
        try {
            await queueApi.take(doctor.id);
            await load();
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            setError(errorText(err, t));
        } finally {
            setBusy(null);
        }
    }

    async function cancel(ticket) {
        if (!window.confirm(t("queue.cancelConfirm"))) return;
        try {
            await queueApi.cancel(ticket.id);
            await load();
        } catch (err) {
            setError(errorText(err, t));
        }
    }

    const activeIds = new Set(mine.filter((m) => m.status === "waiting" || m.status === "called").map((m) => m.doctor.id));
    const q = filter.trim();
    // Qidiruv yozilsa: mos shifokorlar yo'nalish bo'yicha guruhlanadi; tanlangan yo'nalish bo'lsa: faqat uning shifokorlari
    const shown = spec
        ? doctors.filter((d) => (d.specialty || "other") === spec)
        : doctors.filter((d) => matchesQuery(d, q));
    const showPicker = !spec && !q;

    const renderDoctor = (d) => (
        <div key={d.id} className={`q-doc ${d.accepting ? "" : "q-doc-off"}`}>
            <div className="q-doc-top">
                <div>
                    <div className="q-doc-name">{d.name}</div>
                    <div className="q-muted">
                        {specLabel(t, d.specialty)}
                        {d.room ? ` · ${t("queue.room")} ${d.room}` : ""}
                    </div>
                </div>
                <span className="q-hours">{d.work_start}–{d.work_end}</span>
            </div>
            <div className="q-doc-stats">
                <div>
                    <span>{t("queue.waiting")}</span>
                    <b>{d.waiting}{d.pending_online ? <small className="q-pending"> +{d.pending_online} {t("queue.onlineShort")}</small> : null}</b>
                </div>
                <div><span>{t("queue.nowServing")}</span><b>{d.current_number ?? "—"}</b></div>
                <div><span>{t("queue.etaIfNow")}</span><b>{d.accepting ? `~${hhmm(d.next_eta)}` : "—"}</b></div>
            </div>
            <button
                className="btn btn-primary"
                disabled={!d.accepting || activeIds.has(d.id) || busy === d.id}
                onClick={() => take(d)}
            >
                {activeIds.has(d.id) ? t("queue.alreadyTaken") : d.accepting ? t("queue.take") : t("queue.closed")}
            </button>
        </div>
    );

    return (
        <div className="page">
            <div className="page-head">
                <h1>{t("queue.title")}</h1>
            </div>
            <p className="q-lead">{t("queue.lead")}</p>

            {error && <div className="alert-error">{error}</div>}

            {mine.length > 0 && (
                <section className="q-section">
                    <h2 className="q-h2">{t("queue.myTickets")}</h2>
                    <div className="q-my-list">
                        {mine.map((tk) => <MyTicket key={tk.id} ticket={tk} onCancel={cancel} />)}
                    </div>
                    <p className="q-note">{t("queue.etaNote")}</p>
                </section>
            )}

            <section className="q-section">
                <h2 className="q-h2">{spec ? specLabel(t, spec) : t("queue.chooseSpecialty")}</h2>
                {spec ? (
                    <button type="button" className="q-back" onClick={() => setSpec(null)}>← {t("queue.allSpecialties")}</button>
                ) : (
                    <input
                        className="search-input q-search-wide"
                        placeholder={t("queue.searchPlaceholder")}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                )}
                {loading ? (
                    <div className="empty-state">{t("me.loading")}</div>
                ) : showPicker ? (
                    <SpecialtyPicker doctors={doctors} onPick={setSpec} />
                ) : shown.length === 0 ? (
                    <div className="empty-state">{t("queue.noMatch")}</div>
                ) : spec ? (
                    <div className="q-grid">{shown.map(renderDoctor)}</div>
                ) : (
                    groupBySpecialty(shown).map(([code, list]) => (
                        <div key={code} className="q-group">
                            <h3 className="q-group-title">{specLabel(t, code)}</h3>
                            <div className="q-grid">{list.map(renderDoctor)}</div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
}
