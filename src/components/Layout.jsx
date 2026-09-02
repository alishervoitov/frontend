import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Layout() {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const { t } = useTranslation();
    const isDoctorOrAdmin = user?.role === "doctor" || user?.role === "admin";
    const isAdmin = user?.role === "admin";
    const initial = (user?.first_name || user?.username || "?")[0]?.toUpperCase();

    return (
        <div>
            <div className="topbar">
                <div className="topbar-left">
                    <Link to="/me" className="topbar-brand">{t("app.name")}</Link>
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









