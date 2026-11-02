import i18n from "i18next";

export const SPECIALTIES = [
    "therapist", "pediatrician", "dentist", "ophthalmologist", "cardiologist", "neurologist", "ent",
    "surgeon", "gynecologist", "dermatologist", "endocrinologist", "gastroenterologist", "urologist",
    "traumatologist", "other",
];

export function specLabel(t, code) {
    return code ? t(`queue.specialties.${code}`, { defaultValue: code }) : t("queue.specialties.other");
}

const norm = (s) => (s || "").toLowerCase().replace(/[ʻʼ‘’`']/g, "'").trim();

// Qidiruv barcha tillardagi nom va sinonimlar bo'yicha: "okulist", "ko'z", "окулист", "eye" bir xil natija beradi
export function specialtyHaystack(code) {
    const c = code || "other";
    return ["uz", "ru", "en"]
        .map((lng) => {
            const t = i18n.getFixedT(lng);
            return `${t(`queue.specialties.${c}`)} ${t(`queue.specialtyKeywords.${c}`, { defaultValue: "" })}`;
        })
        .join(" ")
        .toLowerCase();
}

export function matchesQuery(doctor, query) {
    const q = norm(query);
    if (!q) return true;
    const hay = `${norm(doctor.name)} ${specialtyHaystack(doctor.specialty)}`;
    return q.split(/\s+/).every((w) => hay.includes(w));
}

export function groupBySpecialty(doctors) {
    const groups = new Map();
    for (const d of doctors) {
        const code = d.specialty || "other";
        if (!groups.has(code)) groups.set(code, []);
        groups.get(code).push(d);
    }
    return [...groups.entries()].sort((a, b) => SPECIALTIES.indexOf(a[0]) - SPECIALTIES.indexOf(b[0]));
}

// Yo'nalishdagi eng yaqin bo'sh vaqt
// walkin=true: shifoxonada (kiosk) chipta olayotgan bemor uchun, faqat kelganlar hisobga olinadi
export function earliestEta(doctors, walkin = false) {
    const ok = (d) => (walkin ? d.accepting_walkin : d.accepting);
    const eta = (d) => (walkin ? d.next_eta_walkin : d.next_eta);
    const open = doctors.filter((d) => ok(d) && eta(d)).map(eta).sort();
    return open[0] || null;
}
