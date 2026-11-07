import client, { API_BASE } from "./client";

// "2026-11-02T10:30+05:00" -> "10:30" (vaqt server tomonidan shifoxona zonasida beriladi)
export const hhmm = (iso) => (iso ? iso.slice(11, 16) : "—");

export const queueApi = {
    doctors: () => client.get("/queue/doctors/").then((r) => r.data),
    myTickets: () => client.get("/queue/tickets/my/").then((r) => r.data),
    take: (doctor) => client.post("/queue/tickets/", { doctor }).then((r) => r.data),
    arrive: (id) => client.post(`/queue/tickets/${id}/arrive/`).then((r) => r.data),
    cancel: (id) => client.post(`/queue/tickets/${id}/cancel/`).then((r) => r.data),
    doctorQueue: () => client.get("/queue/doctor/").then((r) => r.data),
    callNext: () => client.post("/queue/doctor/next/").then((r) => r.data),
    finish: () => client.post("/queue/doctor/finish/").then((r) => r.data),
    noShow: (id) => client.post(`/queue/doctor/tickets/${id}/no-show/`).then((r) => r.data),
    saveSettings: (data) => client.patch("/queue/doctor/settings/", data).then((r) => r.data),
    registry: () => client.get("/queue/registry/").then((r) => r.data),
    registryIssue: (doctor, patient, noPhotoReason = "") =>
        client.post("/queue/registry/", { doctor, patient, no_photo_reason: noPhotoReason }).then((r) => r.data),
    registryPatients: (q, dob) =>
        client.get("/queue/registry/patients/", { params: { q, ...(dob ? { dob } : {}) } }).then((r) => r.data),
    registryCreatePatient: (data) => client.post("/queue/registry/patients/", data).then((r) => r.data),
    registryTempPassword: (patient) =>
        client.post(`/queue/registry/patients/${patient}/temp-password/`).then((r) => r.data),
    registryLink: (ticket, patient, noPhotoReason = "") =>
        client.post(`/queue/registry/tickets/${ticket}/link/`, { patient, no_photo_reason: noPhotoReason }).then((r) => r.data),
    checkin: (code) => client.post("/queue/checkin/", { code }).then((r) => r.data),
    printedQr: () => client.get("/queue/admin/printed-checkin/", { params: { base: window.location.origin } }).then((r) => r.data),
    printedQrCreate: () => client.post("/queue/admin/printed-checkin/", null, { params: { base: window.location.origin } }).then((r) => r.data),
    printedQrRevoke: () => client.delete("/queue/admin/printed-checkin/").then((r) => r.data),
};

// QR havolasi kod bilan ochilganda, bemor hali tizimga kirmagan bo'lsa, kod shu yerda saqlanadi
const PENDING_CHECKIN = "shifosafe_pending_checkin";
export const pendingCheckin = {
    get: () => { try { return sessionStorage.getItem(PENDING_CHECKIN) || ""; } catch { return ""; } },
    set: (v) => { try { v ? sessionStorage.setItem(PENDING_CHECKIN, v) : sessionStorage.removeItem(PENDING_CHECKIN); } catch { /* */ } },
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
    checkinCode: () => kioskFetch(`checkin-code/?base=${encodeURIComponent(window.location.origin)}`),
};

export function errorText(err, t) {
    const code = err?.response?.data?.code || err?.data?.code;
    if (code) return t(`queue.errors.${code}`, { defaultValue: err?.response?.data?.detail || err?.data?.detail });
    return err?.response?.data?.detail || t("queue.errors.generic");
}

// S8: rasmi yo'q bemorga chipta/bog'lash - rasm yoki kamida 5 belgilik sabab (server ham tekshiradi)
export const NO_PHOTO_MIN = 5;
export const gateOk = (patient, reason) =>
    !!patient && (!!patient.photo_updated_at || reason.trim().length >= NO_PHOTO_MIN);
