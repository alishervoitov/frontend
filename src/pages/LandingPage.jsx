import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

// Bosh sahifa. Bezak o'rniga tizimning haqiqiy ekranlari (public/landing/*.webp, namuna ma'lumotlar bilan)
// va tekshiruvlarning sanali ro'yxati ko'rsatiladi. Skrinshotlarni yangilash: demo bazada bemor sifatida
// "Kirishlar tarixi" va "Ruxsatlar" sahifalarini 1180px kenglikda suratga olish.
const ROLES = ["patient", "doctor", "desk"];
const ROLE_ITEMS = ["a", "b", "c"];
const CHECKS = ["pentest", "retest", "restore", "ci"];
const ZENODO_DOI = "10.5281/zenodo.23491903";

export default function LandingPage() {
    const { user, loading } = useAuth();
    const { t } = useTranslation();

    if (loading) return null;
    if (user) {
        const home = user.role === "doctor" ? "/patients" : user.role === "lab" ? "/lab" : "/me";
        return <Navigate to={home} replace />;
    }

    return (
        <div className="landing">
            <header className="lp-nav">
                <div className="lp-wrap lp-nav-inner">
                    <span className="lp-brand">{t("app.name")}</span>
                    <div className="lp-nav-right">
                        <LanguageSwitcher />
                        <Link to="/login" className="lp-nav-link">{t("auth.login")}</Link>
                    </div>
                </div>
            </header>

            <main>
                <section className="lp-hero">
                    <div className="lp-wrap lp-hero-grid">
                        <div className="lp-hero-text">
                            <h1>{t("landing.title")}</h1>
                            <p className="lp-lead">{t("landing.lead")}</p>
                            <div className="lp-actions">
                                <Link to="/register" className="btn btn-primary lp-btn">{t("auth.registerButton")}</Link>
                                <Link to="/login" className="btn btn-secondary lp-btn">{t("auth.loginButton")}</Link>
                            </div>
                        </div>
                        <figure className="lp-shot lp-shot-hero">
                            <img src="/landing/kirishlar-tarixi.webp" width="1770" height="1089" alt={t("landing.shotAccessAlt")} />
                            <figcaption>{t("landing.shotAccessCaption")}</figcaption>
                        </figure>
                    </div>
                </section>

                <section className="lp-section">
                    <div className="lp-wrap lp-split">
                        <div className="lp-prose">
                            <h2>{t("landing.consentTitle")}</h2>
                            <p>{t("landing.consentP1")}</p>
                            <p>{t("landing.consentP2")}</p>
                        </div>
                        <figure className="lp-shot">
                            <img src="/landing/ruxsatlar.webp" width="1770" height="780" loading="lazy" alt={t("landing.shotConsentAlt")} />
                            <figcaption>{t("landing.shotConsentCaption")}</figcaption>
                        </figure>
                    </div>
                </section>

                <section className="lp-section lp-roles-section">
                    <div className="lp-wrap">
                        <h2>{t("landing.rolesTitle")}</h2>
                        <div className="lp-roles">
                            {ROLES.map((r) => (
                                <div className="lp-role" key={r}>
                                    <h3>{t(`landing.roles.${r}.title`)}</h3>
                                    <ul>
                                        {ROLE_ITEMS.map((i) => <li key={i}>{t(`landing.roles.${r}.${i}`)}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="lp-checks">
                    <div className="lp-wrap lp-checks-grid">
                        <div className="lp-prose">
                            <h2>{t("landing.checksTitle")}</h2>
                            <p>{t("landing.checksLead")}</p>
                            <p>
                                {t("landing.checksOpen")}{" "}
                                <a href={`https://doi.org/${ZENODO_DOI}`} target="_blank" rel="noopener noreferrer">DOI {ZENODO_DOI}</a>
                            </p>
                        </div>
                        <dl className="lp-ledger">
                            {CHECKS.map((c) => (
                                <div className="lp-ledger-row" key={c}>
                                    <dt>{t(`landing.checks.${c}.when`)}</dt>
                                    <dd>{t(`landing.checks.${c}.what`)}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                <section className="lp-section lp-about">
                    <div className="lp-wrap lp-about-grid">
                        <div className="lp-prose">
                            <h2>{t("landing.aboutTitle")}</h2>
                            <p>{t("landing.aboutP1")}</p>
                            <p>{t("landing.aboutP2")}</p>
                        </div>
                        <div className="lp-actions lp-actions-end">
                            <Link to="/register" className="btn btn-primary lp-btn">{t("auth.registerButton")}</Link>
                            <Link to="/login" className="btn btn-secondary lp-btn">{t("auth.loginButton")}</Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="lp-footer">
                <div className="lp-wrap lp-footer-inner">
                    <span>© {new Date().getFullYear()} {t("app.name")}</span>
                    <span>{t("landing.footerNote")}</span>
                </div>
            </footer>
        </div>
    );
}
