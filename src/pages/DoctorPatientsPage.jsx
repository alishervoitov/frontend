import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fmtDate, fmtTime } from "../api/dates";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import EmergencyAccessModal from "../components/EmergencyAccessModal";

function LockIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
    );
}

export function AccessBadge({ row, t }) {
    if (!row.has_access) return <span className="cs-via cs-via-none">{t("consent.via.none")}</span>;
    const until = row.access_until
        ? (row.access_via === "emergency" ? fmtTime(row.access_until) : fmtDate(row.access_until, { year: false, short: true }))
        : null;
    return (
        <span className={`cs-via cs-via-${row.access_via}`}>
            {t(`consent.via.${row.access_via}`)}{until ? ` · ${t("consent.untilShort", { v: until })}` : ""}
        </span>
    );
}

export default function DoctorPatientsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isDoctor = user?.role === "doctor";
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [emFor, setEmFor] = useState(null);

    useEffect(() => {
        setLoading(true);
        client
            .get("/records/patients/", { params: search ? { search } : {} })
            .then((res) => setPatients(res.data))
            .catch(() => setError(t("patients.loadError")))
            .finally(() => setLoading(false));
    }, [search]);

    // Admin javobida has_access yo'q - unga hamma ochiq
    const consentMode = isDoctor && patients.some((p) => p.has_access !== undefined);

    return (
        <div className="page">
            <div className="page-head">
                <h1>{t("patients.title")}</h1>
            </div>
            {isDoctor && <p className="cs-hint">{t("consent.doctorHint")}</p>}

            <input
                className="search-input"
                placeholder={t("patients.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {error && <div className="alert-error">{error}</div>}

            <div className="table-card">
                {loading ? (
                    <div className="empty-state">{t("me.loading")}</div>
                ) : patients.length === 0 ? (
                    <div className="empty-state">{isDoctor && !search ? t("consent.noPatients") : t("patients.notFound")}</div>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>{t("patients.fullName")}</th>
                            <th>{t("patients.username")}</th>
                            {consentMode ? <th>{t("consent.accessCol")}</th> : <th>{t("patients.gender")}</th>}
                            {consentMode ? <th></th> : <th>{t("patients.bloodType")}</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {patients.map((p) => {
                            const locked = p.has_access === false;
                            const name = p.full_name || t("patients.noName");
                            return (
                                <tr key={p.id}>
                                    <td>
                                        {locked
                                            ? <span className="cs-lock" title={t("consent.lockedTitle")}><LockIcon />{name}</span>
                                            : <Link to={`/patients/${p.id}`}>{name}</Link>}
                                    </td>
                                    <td className="cell-muted">{p.username}</td>
                                    {consentMode ? (
                                        <>
                                            <td><AccessBadge row={p} t={t} /></td>
                                            <td style={{ textAlign: "right" }}>
                                                {locked && (
                                                    <button type="button" className="cs-em-btn" onClick={() => setEmFor({ id: p.id, name })}>
                                                        {t("consent.em.open")}
                                                    </button>
                                                )}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="cell-muted">{p.gender || "—"}</td>
                                            <td className="cell-muted">{p.blood_type || "—"}</td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>

            {emFor && (
                <EmergencyAccessModal
                    patientId={emFor.id}
                    patientName={emFor.name}
                    onClose={() => setEmFor(null)}
                    onOpened={() => navigate(`/patients/${emFor.id}`)}
                />
            )}
        </div>
    );
}
