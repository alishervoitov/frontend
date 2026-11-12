import { Suspense, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import client from "../api/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import NavIcon from "./NavIcon";
import { RouteErrorBoundary } from "./ErrorBoundary";
import EmailVerifyBanner from "./EmailVerifyBanner";
import PageLoading from "./PageLoading";

// Rol bo'yicha menyu: kompyuterda yuqori qatorda, telefon/planshetda yon panelda (guruhlangan)
function menuFor(role, t, counts) {
    const L = (to, key, icon, extra = {}) => ({ to, label: t(key), icon, ...extra });
    if (role === "patient") {
        return [{ items: [L("/queue", "nav.queue", "queue"), L("/my-consent", "nav.consent", "consent"), L("/my-access", "nav.access", "access")] }];
    }
    if (role === "lab") return [{ items: [L("/lab", "nav.lab", "lab")] }];
    if (role === "doctor") {
        return [{ items: [
            L("/doctor/queue", "nav.doctorQueue", "list", { badge: counts.present, badgeKind: "ok", badgeTitle: t("queue.presentBadge") }),
            L("/patients", "nav.patients", "patients"),
        ] }];
    }
    if (role === "admin") {
        return [
            { title: t("nav.groupQueue"), items: [L("/registry", "nav.registry", "registry"), L("/admin/queue-stats", "nav.queueStats", "stats")] },
            { title: t("nav.groupData"), items: [L("/patients", "nav.patients", "patients"), L("/admin/users", "nav.users", "users")] },
            { title: t("nav.groupSecurity"), items: [
                L("/admin/audit", "nav.audit", "audit"),
                L("/admin/alerts", "nav.alerts", "alerts", { badge: counts.alerts }),
                L("/admin/anonymize", "nav.anonymize", "anonymize"),
            ] },
        ];
    }
    return [];
}

export default function Layout() {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const { t } = useTranslation();
    const isAdmin = user?.role === "admin";
    const isDoctor = user?.role === "doctor";
    const [alertCount, setAlertCount] = useState(0);
    const [presentCount, setPresentCount] = useState(0);
    const [open, setOpen] = useState(false);
    const closeBtn = useRef(null);
    const [userOpen, setUserOpen] = useState(false);
    const userBox = useRef(null);
    const menuBtn = useRef(null);

    // Admin uchun ochiq xavfsizlik ogohlantirishlari soni (har daqiqada yangilanadi)
    useEffect(() => {
        if (!isAdmin) return undefined;
        const load = () => client.get("/monitoring/alerts/count/").then((r) => setAlertCount(r.data.open_count)).catch(() => {});
        load();
        const id = setInterval(load, 60000);
        window.addEventListener("alerts-changed", load);
        return () => { clearInterval(id); window.removeEventListener("alerts-changed", load); };
    }, [isAdmin]);

    // Shifokor uchun: shifoxonaga kelib kutayotgan bemorlar soni
    useEffect(() => {
        if (!isDoctor) return undefined;
        const load = () => client.get("/queue/doctor/count/").then((r) => setPresentCount(r.data.present)).catch(() => {});
        load();
        const id = setInterval(load, 20000);
        window.addEventListener("queue-changed", load);
        return () => { clearInterval(id); window.removeEventListener("queue-changed", load); };
    }, [isDoctor]);

    // Yon panel: sahifa almashganda yopiladi, Esc bilan yopiladi, ochiqligida orqa fon aylanmaydi
    useEffect(() => { setOpen(false); setUserOpen(false); }, [pathname]);
    // Kompyuterdagi foydalanuvchi menyusi: tashqariga bosilsa yoki Esc bilan yopiladi
    useEffect(() => {
        if (!userOpen) return undefined;
        const out = (e) => { if (userBox.current && !userBox.current.contains(e.target)) setUserOpen(false); };
        const esc = (e) => { if (e.key === "Escape") setUserOpen(false); };
        document.addEventListener("mousedown", out);
        document.addEventListener("keydown", esc);
        return () => { document.removeEventListener("mousedown", out); document.removeEventListener("keydown", esc); };
    }, [userOpen]);
    useEffect(() => {
        if (!open) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeBtn.current?.focus();
        const esc = (e) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", esc);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener("keydown", esc);
            menuBtn.current?.focus();
        };
    }, [open]);

    const groups = menuFor(user?.role, t, { alerts: alertCount, present: presentCount });
    const flat = groups.flatMap((g) => g.items);
    const isActive = (to) => pathname.startsWith(to);
    const pending = flat.reduce((s, x) => s + (x.badge > 0 ? x.badge : 0), 0);
    const name = user?.first_name || user?.username;
    const initial = (name || "?")[0]?.toUpperCase();
    const avatar = (cls) => (
        <div className={`avatar-circle ${cls}`}>
            {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{initial}</span>}
        </div>
    );
    const badge = (x) => x.badge > 0 && (
        <span className={`nav-badge ${x.badgeKind === "ok" ? "nav-badge-ok" : ""}`} title={x.badgeTitle}>{x.badge}</span>
    );

    return (
        <div>
            <div className="topbar">
                <div className="topbar-left">
                    <Link to="/me" className="topbar-brand">{t("app.name")}</Link>
                    <nav className="topbar-nav" aria-label={t("nav.menu")}>
                        {flat.map((x) => (
                            <Link key={x.to} to={x.to} className={`topbar-link q-nav ${isActive(x.to) ? "active" : ""}`}>
                                {x.label}{badge(x)}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="topbar-right">
                    {user?.role === "patient" && <NotificationBell />}
                    <div className="topbar-desktop">
                        <LanguageSwitcher />
                        <div className="user-menu" ref={userBox}>
                            <button type="button" className={`user-menu-btn role-${user?.role} ${userOpen ? "open" : ""}`} aria-haspopup="menu"
                                    aria-expanded={userOpen} onClick={() => setUserOpen((v) => !v)}>
                                {avatar("avatar-sm user-menu-avatar")}
                                <span className="user-menu-text">
                                    <span className="user-menu-name">{name}</span>
                                    <span className="user-menu-role">{t(`roles.${user?.role}`)}</span>
                                </span>
                                <svg className="user-menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                            </button>
                            {userOpen && (
                                <div className={`user-menu-pop role-${user?.role}`} role="menu">
                                    <div className="user-menu-card">
                                        {avatar("avatar-md user-menu-avatar")}
                                        <div className="user-menu-card-text">
                                            <b>{[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username}</b>
                                            <span>@{user?.username}</span>
                                            <span className={`badge badge-${user?.role}`}>{t(`roles.${user?.role}`)}</span>
                                        </div>
                                    </div>
                                    <Link role="menuitem" to="/me" className="user-menu-item">
                                        <span className="user-menu-ico"><NavIcon name="profile" size={18} /></span>
                                        <span className="user-menu-item-text"><b>{t("nav.myProfile")}</b><small>{t("nav.myProfileHint")}</small></span>
                                    </Link>
                                    <Link role="menuitem" to="/account" className="user-menu-item">
                                        <span className="user-menu-ico"><NavIcon name="settings" size={18} /></span>
                                        <span className="user-menu-item-text"><b>{t("account.title")}</b><small>{t("account.menuHint")}</small></span>
                                    </Link>
                                    <Link role="menuitem" to="/security" className="user-menu-item">
                                        <span className="user-menu-ico"><NavIcon name="key" size={18} /></span>
                                        <span className="user-menu-item-text"><b>{t("mfa.title")}</b><small>{user?.mfa_enabled ? t("mfa.on") : t("mfa.off")}</small></span>
                                    </Link>
                                    <Link role="menuitem" to="/sessions" className="user-menu-item">
                                        <span className="user-menu-ico"><NavIcon name="devices" size={18} /></span>
                                        <span className="user-menu-item-text"><b>{t("sessions.title")}</b><small>{t("nav.sessionsHint")}</small></span>
                                    </Link>
                                    <button role="menuitem" type="button" className="user-menu-item user-menu-logout" onClick={logout}>
                                        <span className="user-menu-ico"><NavIcon name="logout" size={18} /></span>
                                        <span className="user-menu-item-text"><b>{t("nav.logout")}</b></span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <button type="button" ref={menuBtn} className="menu-btn" aria-label={t("nav.openMenu")}
                            aria-expanded={open} aria-controls="side-menu" onClick={() => setOpen(true)}>
                        <NavIcon name="menu" size={22} />
                        {pending > 0 && <span className="menu-btn-dot" aria-hidden="true" />}
                    </button>
                </div>
            </div>

            <div className={`side-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
            <aside id="side-menu" className={`side-menu ${open ? "open" : ""}`} aria-label={t("nav.menu")}
                   aria-hidden={!open} inert={open ? undefined : ""}
                   onClick={(e) => { if (e.target.closest("a")) setOpen(false); }}>
                <div className="side-head">
                    <Link to="/me" className="topbar-brand">{t("app.name")}</Link>
                    <button type="button" ref={closeBtn} className="side-close" aria-label={t("nav.closeMenu")} onClick={() => setOpen(false)}>
                        <NavIcon name="close" />
                    </button>
                </div>

                <Link to="/me" className={`side-user ${pathname === "/me" ? "active" : ""}`}>
                    {avatar("avatar-md")}
                    <span className="side-user-text">
                        <b>{[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username}</b>
                        <span className={`badge badge-${user?.role}`}>{t(`roles.${user?.role}`)}</span>
                    </span>
                </Link>

                <nav className="side-nav">
                    {groups.map((g, gi) => (
                        <div key={gi} className="side-group">
                            {g.title && <div className="side-group-title">{g.title}</div>}
                            {g.items.map((x) => (
                                <Link key={x.to} to={x.to} className={`side-link ${isActive(x.to) ? "active" : ""}`}
                                      aria-current={isActive(x.to) ? "page" : undefined}>
                                    <NavIcon name={x.icon} />
                                    <span className="side-link-label">{x.label}</span>
                                    {badge(x)}
                                </Link>
                            ))}
                        </div>
                    ))}
                    <div className="side-group">
                        <div className="side-group-title">{t("nav.groupAccount")}</div>
                        <Link to="/me" className={`side-link ${pathname === "/me" ? "active" : ""}`}>
                            <NavIcon name="profile" /><span className="side-link-label">{t("nav.myProfile")}</span>
                        </Link>
                        <Link to="/account" className={`side-link ${isActive("/account") ? "active" : ""}`}>
                            <NavIcon name="settings" /><span className="side-link-label">{t("account.title")}</span>
                        </Link>
                        <Link to="/security" className={`side-link ${isActive("/security") ? "active" : ""}`}>
                            <NavIcon name="key" /><span className="side-link-label">{t("mfa.title")}</span>
                        </Link>
                        <Link to="/sessions" className={`side-link ${isActive("/sessions") ? "active" : ""}`}>
                            <NavIcon name="devices" /><span className="side-link-label">{t("sessions.title")}</span>
                        </Link>
                    </div>
                </nav>

                <div className="side-foot">
                    <LanguageSwitcher />
                    <button type="button" className="btn btn-secondary side-logout" onClick={logout}>
                        <NavIcon name="logout" size={18} /> {t("nav.logout")}
                    </button>
                </div>
            </aside>
            {/* Sahifadagi xato menyuni ham olib ketmasin */}
            <EmailVerifyBanner />
            {/* Menyu joyida qoladi, faqat sahifa qismi yuklanadi */}
            <RouteErrorBoundary><Suspense fallback={<PageLoading />}><Outlet /></Suspense></RouteErrorBoundary>
        </div>
    );
}
