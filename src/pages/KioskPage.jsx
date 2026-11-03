import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { errorText, hhmm, kioskApi, kioskKey } from "../api/queue";
import LanguageSwitcher from "../components/LanguageSwitcher";
import TicketSlip from "../components/TicketSlip";
import SpecialtyPicker from "../components/SpecialtyPicker";
import { specLabel } from "../api/specialty";

const RESET_MS = 20000;

// Onlayn navbat olganlar uchun aylanuvchi QR: muddati tugashidan oldin yangilanadi
function CheckinQr() {
    const { t } = useTranslation();
    const [qr, setQr] = useState(null);
    const [left, setLeft] = useState(0);

    useEffect(() => {
        let timer;
        let alive = true;
        const fetchCode = () => kioskApi.checkinCode()
            .then((d) => {
                if (!alive) return;
                setQr(d);
                setLeft(d.expires_in);
                timer = setTimeout(fetchCode, Math.max(2, d.expires_in - 1) * 1000);
            })
            .catch(() => { if (alive) { setQr(null); timer = setTimeout(fetchCode, 10000); } });
        fetchCode();
        return () => { alive = false; clearTimeout(timer); };
    }, []);

    useEffect(() => {
        const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, []);

    if (!qr) return null;
    return (
        <div className="kiosk-qr">
            <div className="kiosk-qr-code" dangerouslySetInnerHTML={{ __html: qr.svg }} />
            <div className="kiosk-qr-text">
                <h2>{t("queue.kioskQrTitle")}</h2>
                <p>{t("queue.kioskQrHint")}</p>
                <div className="kiosk-qr-timer"><span style={{ width: `${Math.min(100, (left / 45) * 100)}%` }} /></div>
            </div>
        </div>
    );
}
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
    const [spec, setSpec] = useState(null);

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
        const id = setTimeout(() => { setTicket(null); setSpec(null); }, RESET_MS);
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
                    <button className="btn btn-primary q-btn-auto kiosk-btn" onClick={() => { setTicket(null); setSpec(null); }}>{t("queue.done")}</button>
                </div>
            ) : (
                <>
                    {!spec && <CheckinQr />}
                    <h1 className="kiosk-title">{spec ? specLabel(t, spec) : t("queue.kioskChooseSpecialty")}</h1>
                    {error && <div className="alert-error">{error}</div>}
                    {!spec ? (
                        <SpecialtyPicker doctors={doctors} onPick={setSpec} className="kiosk-spec" walkin />
                    ) : (
                    <>
                    <button type="button" className="q-back kiosk-back" onClick={() => setSpec(null)}>← {t("queue.allSpecialties")}</button>
                    <div className="kiosk-grid">
                        {doctors.filter((d) => (d.specialty || "other") === spec).map((d) => (
                            <button key={d.id} className="kiosk-doc" disabled={!d.accepting_walkin || busy} onClick={() => take(d)}>
                                <span className="kiosk-doc-spec">{specLabel(t, d.specialty)}</span>
                                <span className="kiosk-doc-name">{d.name}</span>
                                <span className="kiosk-doc-meta">
                                    {d.room ? `${t("queue.room")} ${d.room} · ` : ""}
                                    {d.accepting_walkin
                                        ? `${t("queue.waiting")}: ${d.waiting} · ~${hhmm(d.next_eta_walkin)}`
                                        : t("queue.closed")}
                                </span>
                            </button>
                        ))}
                    </div>
                    </>
                    )}
                </>
            )}
        </div>
    );
}
