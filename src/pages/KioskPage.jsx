import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { errorText, hhmm, kioskApi, kioskKey } from "../api/queue";
import LanguageSwitcher from "../components/LanguageSwitcher";
import TicketSlip from "../components/TicketSlip";

const RESET_MS = 20000;
const POLL_MS = 30000;

function KeySetup({ onDone }) {
    const { t } = useTranslation();
    const [value, setValue] = useState("");
    return (
        <div className="kiosk-setup">
            <h1>{t("queue.kioskSetup")}</h1>
            <p className="q-muted">{t("queue.kioskSetupHint")}</p>
            <form onSubmit={(e) => { e.preventDefault(); kioskKey.set(value.trim()); onDone(); }}>
                <input type="password" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
                <button className="btn btn-primary" disabled={!value.trim()}>{t("queue.save")}</button>
            </form>
        </div>
    );
}

export default function KioskPage() {
    const { t } = useTranslation();
    const [hasKey, setHasKey] = useState(!!kioskKey.get());
    const [doctors, setDoctors] = useState([]);
    const [ticket, setTicket] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        return kioskApi.doctors()
            .then((d) => { setDoctors(d); setError(""); })
            .catch((err) => {
                if (err.status === 403) { kioskKey.set(""); setHasKey(false); }
                else setError(t("queue.errors.load"));
            });
    }, [t]);

    useEffect(() => {
        if (!hasKey) return;
        load();
        const id = setInterval(load, POLL_MS);
        return () => clearInterval(id);
    }, [hasKey, load]);

    useEffect(() => {
        if (!ticket) return;
        const id = setTimeout(() => setTicket(null), RESET_MS);
        return () => clearTimeout(id);
    }, [ticket]);

    async function take(d) {
        setBusy(true);
        setError("");
        try {
            const tk = await kioskApi.take(d.id);
            setTicket(tk);
            load();
            setTimeout(() => window.print(), 300);
        } catch (err) {
            setError(errorText(err, t));
        } finally {
            setBusy(false);
        }
    }

    if (!hasKey) return <div className="kiosk"><KeySetup onDone={() => setHasKey(true)} /></div>;

    return (
        <div className="kiosk">
            <header className="kiosk-head">
                <div className="kiosk-brand">{t("app.name")}</div>
                <LanguageSwitcher />
            </header>

            {ticket ? (
                <div className="kiosk-done">
                    <div className="q-print-area"><TicketSlip ticket={ticket} /></div>
                    <p className="kiosk-take">{t("queue.kioskTake")}</p>
                    <button className="btn btn-primary q-btn-auto kiosk-btn" onClick={() => setTicket(null)}>{t("queue.done")}</button>
                </div>
            ) : (
                <>
                    <h1 className="kiosk-title">{t("queue.kioskTitle")}</h1>
                    {error && <div className="alert-error">{error}</div>}
                    <div className="kiosk-grid">
                        {doctors.map((d) => (
                            <button key={d.id} className="kiosk-doc" disabled={!d.accepting || busy} onClick={() => take(d)}>
                                <span className="kiosk-doc-spec">{d.specialty || t("queue.doctor")}</span>
                                <span className="kiosk-doc-name">{d.name}</span>
                                <span className="kiosk-doc-meta">
                                    {d.room ? `${t("queue.room")} ${d.room} · ` : ""}
                                    {d.accepting
                                        ? `${t("queue.waiting")}: ${d.waiting} · ~${hhmm(d.next_eta)}`
                                        : t("queue.closed")}
                                </span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
