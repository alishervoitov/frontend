import axios from "axios";

// Dev: API boshqa portda, lekin bir xil xostda - shunda refresh cookie "same-site" bo'lib yuboriladi
export const API_BASE = import.meta.env.PROD ? "/api" : `${window.location.protocol}//${window.location.hostname}:8000/api`;

// X-Requested-With - cookie o'qiydigan endpointlar (refresh, logout) uchun CSRF to'sig'i
const XHR = { "X-Requested-With": "XMLHttpRequest" };
const client = axios.create({ baseURL: API_BASE, withCredentials: true, headers: XHR });

// Tokenlar (S6, I7):
//  * refresh token - httpOnly cookie'da, JavaScript uni umuman ko'rmaydi;
//  * access token (15 daqiqa) - faqat shu o'zgaruvchida: localStorage'ga yozilmaydi,
//    sahifa yangilansa cookie orqali qaytadan olinadi.
let accessToken = null;
export function setAccessToken(token) {
    accessToken = token || null;
}

// Eski versiya tokenlarni localStorage'da saqlardi - qolgan bo'lsa o'chiramiz
try {
    localStorage.removeItem("medkarta_tokens");
} catch {
    /* brauzer xotirasi yopiq bo'lishi mumkin */
}

// Sessiya tugaganda (refresh rad etildi) AuthContext xabardor bo'ladi
const expiredListeners = new Set();
export function onSessionExpired(fn) {
    expiredListeners.add(fn);
    return () => expiredListeners.delete(fn);
}

let refreshPromise = null;
// Bir vaqtda bir nechta 401 bo'lsa ham refresh bitta so'rov bilan bajariladi
export function refreshAccess() {
    if (!refreshPromise) {
        refreshPromise = axios
            .post(`${API_BASE}/auth/login/refresh/`, {}, { withCredentials: true, headers: XHR })
            .then((r) => {
                setAccessToken(r.data.access);
                return r.data.access;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

client.interceptors.request.use((config) => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
});

// Login, 2FA, refresh va logout'ning o'z 401 javobi "sessiya tugadi" degani emas
const NO_REFRESH = /\/auth\/(login|logout)/;

client.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config || {};
        const status = error.response?.status;

        if (status === 401 && !original._retry && !NO_REFRESH.test(original.url || "")) {
            original._retry = true;
            try {
                const token = await refreshAccess();
                original.headers.Authorization = `Bearer ${token}`;
                return client(original);
            } catch {
                setAccessToken(null);
                expiredListeners.forEach((fn) => fn());
            }
        }
        // Admin/shifokor 2FA ni sozlamagan: istalgan so'rov shu kod bilan rad etiladi
        if (status === 403 && error.response?.data?.code === "mfa_setup_required" && window.location.pathname !== "/security") {
            window.location.href = "/security";
        }
        return Promise.reject(error);
    }
);

export async function downloadPatientHistoryPdf(patientId, filename, lang) {
    const currentLang = lang || localStorage.getItem("i18nextLng") || "uz";
    const res = await client.get(`/records/patients/${patientId}/history-pdf/`, {
        params: { lang: currentLang },
        responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

export async function downloadAttachment(attachmentId, filename) {
    const res = await client.get(`/records/attachments/${attachmentId}/`, {
        responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}
export default client;

