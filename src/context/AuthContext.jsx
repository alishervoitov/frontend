import { createContext, useContext, useEffect, useRef, useState } from "react";
import client, { onSessionExpired, refreshAccess, setAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const channel = useRef(null);

    useEffect(() => {
        let alive = true;
        // Sahifa ochilganda: httpOnly cookie bo'lsa - yangi access token, keyin profil
        refreshAccess()
            .then(() => client.get("/auth/me/"))
            .then((res) => alive && setUser(res.data))
            .catch(() => setAccessToken(null))
            .finally(() => alive && setLoading(false));

        // Sessiya tugadi (refresh rad etildi): foydalanuvchi chiqariladi, ProtectedRoute /login ga yuboradi
        const offExpired = onSessionExpired(() => setUser(null));

        // Bir tabda chiqilsa, boshqa tablar ham darhol chiqadi
        if ("BroadcastChannel" in window) {
            channel.current = new BroadcastChannel("shifosafe-auth");
            channel.current.onmessage = (e) => {
                if (e.data === "logout") {
                    setAccessToken(null);
                    setUser(null);
                }
            };
        }
        return () => {
            alive = false;
            offExpired();
            channel.current?.close();
        };
    }, []);

    // Parol to'g'ri, lekin 2FA yoqilgan bo'lsa tokenlar berilmaydi: { mfaToken } qaytadi.
    // Refresh token javob tanasida kelmaydi - server uni httpOnly cookie qilib qo'yadi.
    async function login(username, password) {
        const res = await client.post("/auth/login/", { username, password });
        if (res.data.mfa_required) return { mfaToken: res.data.mfa_token };
        setAccessToken(res.data.access);
        setUser(res.data.user);
        return res.data.user;
    }

    // Ikkinchi bosqich: ilovadagi 6 xonali kod yoki zaxira kod
    async function loginMfa(mfaToken, code) {
        const res = await client.post("/auth/login/2fa/", { mfa_token: mfaToken, code });
        setAccessToken(res.data.access);
        setUser(res.data.user);
        return { user: res.data.user, backupRemaining: res.data.backup_remaining };
    }

    async function register(payload) {
        await client.post("/auth/register/", payload);
        return login(payload.username, payload.password);
    }

    async function logout() {
        try {
            await client.post("/auth/logout/");      // server cookie'ni o'chiradi va sessiyani yopadi
        } catch {
            // logout so'rovi muvaffaqiyatsiz bo'lsa ham, lokal holatni tozalaymiz
        }
        setAccessToken(null);
        setUser(null);
        channel.current?.postMessage("logout");
    }

    const value = { user, loading, login, loginMfa, register, logout, setUser };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth faqat AuthProvider ichida ishlatilishi kerak");
    return ctx;
}
