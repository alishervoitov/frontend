import client from "./client";

export const labApi = {
    searchPatients: (search) => client.get("/labs/patients/", { params: { search } }).then((r) => r.data),
    results: (patient) => client.get("/labs/results/", { params: patient ? { patient } : {} }).then((r) => r.data),
    create: (data) => client.post("/labs/results/", data).then((r) => r.data),
    remove: (id) => client.delete(`/labs/results/${id}/`),
    upload: (id, file) => {
        const fd = new FormData();
        fd.append("file", file);
        return client.post(`/labs/results/${id}/attachments/`, fd).then((r) => r.data);
    },
    download: async (att) => {
        const res = await client.get(`/labs/attachments/${att.id}/`, { responseType: "blob" });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: att.content_type }));
        const a = document.createElement("a");
        a.href = url;
        a.download = att.original_filename;
        a.click();
        window.URL.revokeObjectURL(url);
    },
};

// Shablonlar: kattalar uchun keng tarqalgan namunaviy me'yorlar. Laborant o'z laboratoriyasi
// me'yorini kiritishi mumkin. m/f - erkak/ayol uchun alohida me'yor.
export const PANELS = {
    cbc: [
        { code: "hgb", unit: "g/l", m: [130, 160], f: [120, 140] },
        { code: "rbc", unit: "×10¹²/l", m: [4.0, 5.0], f: [3.7, 4.7] },
        { code: "hct", unit: "%", m: [40, 48], f: [36, 42] },
        { code: "wbc", unit: "×10⁹/l", ref: [4.0, 9.0] },
        { code: "plt", unit: "×10⁹/l", ref: [180, 320] },
        { code: "esr", unit: "mm/soat", m: [2, 10], f: [2, 15] },
        { code: "ci", unit: "", ref: [0.85, 1.05] },
    ],
    biochem: [
        { code: "glucose", unit: "mmol/l", ref: [3.3, 5.5] },
        { code: "protein", unit: "g/l", ref: [65, 85] },
        { code: "urea", unit: "mmol/l", ref: [2.5, 8.3] },
        { code: "creatinine", unit: "mkmol/l", m: [62, 115], f: [53, 97] },
        { code: "bilirubin", unit: "mkmol/l", ref: [3.4, 20.5] },
        { code: "alt", unit: "U/l", m: [0, 41], f: [0, 31] },
        { code: "ast", unit: "U/l", m: [0, 40], f: [0, 32] },
        { code: "cholesterol", unit: "mmol/l", ref: [3.0, 5.2] },
    ],
    urine: [
        { code: "color", text: ["straw", "yellow", "dark", "red"] },
        { code: "clarity", text: ["clear", "cloudy"] },
        { code: "sg", unit: "", ref: [1.010, 1.025] },
        { code: "ph", unit: "", ref: [5.0, 7.0] },
        { code: "protein_u", text: ["neg", "trace", "pos"] },
        { code: "glucose_u", text: ["neg", "trace", "pos"] },
        { code: "wbc_u", unit: "k/m", m: [0, 3], f: [0, 5] },
        { code: "rbc_u", unit: "k/m", ref: [0, 2] },
    ],
    custom: [],
};

export const PANEL_CODES = ["cbc", "biochem", "urine", "custom"];

// Standart amal qilish muddati (kun), backend DEFAULT_VALIDITY_DAYS bilan bir xil
export const VALIDITY_DAYS = { cbc: 10, urine: 10, biochem: 14, custom: 30 };

export function defaultValidUntil(panel, collectedLocal) {
    const d = new Date(collectedLocal || Date.now());
    d.setDate(d.getDate() + (VALIDITY_DAYS[panel] ?? 30));
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Kasallik tarixi uchun: shifokor yozuvlari va tahlil natijalari bitta ro'yxatda, eng yangisi tepada.
// Eski "lab_result" turidagi matnli yozuvlar o'rniga laborant kiritgan haqiqiy natijalar ko'rsatiladi.
export function mergeHistory(records, labs) {
    const items = [
        ...records.filter((r) => r.record_type !== "lab_result").map((r) => ({ kind: "record", date: r.visit_date, item: r })),
        ...labs.map((l) => ({ kind: "lab", date: l.collected_at, item: l })),
    ];
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function pickRange(p, gender) {
    if (p.ref) return p.ref;
    if (gender === "M") return p.m;
    if (gender === "F") return p.f;
    return [Math.min(p.m[0], p.f[0]), Math.max(p.m[1], p.f[1])];
}

export function panelRows(panel, gender, t) {
    return (PANELS[panel] || []).map((p) => {
        if (p.text) {
            return {
                name: t(`labs.params.${p.code}`), value: "", unit: "", ref_low: "", ref_high: "",
                ref_text: t(`labs.options.${p.text[0]}`), options: p.text.map((o) => t(`labs.options.${o}`)),
            };
        }
        const [lo, hi] = pickRange(p, gender);
        return { name: t(`labs.params.${p.code}`), value: "", unit: p.unit, ref_low: String(lo), ref_high: String(hi), ref_text: "" };
    });
}

const num = (v) => {
    if (v === null || v === undefined || String(v).trim() === "") return null;
    const n = Number(String(v).trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
};

// Serverdagi LabValue.flag bilan bir xil qoida (forma ichida jonli ko'rsatish uchun)
export function flagOf(row) {
    const v = num(row.value);
    const lo = num(row.ref_low);
    const hi = num(row.ref_high);
    if (v !== null && (lo !== null || hi !== null)) {
        if (lo !== null && v < lo) return "low";
        if (hi !== null && v > hi) return "high";
        return "normal";
    }
    if (row.ref_text && String(row.value).trim()) {
        return String(row.value).trim().toLowerCase() === row.ref_text.trim().toLowerCase() ? "normal" : "abnormal";
    }
    return null;
}

export function refLabel(v) {
    const fmt = (x) => (x === null || x === undefined || x === "" ? null : String(Number(x)));
    const lo = fmt(v.ref_low);
    const hi = fmt(v.ref_high);
    if (lo !== null && hi !== null) return `${lo} – ${hi}`;
    if (hi !== null) return `≤ ${hi}`;
    if (lo !== null) return `≥ ${lo}`;
    return v.ref_text || "—";
}
