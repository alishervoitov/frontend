import { useAuth } from "../context/AuthContext";

export default function MePage() {
    const { user, logout } = useAuth();
    return (
        <div style={{ padding: 40 }}>
            <h1>Salom, {user?.first_name || user?.username}!</h1>
            <p>Rolingiz: {user?.role}</p>
            <button className="btn btn-primary" style={{ width: "auto" }} onClick={logout}>
                Chiqish
            </button>
        </div>
    );
}