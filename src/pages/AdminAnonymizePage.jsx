import { useState } from "react";
import client from "../api/client";

const QI_OPTIONS = [
    { value: "age_group", label: "Yosh oralig'i" },
    { value: "gender", label: "Jinsi" },
    { value: "blood_type", label: "Qon guruhi" },
];

export default function AdminAnonymizePage() {
    const [k, setK] = useState(5);
    const [selectedQi, setSelectedQi] = useState(["age_group", "gender", "blood_type"]);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function toggleQi(value) {
        setSelectedQi((prev) =>
            prev.includes(value) ? prev.filter((q) => q !== value) : [...prev, value]
        );
    }

    async function runReport() {
        setError("");
        if (selectedQi.length === 0) {
            setError("Kamida bitta bilvosita identifikator tanlang.");
            return;
        }
        setLoading(true);
        try {
            const res = await client.get("/records/export-anonymized/", {
                params: { k, qi: selectedQi.join(",") },
            });
            setReport(res.data);
        } catch {
            setError("Hisobotni yuklab bo'lmadi.");
        } finally {
            setLoading(false);
        }
    }

    async function downloadCsv() {
        try {
            const res = await client.get("/records/export-anonymized/", {
                params: { k, qi: selectedQi.join(","), format: "csv" },
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `anon_dataset_k${k}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            setError("CSV faylni yuklab bo'lmadi.");
        }
    }

    return (
        <div className="page" style={{ maxWidth: 900 }}>
            <div className="page-head">
                <h1>Anonimlashtirish moduli</h1>
            </div>
            <p className="patient-meta" style={{ marginBottom: 20 }}>
                Bemorlar ma'lumotlarini k-anonimlik modeli asosida tadqiqot/statistika uchun anonimlashtiradi.
                To'g'ridan-to'g'ri identifikatorlar (F.I.Sh., ID) har doim olib tashlanadi.
            </p>

            <div className="card">
                <div className="field" style={{ maxWidth: 160 }}>
                    <label>k qiymati (minimal guruh hajmi)</label>
                    <input type="number" min="2" max="50" value={k} onChange={(e) => setK(Number(e.target.value))} />
                </div>

                <div className="field">
                    <label>Bilvosita identifikatorlar (quasi-identifiers)</label>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {QI_OPTIONS.map((opt) => (
                            <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400, fontSize: "0.88rem" }}>
                                <input
                                    type="checkbox"
                                    style={{ width: "auto" }}
                                    checked={selectedQi.includes(opt.value)}
                                    onChange={() => toggleQi(opt.value)}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                {error && <div className="alert-error">{error}</div>}

                <button className="btn btn-primary" style={{ width: "auto" }} onClick={runReport} disabled={loading}>
                    {loading ? "Hisoblanmoqda..." : "Hisoblash"}
                </button>
            </div>

            {report && (
                <>
                    <div style={{ display: "flex", gap: 14, margin: "20px 0" }}>
                        <StatCard label="Jami bemorlar" value={report.jami_bemorlar} />
                        <StatCard label="Chiqarilgan" value={report.chiqarilgan_yozuvlar} tone="success" />
                        <StatCard label="Chiqarib tashlangan" value={report.chiqarib_tashlangan_yozuvlar} tone="danger" />
                        <StatCard label="Axborot yo'qotilishi" value={`${report.axborot_yoqotilishi_foizi}%`} tone="accent" />
                    </div>

                    <button className="btn btn-secondary" style={{ width: "auto", marginBottom: 20 }} onClick={downloadCsv}>
                        ⬇ CSV yuklab olish
                    </button>

                    <h2 style={{ marginBottom: 12 }}>Guruhlar tafsiloti</h2>
                    <div className="table-card">
                        <table>
                            <thead>
                            <tr>
                                <th>Yosh oralig'i</th>
                                <th>Jinsi</th>
                                <th>Qon guruhi</th>
                                <th>Hajmi</th>
                                <th>l-diversity</th>
                                <th>Holati</th>
                            </tr>
                            </thead>
                            <tbody>
                            {report.guruhlar.map((g, i) => (
                                <tr key={i}>
                                    <td className="cell-muted">{g.guruh.age_group ?? "—"}</td>
                                    <td className="cell-muted">{g.guruh.gender ?? "—"}</td>
                                    <td className="cell-muted">{g.guruh.blood_type ?? "—"}</td>
                                    <td>{g.hajmi}</td>
                                    <td className="cell-muted">{g.l_diversity}</td>
                                    <td>
                      <span className={`badge ${g.chiqarildi ? "badge-patient" : "badge-admin"}`}>
                        {g.chiqarildi ? "Chiqarildi" : "Yashirildi"}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ label, value, tone }) {
    const colors = {
        success: "var(--success)", danger: "var(--danger)", accent: "var(--accent)",
    };
    return (
        <div className="card" style={{ flex: 1, marginBottom: 0, padding: "14px 18px" }}>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: ".03em" }}>
                {label}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: tone ? colors[tone] : "var(--ink)" }}>
                {value}
            </div>
        </div>
    );
}