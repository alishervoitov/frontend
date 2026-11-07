import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { queueApi } from "../api/queue";
import { fmtDate, fmtDateTime } from "../api/dates";
import { PatientPhoto, PhotoEditor } from "./PatientPhoto";
import TempPasswordDialog from "./TempPasswordDialog";

const EMPTY = { last_name: "", first_name: "", date_of_birth: "", phone: "", gender: "" };

function PatientRow({ p, onPick, t }) {
    return (
        <button type="button" className="pp-row" onClick={() => onPick(p)}>
            <span className="pp-avatar" aria-hidden="true">{(p.full_name || "?").charAt(0).toUpperCase()}</span>
            <span className="pp-row-text">
                <b>{p.full_name}</b>
                <small>
                    {p.date_of_birth ? fmtDate(p.date_of_birth) : t("pp.noDob")}
                    {p.phone ? ` · ${p.phone}` : ""}
                </small>
            </span>
        </button>
    );
}

// Registratura: kelgan odamni bemor kartasi bilan aniqlash (qidirish yoki yangi karta ochish)
export default function PatientPicker({ value, onChange, autoFocus }) {
    const { t } = useTranslation();
    const [q, setQ] = useState("");
    const [dob, setDob] = useState("");
    const [found, setFound] = useState(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [dupes, setDupes] = useState(null);
    const [busy, setBusy] = useState(false);
    const [photoEdit, setPhotoEdit] = useState(false);
    const [pwDialog, setPwDialog] = useState(false);

    useEffect(() => {
        const query = q.trim();
        if (query.length < 2 && !dob) { setFound(null); return undefined; }
        const id = setTimeout(() => {
            queueApi.registryPatients(query, dob).then(setFound).catch(() => setFound([]));
        }, 300);
        return () => clearTimeout(id);
    }, [q, dob]);

    function pick(p) {
        onChange(p);
        setQ(""); setDob(""); setFound(null); setCreating(false); setForm(EMPTY); setDupes(null); setErrors({});
    }

    function startCreate() {
        // Qidiruvga yozilgan "Familiya Ism"ni formaga ko'chiramiz
        const [last = "", ...rest] = q.trim().split(/\s+/);
        setForm({ ...EMPTY, last_name: /\d/.test(last) ? "" : last, first_name: rest.join(" "), date_of_birth: dob,
                  phone: /\d{4,}/.test(q) ? q.trim() : "" });
        setErrors({}); setDupes(null); setCreating(true);
    }

    async function create(confirm = false) {
        setBusy(true); setErrors({});
        try {
            pick(await queueApi.registryCreatePatient({ ...form, confirm }));
        } catch (err) {
            const d = err?.response?.data || {};
            if (d.code === "possible_duplicate") setDupes(d.matches || []);
            else if (typeof d === "object" && !d.detail) setErrors(d);
            else setErrors({ detail: d.detail || t("pp.error") });
        } finally {
            setBusy(false);
        }
    }

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const err = (k) => errors[k] && <div className="pp-err">{[].concat(errors[k]).join(" ")}</div>;
    const onEnter = (e) => { if (e.key === "Enter") { e.preventDefault(); create(); } };

    if (value) {
        return (
            <div className="pp-chosen">
                {/* Registrator yuzni rasm bilan solishtiradi; rasm bo'lmasa shu yerda oladi */}
                <PatientPhoto patientId={value.id} version={value.photo_updated_at ?? null} className="pph-md" />
                <span className="pp-row-text">
                    <b>{value.full_name}</b>
                    <small>{value.date_of_birth ? fmtDate(value.date_of_birth) : t("pp.noDob")}{value.phone ? ` · ${value.phone}` : ""}</small>
                    <button type="button" className="pp-photo-btn" onClick={() => setPhotoEdit(true)}>
                        {value.photo_updated_at ? t("photo.change") : `+ ${t("photo.add")}`}
                    </button>
                    {/* Ilovaga kirish: registraturada ochilgan bemorda parol yo'q, unutgan bemorga yangisi */}
                    <span className="pp-login">
                        <span className={`pp-login-state ${value.has_login ? "is-ok" : value.temp_password_expires ? "is-temp" : ""}`}>
                            {value.has_login
                                ? t("tp.stateActive")
                                : value.temp_password_expires
                                    ? t("tp.stateTemp", { date: fmtDateTime(value.temp_password_expires) })
                                    : t("tp.stateNone")}
                        </span>
                        <button type="button" className="pp-photo-btn" onClick={() => setPwDialog(true)}>
                            {value.has_login ? t("tp.btnReset") : value.temp_password_expires ? t("tp.btnReissue") : t("tp.btnIssue")}
                        </button>
                    </span>
                </span>
                <button type="button" className="pp-change" onClick={() => onChange(null)}>{t("pp.change")}</button>
                {pwDialog && (
                    <TempPasswordDialog patient={value} onClose={() => setPwDialog(false)}
                                        onIssued={(r) => onChange({ ...value, has_login: false, temp_password_expires: r.expires_at })} />
                )}
                {photoEdit && (
                    <PhotoEditor patientId={value.id} onClose={() => setPhotoEdit(false)}
                                 onSaved={(v) => { setPhotoEdit(false); onChange({ ...value, photo_updated_at: v }); }} />
                )}
            </div>
        );
    }

    if (creating) {
        const ok = form.last_name.trim() && form.first_name.trim() && form.date_of_birth;
        return (
            <div className="pp-new">
                <div className="pp-new-title">{t("pp.newTitle")}</div>
                <div className="pp-grid">
                    <label>{t("pp.lastName")}<input value={form.last_name} onChange={set("last_name")} onKeyDown={onEnter} maxLength={150} autoFocus />{err("last_name")}</label>
                    <label>{t("pp.firstName")}<input value={form.first_name} onChange={set("first_name")} onKeyDown={onEnter} maxLength={150} />{err("first_name")}</label>
                    <label>{t("pp.dob")}<input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} onKeyDown={onEnter} />{err("date_of_birth")}</label>
                    <label>{t("pp.gender")}
                        <select value={form.gender} onChange={set("gender")}>
                            <option value="">—</option>
                            <option value="M">{t("pp.male")}</option>
                            <option value="F">{t("pp.female")}</option>
                        </select>
                    </label>
                    <label className="pp-wide">{t("pp.phone")}<input type="tel" value={form.phone} onChange={set("phone")} onKeyDown={onEnter} placeholder="+998 90 123 45 67" maxLength={20} />{err("phone")}</label>
                </div>
                {errors.detail && <div className="pp-err">{errors.detail}</div>}
                {dupes ? (
                    <div className="pp-dupes">
                        <div className="pp-dupes-title">{t("pp.dupTitle")}</div>
                        {dupes.map((p) => <PatientRow key={p.id} p={p} onPick={pick} t={t} />)}
                        <button type="button" className="pp-link" disabled={busy} onClick={() => create(true)}>{t("pp.dupCreate")}</button>
                    </div>
                ) : (
                    <div className="pp-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setCreating(false)}>{t("consent.cancel")}</button>
                        <button type="button" className="btn btn-primary" disabled={busy || !ok} onClick={() => create()}>{t("pp.create")}</button>
                    </div>
                )}
                <p className="pp-hint">{t("pp.newHint")}</p>
            </div>
        );
    }

    return (
        <div className="pp">
            <div className="pp-search">
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("pp.search")}
                       aria-label={t("pp.search")} autoFocus={autoFocus} />
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} aria-label={t("pp.dob")} title={t("pp.dob")} />
            </div>
            {found !== null && (
                <div className="pp-results">
                    {found.length === 0
                        ? <div className="pp-none">{t("pp.notFound")}</div>
                        : found.map((p) => <PatientRow key={p.id} p={p} onPick={pick} t={t} />)}
                </div>
            )}
            <button type="button" className="pp-link" onClick={startCreate}>+ {t("pp.newBtn")}</button>
        </div>
    );
}
