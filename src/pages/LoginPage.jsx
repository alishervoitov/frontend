import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const user = await login(username, password);
            if (user.role === "admin") navigate("/admin");
            else if (user.role === "doctor") navigate("/patients");
            else navigate("/me");
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(detail || "Login yoki parol noto'g'ri.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">MedKarta</div>
                <div className="auth-sub">Bemor kasallik tarixi tizimiga kirish</div>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="username">Foydalanuvchi nomi</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="password">Parol</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? "Kirilmoqda..." : "Kirish"}
                    </button>
                </form>

                <div className="auth-switch">
                    Hisobingiz yo'qmi? <Link to="/register">Ro'yxatdan o'ting</Link>
                    <div style={{ marginTop: 8 }}>
                        <Link to="/forgot-password">Parolni unutdingizmi?</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}