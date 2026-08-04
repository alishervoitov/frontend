import { createContext, useContext, useEffect, useState } from "react";
import client, { getTokens, setTokens } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tokens = getTokens();
        if (!tokens?.access) {
            setLoading(false);
            return;
        }
        client
            .get("/auth/me/")
            .then((res) => setUser(res.data))
            .catch(() => setTokens(null))
            .finally(() => setLoading(false));
    }, []);

    async function login(username, password) {
        const res = await client.post("/auth/login/", { username, password });
        setTokens({ access: res.data.access, refresh: res.data.refresh });
        setUser(res.data.user);
        return res.data.user;
    }

    async function register(payload) {
        await client.post("/auth/register/", payload);
        return login(payload.username, payload.password);
    }

    async function logout() {
        const tokens = getTokens();
        try {
            if (tokens?.refresh) {
                await client.post("/auth/logout/", { refresh: tokens.refresh });
            }
        } catch {
            // logout so'rovi muvaffaqiyatsiz bo'lsa ham, lokal holatni tozalaymiz
        }
        setTokens(null);
        setUser(null);
    }

    const value = { user, loading, login, register, logout, setUser };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth faqat AuthProvider ichida ishlatilishi kerak");
    return ctx;
}