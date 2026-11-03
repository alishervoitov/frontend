import { useRef, useState } from "react";
import client from "../api/client";

export default function AvatarUpload({ user, onUpdated, shape = "circle", size = "lg" }) {
    const [preview, setPreview] = useState(user?.avatar_url || null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef(null);

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
            setError("Rasmni yuklab bo'lmadi.");
        } finally {
            setUploading(false);
        }
    }

    const initial = (user?.first_name || user?.username || "?")[0].toUpperCase();
    // portrait: hujjat rasmi kabi 3x4 o'lchamdagi to'rtburchak
    const shapeClass = shape === "portrait" ? "avatar-square avatar-portrait" : shape === "square" ? "avatar-square" : "avatar-circle";
    const sizeClass = shape === "portrait" ? "" : size === "fill" ? "avatar-fill" : size === "xl" ? "avatar-xl" : "avatar-lg";

    return (
        <div className="avatar-upload">
            <label className={`${shapeClass} ${sizeClass} avatar-clickable`} title="Rasmni o'zgartirish">
                {preview ? <img src={preview} alt="avatar" /> : <span>{initial}</span>}
                <span className="avatar-overlay">{uploading ? "..." : "✎"}</span>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />
            </label>
            {error && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 6, textAlign: "center" }}>{error}</div>}
        </div>
    );
}