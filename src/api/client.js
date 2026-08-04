import axios from "axios";

export const API_BASE = "http://127.0.0.1:8000/api";

const client = axios.create({ baseURL: API_BASE });

function getTokens() {
    try {
        return JSON.parse(localStorage.getItem("medkarta_tokens") || "null");
    } catch {
        return null;
    }
}

function setTokens(tokens) {
    if (tokens) localStorage.setItem("medkarta_tokens", JSON.stringify(tokens));
    else localStorage.removeItem("medkarta_tokens");
}

client.interceptors.request.use((config) => {
    const tokens = getTokens();
    if (tokens?.access) {
        config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
});

let refreshPromise = null;

client.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        const status = error.response?.status;

        if (status === 401 && !original._retry && getTokens()?.refresh) {
            original._retry = true;
            try {
                if (!refreshPromise) {
                    const tokens = getTokens();
                    refreshPromise = axios
                        .post(`${API_BASE}/auth/login/refresh/`, { refresh: tokens.refresh })
                        .then((r) => {
                            const updated = { ...tokens, access: r.data.access };
                            setTokens(updated);
                            return updated;
                        })
                        .finally(() => {
                            refreshPromise = null;
                        });
                }
                const updated = await refreshPromise;
                original.headers.Authorization = `Bearer ${updated.access}`;
                return client(original);
            } catch {
                setTokens(null);
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export { getTokens, setTokens };
export default client;