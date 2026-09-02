import { useTranslation } from "react-i18next";

const LANGUAGES = [
    { code: "uz", label: "UZ" },
    { code: "ru", label: "RU" },
    { code: "en", label: "EN" },
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    return (
        <div style={{ display: "flex", gap: 4 }}>
            {LANGUAGES.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className="btn btn-secondary"
                    style={{
                        width: "auto", padding: "5px 10px", fontSize: "0.75rem",
                        background: i18n.language === lang.code ? "var(--primary)" : "var(--surface)",
                        color: i18n.language === lang.code ? "#fff" : "var(--ink)",
                    }}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
}