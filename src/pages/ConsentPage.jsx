import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { queueApi } from "../api/queue";
import { specLabel } from "../api/specialty";
import { fmtDate, fmtDateTime, fmtTime } from "../api/dates";

const DURATIONS = ["1", "7", "30", "none"];

function DoctorLine({ t, d }) {
    return (
        <div className="cs-doc">
            <span className="cs-avatar" aria-hidden="true">{(d.name || "?").trim().charAt(0).toUpperCase()}</span>
            <div className="cs-doc-text">
                <b>{d.name}</b>
                <span>{specLabel(t, d.specialty)}</span>
            </div>
        </div>
    );
}

// Bemor: kartasini qaysi shifokor ko'ra olishini o'zi boshqaradi
export default function ConsentPage() {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [doctor, setDoctor] = useState("");
    const [days, setDays] = useState("30");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);

    const load = () => client.get("/records/consent/me/").then((r) => setData(r.data)).catch(() => setError(true));

    useEffect(() => {
        load();
        queueApi.doctors().then(setDoctors).catch(() => setDoctors([]));
    }, []);

    async function grant(e) {
        e.preventDefault();
        if (!doctor) return;
        setBusy(true);
        setMsg(null);
        try {
            await client.post("/records/consent/me/", { doctor: Number(doctor), days: days === "none" ? null : Number(days) });
            const name = doctors.find((d) => String(d.id) === doctor)?.name;
            setMsg({ ok: true, text: t("consent.granted", { name }) });
            setDoctor("");
            await load();
        } catch (err) {
            setMsg({ ok: false, text: err?.response?.data?.detail || t("consent.error") });
        } finally {
            setBusy(false);
        }
    }

    async function revoke(g) {
        if (!window.confirm(t("consent.revokeConfirm", { name: g.doctor.name }))) return;
        await client.post(`/records/consent/me/${g.id}/revoke/`).catch(() => {});
        load();
    }

    const activeEm = (data?.emergencies || []).filter((e) => e.active);
    const pastEm = (data?.emergencies || []).filter((e) => !e.active);
    const granted = new Set((data?.grants || []).map((g) => g.doctor.id));

    return (
        <div className="page cs-page">
            <div className="page-head"><h1>{t("consent.title")}</h1></div>
            <p className="access-lead">{t("consent.lead")}</p>

            {activeEm.map((e) => (
                <div key={e.id} className="cs-em-banner" role="alert">
                    <span className="cs-siren" aria-hidden="true">!</span>
                    <div>
                        <b>{t("consent.emActive", { name: e.doctor.name, time: fmtTime(e.expires_at) })}</b>
                        <div className="cs-em-reason">«{e.reason}»</div>
                    </div>
                </div>
            ))}

            {error ? (
                <div className="table-card"><div className="empty-state">{t("access.loadError")}</div></div>
            ) : !data ? (
                <div className="table-card"><div className="empty-state">{t("me.loading")}</div></div>
            ) : (
                <div className="cs-grid">
                    <form className="cs-card cs-grant" onSubmit={grant}>
                        <h2>{t("consent.grantTitle")}</h2>
                        <div className="field">
                            <label htmlFor="cs-doctor">{t("consent.doctor")}</label>
                            <select id="cs-doctor" value={doctor} onChange={(e) => setDoctor(e.target.value)}>
                                <option value="">{t("consent.chooseDoctor")}</option>
                                {doctors.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} · {specLabel(t, d.specialty)}{granted.has(d.id) ? ` ✓` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <span className="cs-label">{t("consent.duration")}</span>
                            <div className="cs-chips" role="radiogroup" aria-label={t("consent.duration")}>
                                {DURATIONS.map((d) => (
                                    <button key={d} type="button" role="radio" aria-checked={days === d}
                                            className={`cs-chip ${days === d ? "active" : ""}`} onClick={() => setDays(d)}>
                                        {t(`consent.dur.${d}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={busy || !doctor}>
                            {busy ? t("me.loading") : t("consent.grantBtn")}
                        </button>
                        {msg && <div className={msg.ok ? "cs-ok" : "alert-error"}>{msg.text}</div>}
                    </form>

                    <section className="cs-card">
                        <h2>{t("consent.whoTitle")} <span className="cs-count-pill">{data.grants.length}</span></h2>
                        {data.grants.length === 0 ? (
                            <div className="cs-empty">{t("consent.noGrants")}</div>
                        ) : (
                            <ul className="cs-list">
                                {data.grants.map((g) => (
                                    <li key={g.id}>
                                        <DoctorLine t={t} d={g.doctor} />
                                        <div className="cs-meta">
                                            <span className={`cs-until ${g.expires_at ? "" : "forever"}`}>
                                                {g.expires_at ? t("consent.until", { date: fmtDate(g.expires_at) }) : t("consent.forever")}
                                            </span>
                                            {g.note && <span className="cs-note">{t("consent.migrated")}</span>}
                                        </div>
                                        <button type="button" className="cs-revoke" onClick={() => revoke(g)}>{t("consent.revoke")}</button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {data.visits_today.length > 0 && (
                            <>
                                <h3 className="cs-sub">{t("consent.visitsTitle")}</h3>
                                <ul className="cs-list">
                                    {data.visits_today.map((d) => (
                                        <li key={d.id}>
                                            <DoctorLine t={t} d={d} />
                                            <div className="cs-meta"><span className="cs-until visit">{t("consent.visitUntil")}</span></div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </section>
                </div>
            )}

            {data && (
                <section className="cs-card cs-history">
                    <h2>{t("consent.emTitle")}</h2>
                    {data.emergencies.length === 0 ? (
                        <div className="cs-empty">{t("consent.noEm")}</div>
                    ) : (
                        <ul className="cs-em-list">
                            {[...activeEm, ...pastEm].map((e) => (
                                <li key={e.id} className={e.active ? "active" : ""}>
                                    <div className="cs-em-top">
                                        <b>{e.doctor.name}</b>
                                        <span>{fmtDateTime(e.created_at)}</span>
                                    </div>
                                    <div className="cs-em-reason">«{e.reason}»</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <p className="q-note access-foot">{t("consent.note")}</p>
        </div>
    );
}
