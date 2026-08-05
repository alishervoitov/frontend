import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const isDoctorOrAdmin = user?.role === "doctor" || user?.role === "admin";

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
                </div>
                <div className="topbar-right">
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