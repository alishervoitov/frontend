import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import client from "../api/client";

export default function DoctorPatientsPage() {
    const { t } = useTranslation();
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        client
            .get("/records/patients/", { params: search ? { search } : {} })
            .then((res) => setPatients(res.data))
            .catch(() => setError(t("patients.loadError")))
            .finally(() => setLoading(false));
    }, [search]);

    return (
        <div className="page">
            <div className="page-head">
                <h1>{t("patients.title")}</h1>
            </div>

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
                    <div className="empty-state">{t("patients.notFound")}</div>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>{t("patients.fullName")}</th>
                            <th>{t("patients.username")}</th>
                            <th>{t("patients.gender")}</th>
                            <th>{t("patients.bloodType")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {patients.map((p) => (
                            <tr key={p.id}>
                                <td><Link to={`/patients/${p.id}`}>{p.full_name || t("patients.noName")}</Link></td>
                                <td className="cell-muted">{p.username}</td>
                                <td className="cell-muted">{p.gender || "—"}</td>
                                <td className="cell-muted">{p.blood_type || "—"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}