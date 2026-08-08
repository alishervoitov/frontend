import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const isDoctorOrAdmin = user?.role === "doctor" || user?.role === "admin";
    const isAdmin = user?.role === "admin";
    const initial = (user?.first_name || user?.username || "?")[0]?.toUpperCase();

    return (
        <div>
            <div className="topbar">
                <div className="topbar-left">
                    <Link to="/me" className="topbar-brand">MedKarta</Link>
                    {isDoctorOrAdmin && (
                        <Link to="/patients" className={`topbar-link ${pathname.startsWith("/patients") ? "active" : ""}`}>
                            Bemorlar
                        </Link>
                    )}
                    {isAdmin && (
                        <>
                            <Link to="/admin/users" className={`topbar-link ${pathname.startsWith("/admin/users") ? "active" : ""}`}>
                                Foydalanuvchilar
                            </Link>
                            <Link to="/admin/audit" className={`topbar-link ${pathname.startsWith("/admin/audit") ? "active" : ""}`}>
                                Audit jurnali
                            </Link>
                            <Link to="/admin/anonymize" className={`topbar-link ${pathname.startsWith("/admin/anonymize") ? "active" : ""}`}>
                                Anonimlashtirish
                            </Link>
                        </>
                    )}
                </div>
                <div className="topbar-right">
                    <div className="avatar-circle avatar-sm">
                        {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" /> : <span>{initial}</span>}
                    </div>
                    <span className="topbar-user">
            {user?.first_name || user?.username}{" "}
                        <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </span>
                    <button className="btn btn-secondary" onClick={logout}>Chiqish</button>
                </div>
            </div>
            <Outlet />
        </div>
    );
}









