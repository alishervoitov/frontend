import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    const { pathname } = useLocation();

    if (loading) return <div style={{ padding: 40 }}>Yuklanmoqda...</div>;
    if (!user) return <Navigate to="/login" replace />;
    // Rol uchun majburiy 2FA hali sozlanmagan - avval xavfsizlik sahifasi
    if (user.mfa_required && !user.mfa_enabled && pathname !== "/security") {
        return <Navigate to="/security" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/me" replace />;
    }
    return children;
}