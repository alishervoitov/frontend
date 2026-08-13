import { useEffect, useState } from "react";
import client, { downloadAttachment } from "../api/client.js";

export default function RecordAttachments({ recordId, isDoctor }) {
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    function load() {
        client.get(`/records/medical-records/${recordId}/attachments/`)
            .then((res) => setAttachments(res.data))
            .finally(() => setLoading(false));
    }

    useEffect(load, [recordId]);

    async function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        setError("");
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            await client.post(`/records/medical-records/${recordId}/attachments/`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            load();
        } catch {
            setError("Fayl yuklab bo'lmadi (10MB dan kichik JPEG/PNG/PDF tanlang).");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    async function handleDelete(attachmentId) {
        if (!confirm("Faylni o'chirishni tasdiqlaysizmi?")) return;
        try {
            await client.delete(`/records/attachments/${attachmentId}/`);
            load();
        } catch {
            setError("Faylni o'chirib bo'lmadi.");
        }
    }

    if (loading) return null;

    return (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".03em" }}>
                Biriktirilgan fayllar {attachments.length > 0 && `(${attachments.length})`}
            </div>

            {attachments.length === 0 && !isDoctor && (
                <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>Fayllar biriktirilmagan.</div>
            )}

            {attachments.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 6 }}>
                    <button
                        onClick={() => downloadAttachment(a.id, a.original_filename)}
                        style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: 0, textDecoration: "underline", fontSize: 13 }}
                    >
                        📎 {a.original_filename}
                    </button>
                    <span style={{ color: "var(--ink-faint)", fontSize: 11 }}>
            ({(a.file_size / 1024).toFixed(0)} KB)
          </span>
                    {isDoctor && (
                        <button
                            onClick={() => handleDelete(a.id)}
                            style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", padding: 0, fontSize: 11 }}
                        >
                            o'chirish
                        </button>
                    )}
                </div>
            ))}

            {isDoctor && (
                <label className="btn btn-secondary btn-sm" style={{ width: "auto", cursor: "pointer", display: "inline-flex", marginTop: 6 }}>
                    {uploading ? "Yuklanmoqda..." : "+ Fayl biriktirish"}
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
            )}
            {error && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>
    );
}