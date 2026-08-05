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
        <div style={{ padding: "32px 40px" }}>
            <h1>Bemorlar</h1>

            <input
                placeholder="Ism yoki familiya bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 320, marginBottom: 20 }}
            />

            {error && <div className="alert-error">{error}</div>}
            {loading ? (
                <p>Yuklanmoqda...</p>
            ) : patients.length === 0 ? (
                <p>Bemorlar topilmadi.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                    <tr style={{ textAlign: "left", borderBottom: "2px solid #DCE6E2" }}>
                        <th style={{ padding: 10 }}>F.I.Sh.</th>
                        <th style={{ padding: 10 }}>Foydalanuvchi nomi</th>
                        <th style={{ padding: 10 }}>Jinsi</th>
                        <th style={{ padding: 10 }}>Qon guruhi</th>
                    </tr>
                    </thead>
                    <tbody>
                    {patients.map((p) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #DCE6E2" }}>
                            <td style={{ padding: 10 }}>
                                <Link to={`/patients/${p.id}`}>{p.full_name || "(ism kiritilmagan)"}</Link>
                            </td>
                            <td style={{ padding: 10 }}>{p.username}</td>
                            <td style={{ padding: 10 }}>{p.gender || "—"}</td>
                            <td style={{ padding: 10 }}>{p.blood_type || "—"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}