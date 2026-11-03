import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import client from "../api/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Layout() {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const { t } = useTranslation();
    const isDoctorOrAdmin = user?.role === "doctor" || user?.role === "admin";
    const isAdmin = user?.role === "admin";
    const [alertCount, setAlertCount] = useState(0);

    // Admin uchun ochiq xavfsizlik ogohlantirishlari soni (har daqiqada yangilanadi)
    useEffect(() => {
        if (!isAdmin) return undefined;
        const load = () => client.get("/monitoring/alerts/count/").then((r) => setAlertCount(r.data.open_count)).catch(() => {});
        load();
        const id = setInterval(load, 60000);
        window.addEventListener("alerts-changed", load);
        return () => { clearInterval(id); window.removeEventListener("alerts-changed", load); };
    }, [isAdmin]);
    const initial = (user?.first_name || user?.username || "?")[0]?.toUpperCase();

    return (
        <div>
            <div className="topbar">
                <div className="topbar-left">
                    <Link to="/me" className="topbar-brand">{t("app.name")}</Link>
                    {user?.role === "patient" && (
                        <Link to="/queue" className={`topbar-link q-nav ${pathname.startsWith("/queue") ? "active" : ""}`}>
                            {t("nav.queue")}
                        </Link>
                    )}
                    {user?.role === "patient" && (
                        <Link to="/my-access" className={`topbar-link q-nav ${pathname.startsWith("/my-access") ? "active" : ""}`}>
                            {t("nav.access")}
                        </Link>
                    )}
                    {user?.role === "lab" && (
                        <Link to="/lab" className={`topbar-link q-nav ${pathname.startsWith("/lab") ? "active" : ""}`}>
                            {t("nav.lab")}
                        </Link>
                    )}
                    {user?.role === "doctor" && (
                        <Link to="/doctor/queue" className={`topbar-link q-nav ${pathname.startsWith("/doctor/queue") ? "active" : ""}`}>
                            {t("nav.doctorQueue")}
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/registry" className={`topbar-link q-nav ${pathname.startsWith("/registry") ? "active" : ""}`}>
                            {t("nav.registry")}
                        </Link>
                    )}
                    {isDoctorOrAdmin && (
                        <Link to="/patients" className={`topbar-link ${pathname.startsWith("/patients") ? "active" : ""}`}>
                            {t("nav.patients")}
                        </Link>
                    )}
                    {isAdmin && (
                        <>
                            <Link to="/admin/users" className={`topbar-link ${pathname.startsWith("/admin/users") ? "active" : ""}`}>
                                {t("nav.users")}
                            </Link>
                            <Link to="/admin/audit" className={`topbar-link ${pathname.startsWith("/admin/audit") ? "active" : ""}`}>
                                {t("nav.audit")}
                            </Link>
                            <Link to="/admin/alerts" className={`topbar-link q-nav ${pathname.startsWith("/admin/alerts") ? "active" : ""}`}>
                                {t("nav.alerts")}
                                {alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
                            </Link>
                            <Link to="/admin/anonymize" className={`topbar-link ${pathname.startsWith("/admin/anonymize") ? "active" : ""}`}>
                                {t("nav.anonymize")}
                            </Link>
                        </>
                    )}
                </div>
                <div className="topbar-right">
                    <LanguageSwitcher />
                    <div className="avatar-circle avatar-sm">
                        {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" /> : <span>{initial}</span>}
                    </div>
                    <span className="topbar-user">
            <span>{user?.first_name || user?.username}</span>{" "}
                        <span className={`badge badge-${user?.role}`}>{t(`roles.${user?.role}`)}</span>
          </span>
                    <button className="btn btn-secondary" onClick={logout}>{t("nav.logout")}</button>
                </div>
            </div>
            <Outlet />
        </div>
    );
}









