import client, { API_BASE } from "./client";

// "2026-11-02T10:30+05:00" -> "10:30" (vaqt server tomonidan shifoxona zonasida beriladi)
export const hhmm = (iso) => (iso ? iso.slice(11, 16) : "—");

export const queueApi = {
    doctors: () => client.get("/queue/doctors/").then((r) => r.data),
    myTickets: () => client.get("/queue/tickets/my/").then((r) => r.data),
    take: (doctor) => client.post("/queue/tickets/", { doctor }).then((r) => r.data),
    cancel: (id) => client.post(`/queue/tickets/${id}/cancel/`).then((r) => r.data),
    doctorQueue: () => client.get("/queue/doctor/").then((r) => r.data),
    callNext: () => client.post("/queue/doctor/next/").then((r) => r.data),
    finish: () => client.post("/queue/doctor/finish/").then((r) => r.data),
    noShow: (id) => client.post(`/queue/doctor/tickets/${id}/no-show/`).then((r) => r.data),
    saveSettings: (data) => client.patch("/queue/doctor/settings/", data).then((r) => r.data),
    registry: () => client.get("/queue/registry/").then((r) => r.data),
    registryIssue: (doctor, visitor_name) =>
        client.post("/queue/registry/", { doctor, visitor_name }).then((r) => r.data),
};

// Kiosk hisobsiz ishlaydi: JWT yuborilmaydi, faqat kiosk kaliti
const KIOSK_KEY = "shifosafe_kiosk_key";
export const kioskKey = {
    get: () => {
        try { return localStorage.getItem(KIOSK_KEY) || ""; } catch { return ""; }
    },
    set: (v) => {
        try { v ? localStorage.setItem(KIOSK_KEY, v) : localStorage.removeItem(KIOSK_KEY); } catch { /* */ }
    },
};

async function kioskFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}/queue/kiosk/${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", "X-Kiosk-Key": kioskKey.get() },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.detail || "error");
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

export const kioskApi = {
    doctors: () => kioskFetch("doctors/"),
    take: (doctor) => kioskFetch("tickets/", { method: "POST", body: JSON.stringify({ doctor }) }),
};

export function errorText(err, t) {
    const code = err?.response?.data?.code || err?.data?.code;
    if (code) return t(`queue.errors.${code}`, { defaultValue: err?.response?.data?.detail || err?.data?.detail });
    return err?.response?.data?.detail || t("queue.errors.generic");
}
