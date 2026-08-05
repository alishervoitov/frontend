import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
    const { user, logout } = useAuth();

    return (
        <div>
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 32px", borderBottom: "1px solid #DCE6E2", background: "#fff",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <Link to="/me" style={{ fontWeight: 700, color: "#0E5C56", textDecoration: "none" }}>MedKarta</Link>
                    {(user?.role === "doctor" || user?.role === "admin") && (
                        <Link to="/patients" style={{ color: "#10262B", textDecoration: "none" }}>Bemorlar</Link>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 14, color: "#55716A" }}>{user?.first_name || user?.username} ({user?.role})</span>
                    <button className="btn btn-secondary" style={{ width: "auto", padding: "6px 14px" }} onClick={logout}>
                        Chiqish
                    </button>
                </div>
            </div>
            <Outlet />
        </div>
    );
}