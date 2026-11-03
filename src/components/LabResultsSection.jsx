import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { labApi, refLabel } from "../api/labs";

const ARROW = { low: "↓", high: "↑", abnormal: "!" };

export function LabResultCard({ result, open, onDelete }) {
    const { t } = useTranslation();
    const date = new Date(result.collected_at).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    return (
        <details className="lab-card" open={open}>
            <summary>
                <div className="lab-card-head">
                    <div>
                        <div className="lab-card-title">{result.title}</div>
                        <div className="lab-card-meta">
                            {date} · {t("labs.enteredBy")}: {result.created_by_name}
                            {onDelete && ` · ${result.patient_name}`}
                        </div>
                    </div>
                    <span className="lab-badges">
                    {result.valid_until && (
                        result.is_expired
                            ? <span className="lab-badge lab-badge-expired">{t("labs.expired")}</span>
                            : <span className="lab-badge lab-badge-valid">{t("labs.validUntilShort", { date: result.valid_until })}</span>
                    )}
                    {result.abnormal_count > 0 ? (
                        <span className="lab-badge lab-badge-warn">{t("labs.abnormalCount", { count: result.abnormal_count })}</span>
                    ) : (
                        <span className="lab-badge lab-badge-ok">{t("labs.allNormal")}</span>
                    )}
                    </span>
                </div>
            </summary>
            <table className="lab-table">
                <thead>
                <tr><th>{t("labs.param")}</th><th>{t("labs.result")}</th><th>{t("labs.unit")}</th><th>{t("labs.reference")}</th></tr>
                </thead>
                <tbody>
                {result.values.map((v) => (
                    <tr key={v.id} className={v.flag && v.flag !== "normal" ? `lab-row-${v.flag}` : ""}>
                        <td>{v.name}</td>
                        <td className="lab-value">{v.value} {ARROW[v.flag] && <span className="lab-arrow">{ARROW[v.flag]}</span>}</td>
                        <td className="cell-muted">{v.unit}</td>
                        <td className="cell-muted">{refLabel(v)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            {result.notes && <p className="lab-notes"><b>{t("labs.notes")}:</b> {result.notes}</p>}
            {(result.attachments.length > 0 || onDelete) && (
                <div className="lab-foot">
                    {result.attachments.map((a) => (
                        <button key={a.id} type="button" className="q-act" onClick={() => labApi.download(a)}>⬇ {a.original_filename}</button>
                    ))}
                    {onDelete && (
                        <button type="button" className="q-act q-act-danger" onClick={() => onDelete(result)}>{t("labs.delete")}</button>
                    )}
                </div>
            )}
        </details>
    );
}

// Bemor kabineti (patientId yo'q) va shifokor bemor sahifasi (patientId bor) uchun
export default function LabResultsSection({ patientId }) {
    const { t } = useTranslation();
    const [results, setResults] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        labApi.results(patientId).then(setResults).catch(() => setError(true));
    }, [patientId]);

    return (
        <section className="lab-section">
            <h2 className="lab-h2">{t("labs.sectionTitle")}</h2>
            {error ? (
                <div className="table-card"><div className="empty-state">{t("labs.loadError")}</div></div>
            ) : results === null ? (
                <div className="table-card"><div className="empty-state">{t("me.loading")}</div></div>
            ) : results.length === 0 ? (
                <div className="table-card"><div className="empty-state">{t("labs.noResults")}</div></div>
            ) : (
                results.map((r, i) => <LabResultCard key={r.id} result={r} open={i === 0} />)
            )}
        </section>
    );
}
