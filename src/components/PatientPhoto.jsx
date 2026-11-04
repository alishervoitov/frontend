import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";

// Rasm himoyalangan manzilda (token bilan) - <img src> to'g'ridan-to'g'ri ocholmaydi,
// shuning uchun blob qilib olinadi. Bir bemor rasmi bir sahifada qayta yuklanmasin.
const cache = new Map();

function loadPhoto(patientId, version) {
    const key = `${patientId}:${version || ""}`;
    if (!cache.has(key)) {
        cache.set(key, client.get(`/records/patients/${patientId}/photo/`, { responseType: "blob" })
            .then((r) => URL.createObjectURL(r.data))
            .catch((err) => { cache.delete(key); throw err; }));
    }
    return cache.get(key);
}

function Silhouette() {
    return (
        <svg viewBox="0 0 60 80" aria-hidden="true" className="pph-silhouette">
            <circle cx="30" cy="30" r="13" /><path d="M6 80c0-16 10.7-26 24-26s24 10 24 26z" />
        </svg>
    );
}

const initialsOf = (name) => (name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

// 3x4 rasm. version = photo_updated_at (null - rasm yo'q, undefined - noma'lum, baribir urinib ko'riladi).
// Rasm yo'q bo'lsa: ism bosh harflari (name berilgan bo'lsa) yoki siluet
export function PatientPhoto({ patientId, version, className = "", alt = "", name }) {
    const [src, setSrc] = useState(null);
    useEffect(() => {
        setSrc(null);
        if (!patientId || version === null) return undefined;
        let alive = true;
        loadPhoto(patientId, version).then((u) => alive && setSrc(u)).catch(() => {});
        return () => { alive = false; };
    }, [patientId, version]);
    return (
        <div className={`pph ${className}`}>
            {src ? <img src={src} alt={alt} draggable={false} />
                : name ? <span className="pph-initials" aria-hidden="true">{initialsOf(name)}</span> : <Silhouette />}
        </div>
    );
}

const FRAME_W = 240;
const FRAME_H = 320;

// Kesish oynasi: rasm 3x4 ramka ichida suriladi va kattalashtiriladi; serverga ulushlar yuboriladi
export function PhotoEditor({ patientId, onClose, onSaved }) {
    const { t } = useTranslation();
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState(null);
    const [nat, setNat] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [off, setOff] = useState({ x: 0, y: 0 });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const drag = useRef(null);
    const input = useRef(null);

    useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
    useEffect(() => {
        const esc = (e) => e.key === "Escape" && !busy && onClose();
        document.addEventListener("keydown", esc);
        return () => document.removeEventListener("keydown", esc);
    }, [busy, onClose]);

    const base = nat ? Math.max(FRAME_W / nat.w, FRAME_H / nat.h) : 1;
    const scale = base * zoom;
    const dw = nat ? nat.w * scale : 0;
    const dh = nat ? nat.h * scale : 0;
    const clamp = (o, z = zoom) => {
        const s = base * z;
        const w = nat.w * s, h = nat.h * s;
        return { x: Math.min(0, Math.max(FRAME_W - w, o.x)), y: Math.min(0, Math.max(FRAME_H - h, o.y)) };
    };

    function pick(e) {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        if (f.size > 10_000_000) { setError(t("photo.tooBig")); return; }
        setError("");
        setFile(f);
        setNat(null);
        setUrl(URL.createObjectURL(f));
    }
    function onLoad(e) {
        const w = e.currentTarget.naturalWidth, h = e.currentTarget.naturalHeight;
        const s = Math.max(FRAME_W / w, FRAME_H / h);
        setNat({ w, h });
        setZoom(1);
        setOff({ x: (FRAME_W - w * s) / 2, y: (FRAME_H - h * s) / 2 });
    }
    function setZoomKeepCenter(z) {
        if (!nat) return;
        const cx = (FRAME_W / 2 - off.x) / scale, cy = (FRAME_H / 2 - off.y) / scale;   // ramka markazi rasmda
        const s = base * z;
        setZoom(z);
        setOff(clamp({ x: FRAME_W / 2 - cx * s, y: FRAME_H / 2 - cy * s }, z));
    }
    function down(e) {
        if (!nat) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { px: e.clientX, py: e.clientY, ox: off.x, oy: off.y };
    }
    function move(e) {
        const d = drag.current;
        if (!d) return;
        setOff(clamp({ x: d.ox + e.clientX - d.px, y: d.oy + e.clientY - d.py }));
    }
    const up = () => { drag.current = null; };
    function wheel(e) {
        if (!nat) return;
        setZoomKeepCenter(Math.min(4, Math.max(1, zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))));
    }

    async function save() {
        if (!file || !nat) return;
        setBusy(true);
        setError("");
        const fd = new FormData();
        fd.append("photo", file);
        fd.append("crop_x", String(-off.x / dw));
        fd.append("crop_y", String(-off.y / dh));
        fd.append("crop_w", String(FRAME_W / dw));
        fd.append("crop_h", String(FRAME_H / dh));
        try {
            const r = await client.post(`/records/patients/${patientId}/photo/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            onSaved(r.data.photo_updated_at);
        } catch (err) {
            setError(err?.response?.status === 429 ? t("photo.throttled") : err?.response?.data?.detail || t("photo.error"));
            setBusy(false);
        }
    }

    return (
        <div className="cs-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
            <div className="cs-modal pph-modal" role="dialog" aria-modal="true" aria-labelledby="pph-title">
                <h2 id="pph-title">{t("photo.editTitle")}</h2>
                <p className="pph-hint">{url ? t("photo.dragHint") : t("photo.rules")}</p>
                <div className="pph-stage">
                    <div className={`pph-frame ${nat ? "has-img" : ""}`} style={{ width: FRAME_W, height: FRAME_H }}
                         onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={wheel}
                         onClick={() => !url && input.current?.click()}>
                        {url ? (
                            <img src={url} alt="" draggable={false} onLoad={onLoad}
                                 style={nat ? { width: dw, height: dh, transform: `translate(${off.x}px, ${off.y}px)` } : { opacity: 0 }} />
                        ) : (
                            <div className="pph-empty"><Silhouette /><span>{t("photo.choose")}</span></div>
                        )}
                        {nat && (
                            // Hujjat rasmi yo'riqnomasi: yuz ovali, tashqarisi xiralashtirilgan
                            <svg className="pph-guide" viewBox="0 0 240 320" aria-hidden="true">
                                <defs><mask id="pph-oval"><rect width="240" height="320" fill="#fff" /><ellipse cx="120" cy="138" rx="74" ry="96" fill="#000" /></mask></defs>
                                <rect width="240" height="320" fill="rgba(16,38,43,0.38)" mask="url(#pph-oval)" />
                                <ellipse cx="120" cy="138" rx="74" ry="96" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="5 4" />
                            </svg>
                        )}
                    </div>
                </div>
                {nat && (
                    <label className="pph-zoom">
                        <span aria-hidden="true">−</span>
                        <input type="range" min="1" max="4" step="0.01" value={zoom} aria-label={t("photo.zoom")}
                               onChange={(e) => setZoomKeepCenter(Number(e.target.value))} />
                        <span aria-hidden="true">+</span>
                    </label>
                )}
                <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
                {error && <div className="alert-error">{error}</div>}
                <div className="cs-modal-actions pph-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => input.current?.click()} disabled={busy}>
                        {url ? t("photo.other") : t("photo.choose")}
                    </button>
                    <span className="pph-spacer" />
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>{t("consent.cancel")}</button>
                    <button type="button" className="btn btn-primary" onClick={save} disabled={busy || !nat}>
                        {busy ? t("me.loading") : t("photo.save")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Rasm + boshqaruv tugmalari (bemorning o'zi yoki registratura)
export function PatientPhotoBox({ patientId, version, editable, onChange, className = "", name }) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState(false);
    const [ver, setVer] = useState(version);
    useEffect(() => setVer(version), [version]);

    async function remove() {
        if (!window.confirm(t("photo.deleteConfirm"))) return;
        try {
            await client.delete(`/records/patients/${patientId}/photo/`);
            setVer(null);
            onChange?.(null);
        } catch { /* */ }
    }

    return (
        <div className={`pph-box ${className}`}>
            {editable ? (
                <button type="button" className="pph-click" onClick={() => setEditing(true)}
                        aria-label={ver ? t("photo.change") : t("photo.add")} title={ver ? t("photo.change") : t("photo.add")}>
                    <PatientPhoto patientId={patientId} version={ver} className="pph-lg" name={name} />
                    <span className="pph-cam" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
                    </span>
                </button>
            ) : (
                <PatientPhoto patientId={patientId} version={ver} className="pph-lg" name={name} />
            )}
            {editable && (
                <div className="pph-box-actions">
                    <button type="button" className="pph-btn" onClick={() => setEditing(true)}>
                        {ver ? t("photo.change") : t("photo.add")}
                    </button>
                    {ver && <button type="button" className="pph-btn pph-btn-muted" onClick={remove}>{t("photo.delete")}</button>}
                </div>
            )}
            {editing && (
                <PhotoEditor patientId={patientId} onClose={() => setEditing(false)}
                             onSaved={(v) => { setEditing(false); setVer(v); onChange?.(v); }} />
            )}
        </div>
    );
}
