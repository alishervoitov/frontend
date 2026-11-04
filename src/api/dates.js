import i18n from "i18next";

// Brauzerlarning Intl o'zbekcha oy nomlarini to'g'ri bermaydi ("2026 M11 29"), shuning uchun qo'lda
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const UZ_SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

const lang = () => i18n.language || "uz";
const isUz = () => lang().startsWith("uz");

export function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString(isUz() ? "ru-RU" : lang(), { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

// "29-noyabr, 2026" / "29 ноября 2026 г." / "November 29, 2026"
export function fmtDate(iso, { year = true, short = false } = {}) {
    const d = new Date(iso);
    if (isUz()) {
        const m = (short ? UZ_SHORT : UZ_MONTHS)[d.getMonth()];
        return `${d.getDate()}-${m}${year ? `, ${d.getFullYear()}` : ""}`;
    }
    return d.toLocaleDateString(lang(), { day: "numeric", month: short ? "short" : "long", ...(year ? { year: "numeric" } : {}) });
}

export const fmtDateTime = (iso) => `${fmtDate(iso)}, ${fmtTime(iso)}`;
