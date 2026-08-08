import { useState } from "react";
import client from "../api/client";

export default function AvatarUpload({ user, onUpdated }) {
    const [preview, setPreview] = useState(user?.avatar_url || null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        upload(file);
    }

    async function upload(file) {
        setError("");
        setUploading(true);
        const formData = new FormData();
        formData.append("avatar", file);
        try {
            const res = await client.post("/auth/me/avatar/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            onUpdated(res.data);
        } catch {
            setError("Rasmni yuklab bo'lmadi (5MB dan kichik rasm tanlang).");
        } finally {
            setUploading(false);
        }
    }

    const initial = (user?.first_name || user?.username || "?")[0].toUpperCase();

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div className="avatar-circle avatar-lg">
                {preview ? <img src={preview} alt="avatar" /> : <span>{initial}</span>}
            </div>
            <div>
                <label className="btn btn-secondary" style={{ width: "auto", cursor: "pointer", display: "inline-flex" }}>
                    {uploading ? "Yuklanmoqda..." : "Rasm tanlash"}
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
                {error && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>{error}</div>}
            </div>
        </div>
    );
}