import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

export default function DoctorPatientsPage() {
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        client
            .get("/records/patients/", { params: search ? { search } : {} })
            .then((res) => setPatients(res.data))
            .catch(() => setError("Bemorlar ro'yxatini yuklab bo'lmadi."))
            .finally(() => setLoading(false));
    }, [search]);

    return (
        <div className="page">
            <div className="page-head">
                <h1>Bemorlar</h1>
            </div>

            <input
                className="search-input"
                placeholder="Ism yoki familiya bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {error && <div className="alert-error">{error}</div>}

            <div className="table-card">
                {loading ? (
                    <div className="empty-state">Yuklanmoqda...</div>
                ) : patients.length === 0 ? (
                    <div className="empty-state">Bemorlar topilmadi.</div>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>F.I.Sh.</th>
                            <th>Foydalanuvchi nomi</th>
                            <th>Jinsi</th>
                            <th>Qon guruhi</th>
                        </tr>
                        </thead>
                        <tbody>
                        {patients.map((p) => (
                            <tr key={p.id}>
                                <td><Link to={`/patients/${p.id}`}>{p.full_name || "(ism kiritilmagan)"}</Link></td>
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