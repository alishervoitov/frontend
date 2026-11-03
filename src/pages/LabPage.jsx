import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { defaultValidUntil, flagOf, labApi, PANEL_CODES, panelRows } from "../api/labs";
import { LabResultCard } from "../components/LabResultsSection";

const ARROW = { low: "↓", high: "↑", abnormal: "!", normal: "✓" };
const MAX_FILE = 10 * 1024 * 1024;

function nowLocal() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

function PatientPicker({ onPick }) {
    const { t } = useTranslation();
    const [q, setQ] = useState("");
    const [rows, setRows] = useState([]);

    useEffect(() => {
        if (q.trim().length < 2) { setRows([]); return; }
        const id = setTimeout(() => labApi.searchPatients(q.trim()).then(setRows).catch(() => setRows([])), 300);
        return () => clearTimeout(id);
    }, [q]);

    return (
        <div className="card lab-step">
            <h2 className="lab-h2">1. {t("labs.choosePatient")}</h2>
            <input className="search-input lab-search" autoFocus placeholder={t("labs.searchPatient")} value={q} onChange={(e) => setQ(e.target.value)} />
            {q.trim().length >= 2 && rows.length === 0 && <div className="q-muted">{t("labs.noPatients")}</div>}
            <div className="lab-patients">
                {rows.map((p) => (
                    <button key={p.id} type="button" className="lab-patient" onClick={() => onPick(p)}>
                        <b>{p.full_name}</b>
                        <span>{p.username}{p.date_of_birth ? ` · ${p.date_of_birth}` : ""}{p.gender ? ` · ${t(`labs.gender.${p.gender}`)}` : ""}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function ResultForm({ patient, onSaved, onChangePatient }) {
    const { t } = useTranslation();
    const [panel, setPanel] = useState("cbc");
    const [title, setTitle] = useState(t("labs.panels.cbc"));
    const [collectedAt, setCollectedAt] = useState(nowLocal());
    const [validUntil, setValidUntil] = useState(() => defaultValidUntil("cbc", nowLocal()));
    const [validTouched, setValidTouched] = useState(false);

    // Laborant muddatni o'zi o'zgartirmagan bo'lsa, tur va sana bo'yicha standart muddat qo'yiladi
    useEffect(() => {
        if (!validTouched) setValidUntil(defaultValidUntil(panel, collectedAt));
    }, [panel, collectedAt, validTouched]);
    const [rows, setRows] = useState(() => panelRows("cbc", patient.gender, t));
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function choosePanel(code) {
        setPanel(code);
        setTitle(code === "custom" ? "" : t(`labs.panels.${code}`));
        const r = panelRows(code, patient.gender, t);
        setRows(r.length ? r : [{ name: "", value: "", unit: "", ref_low: "", ref_high: "", ref_text: "" }]);
    }

    const setRow = (i, k) => (e) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: e.target.value } : r)));
    const addRow = () => setRows([...rows, { name: "", value: "", unit: "", ref_low: "", ref_high: "", ref_text: "" }]);
    const removeRow = (i) => setRows(rows.filter((_, j) => j !== i));

    async function save(e) {
        e.preventDefault();
        setError("");
        const filled = rows.filter((r) => r.name.trim() && String(r.value).trim());
        if (!filled.length) { setError(t("labs.errors.noValues")); return; }
        if (file && file.size > MAX_FILE) { setError(t("labs.errors.fileSize")); return; }
        setSaving(true);
        try {
            const clean = (x) => (String(x).trim() === "" ? null : String(x).trim().replace(",", "."));
            const result = await labApi.create({
                patient: patient.id, panel, title: title.trim() || t(`labs.panels.${panel}`),
                collected_at: new Date(collectedAt).toISOString(), valid_until: validUntil || null, notes,
                values: filled.map((r) => ({
                    name: r.name.trim(), value: String(r.value).trim(), unit: r.unit,
                    ref_low: clean(r.ref_low), ref_high: clean(r.ref_high), ref_text: r.ref_text || "",
                })),
            });
            if (file) {
                try { await labApi.upload(result.id, file); }
                catch (err) { setError(err?.response?.data?.detail || t("labs.errors.upload")); }
            }
            onSaved(result);
        } catch (err) {
            const d = err?.response?.data;
            setError(d?.detail || (d && JSON.stringify(d)) || t("labs.errors.generic"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="card lab-step" onSubmit={save}>
            <div className="lab-patient-chip">
                <div>
                    <div className="q-muted">{t("labs.patient")}</div>
                    <b>{patient.full_name}</b> <span className="q-muted">{patient.username}{patient.date_of_birth ? ` · ${patient.date_of_birth}` : ""}</span>
                </div>
                <button type="button" className="q-act" onClick={onChangePatient}>{t("labs.changePatient")}</button>
            </div>

            <h2 className="lab-h2">2. {t("labs.chooseTest")}</h2>
            <div className="au-tabs lab-panels">
                {PANEL_CODES.map((c) => (
                    <button key={c} type="button" className={`au-tab ${panel === c ? "active" : ""}`} onClick={() => choosePanel(c)}>{t(`labs.panels.${c}`)}</button>
                ))}
            </div>
            <div className="q-form-grid q-form-grid-2">
                <div className="field"><label>{t("labs.title")}</label><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required /></div>
                <div className="field"><label>{t("labs.collectedAt")}</label><input type="datetime-local" value={collectedAt} max={nowLocal()} onChange={(e) => setCollectedAt(e.target.value)} required /></div>
            </div>
            <div className="q-form-grid q-form-grid-2">
                <div className="field">
                    <label>{t("labs.validUntil")}</label>
                    <input type="date" value={validUntil} min={collectedAt.slice(0, 10)} onChange={(e) => { setValidTouched(true); setValidUntil(e.target.value); }} required />
                </div>
                <p className="q-note lab-valid-note">{t("labs.validNote")}</p>
            </div>

            <h2 className="lab-h2">3. {t("labs.enterValues")}</h2>
            <p className="q-note q-note-top">{t("labs.refNote")}</p>
            <div className="lab-grid-wrap">
                <table className="lab-input-table">
                    <thead><tr><th>{t("labs.param")}</th><th>{t("labs.result")}</th><th>{t("labs.unit")}</th><th>{t("labs.reference")}</th><th /><th /></tr></thead>
                    <tbody>
                    {rows.map((r, i) => {
                        const f = flagOf(r);
                        return (
                            <tr key={i} className={f && f !== "normal" ? `lab-row-${f}` : ""}>
                                <td className="lab-c-name"><input value={r.name} onChange={setRow(i, "name")} placeholder={t("labs.param")} /></td>
                                <td className="lab-c-value" data-label={t("labs.result")}>
                                    {r.options ? (
                                        <input list={`opt-${i}`} value={r.value} onChange={setRow(i, "value")} />
                                    ) : (
                                        <input inputMode="decimal" value={r.value} onChange={setRow(i, "value")} />
                                    )}
                                    {r.options && <datalist id={`opt-${i}`}>{r.options.map((o) => <option key={o} value={o} />)}</datalist>}
                                </td>
                                <td className="lab-c-unit" data-label={t("labs.unit")}><input className="lab-unit" value={r.unit} onChange={setRow(i, "unit")} /></td>
                                <td className="lab-c-ref" data-label={t("labs.reference")}>
                                    {r.ref_text !== "" && r.ref_low === "" && r.ref_high === "" ? (
                                        <input value={r.ref_text} onChange={setRow(i, "ref_text")} />
                                    ) : (
                                        <span className="lab-ref">
                                            <input inputMode="decimal" value={r.ref_low} onChange={setRow(i, "ref_low")} />
                                            –
                                            <input inputMode="decimal" value={r.ref_high} onChange={setRow(i, "ref_high")} />
                                        </span>
                                    )}
                                </td>
                                <td className="lab-flag lab-c-flag">{f && <span className={`lab-flag-${f}`}>{ARROW[f]}</span>}</td>
                                <td className="lab-c-remove"><button type="button" className="q-link" onClick={() => removeRow(i)} title={t("labs.removeRow")}>✕</button></td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            <button type="button" className="q-back lab-add" onClick={addRow}>+ {t("labs.addRow")}</button>

            <div className="field"><label>{t("labs.notes")}</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <div className="field">
                <label>{t("labs.file")}</label>
                <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button className="btn btn-primary q-btn-auto" disabled={saving}>{saving ? t("auth.saving") : t("labs.save")}</button>
        </form>
    );
}

export default function LabPage() {
    const { t } = useTranslation();
    const [patient, setPatient] = useState(null);
    const [recent, setRecent] = useState([]);
    const [saved, setSaved] = useState("");

    const load = useCallback(() => labApi.results().then(setRecent).catch(() => {}), []);
    useEffect(() => { load(); }, [load]);

    async function remove(r) {
        if (!window.confirm(t("labs.deleteConfirm", { title: r.title }))) return;
        await labApi.remove(r.id);
        load();
    }

    return (
        <div className="page page-wide">
            <div className="page-head"><h1>{t("labs.pageTitle")}</h1></div>
            {saved && <div className="lab-saved">✓ {saved}</div>}
            {patient ? (
                <ResultForm
                    key={patient.id}
                    patient={patient}
                    onChangePatient={() => setPatient(null)}
                    onSaved={(r) => { setSaved(t("labs.savedFor", { name: r.patient_name })); setPatient(null); load(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                />
            ) : (
                <PatientPicker onPick={(p) => { setSaved(""); setPatient(p); }} />
            )}

            <h2 className="lab-h2 lab-recent-title">{t("labs.recent")}</h2>
            {recent.length === 0 ? (
                <div className="table-card"><div className="empty-state">{t("labs.noRecent")}</div></div>
            ) : (
                recent.map((r) => <LabResultCard key={r.id} result={r} open={false} onDelete={remove} />)
            )}
        </div>
    );
}
