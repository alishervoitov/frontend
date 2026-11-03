import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import client from "../api/client";

const POLL_MS = 30000;
const ICON = { lab_ready: "🧪", queue_near: "⏳", queue_called: "📣", rx_expiring: "💊" };

function ago(t, iso) {
    const min = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    if (min < 1) return t("notif.now");
    if (min < 60) return t("notif.minAgo", { n: min });
    if (min < 1440) return t("notif.hourAgo", { n: Math.round(min / 60) });
    return t("notif.dayAgo", { n: Math.round(min / 1440) });
}

export function notificationText(t, n) {
    const p = n.params || {};
    switch (n.kind) {
        case "lab_ready":
            return t("notif.lab_ready", { title: p.title }) + (p.abnormal ? ` ${t("notif.lab_abnormal", { count: p.abnormal })}` : "");
        case "queue_near":
            return p.ahead === 0
                ? t("notif.queue_next", { number: p.number, doctor: p.doctor })
                : t("notif.queue_near", { ahead: p.ahead, number: p.number, doctor: p.doctor })
                  + (p.arrived ? "" : ` ${t("notif.queue_come")}`);
        case "queue_called":
            return t("notif.queue_called", { number: p.number, doctor: p.doctor }) + (p.room ? ` ${t("notif.room", { room: p.room })}` : "");
        case "rx_expiring":
            return p.days_left === 0
                ? t("notif.rx_today", { medication: p.medication })
                : t("notif.rx_expiring", { medication: p.medication, days: p.days_left });
        default:
            return n.kind;
    }
}

// Menyudagi qo'ng'iroqcha: o'qilmaganlar soni va bildirishnomalar ro'yxati
export default function NotificationBell() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [items, setItems] = useState(null);
    const box = useRef(null);
    const [top, setTop] = useState(null);

    const loadCount = useCallback(() => client.get("/notifications/count/").then((r) => setUnread(r.data.unread)).catch(() => {}), []);
    const loadList = useCallback(() => client.get("/notifications/").then((r) => { setItems(r.data.results); setUnread(r.data.unread); }).catch(() => setItems([])), []);

    useEffect(() => {
        loadCount();
        const id = setInterval(() => (open ? loadList() : loadCount()), POLL_MS);
        return () => clearInterval(id);
    }, [open, loadCount, loadList]);

    useEffect(() => {
        if (!open) return undefined;
        loadList();
        const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
        const esc = (e) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", esc);
        return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
    }, [open, loadList]);

    async function openItem(n) {
        if (!n.is_read) {
            await client.post(`/notifications/${n.id}/read/`).catch(() => {});
            setItems((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
            setUnread((c) => Math.max(0, c - 1));
        }
        setOpen(false);
        if (n.link) navigate(n.link);
    }

    async function readAll() {
        await client.post("/notifications/read-all/").catch(() => {});
        setItems((list) => (list || []).map((x) => ({ ...x, is_read: true })));
        setUnread(0);
    }

    return (
        <div className="notif" ref={box}>
            <button type="button" className="notif-btn" aria-label={t("notif.title")} aria-expanded={open} onClick={(e) => { setTop(e.currentTarget.getBoundingClientRect().bottom + 8); setOpen((v) => !v); }}>
                <span aria-hidden="true">🔔</span>
                {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
            </button>
            {open && (
                <div className="notif-panel" style={top ? { "--notif-top": `${top}px` } : undefined} role="dialog" aria-label={t("notif.title")}>
                    <div className="notif-head">
                        <b>{t("notif.title")}</b>
                        {unread > 0 && <button type="button" className="q-back notif-readall" onClick={readAll}>{t("notif.readAll")}</button>}
                    </div>
                    {items === null ? (
                        <div className="notif-empty">{t("me.loading")}</div>
                    ) : items.length === 0 ? (
                        <div className="notif-empty">{t("notif.empty")}</div>
                    ) : (
                        <ul className="notif-list">
                            {items.map((n) => (
                                <li key={n.id}>
                                    <button type="button" className={`notif-item ${n.is_read ? "" : "unread"}`} onClick={() => openItem(n)}>
                                        <span className="notif-icon" aria-hidden="true">{ICON[n.kind] || "•"}</span>
                                        <span className="notif-body">
                                            <span className="notif-text">{notificationText(t, n)}</span>
                                            <span className="notif-time">{ago(t, n.created_at)}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
