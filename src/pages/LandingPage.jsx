import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

const ICONS = {
    patient: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
    doctor: <path d="M6 3v6a5 5 0 0 0 10 0V3M11 14v3a4 4 0 0 0 8 0v-1M19 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
    pdf: <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6" />,
    admin: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4" />,
    check: <path d="M5 13l4 4L19 7" />,
    lock: <path d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5z" />,
};

function Icon({ name, size = 22 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[name]}
        </svg>
    );
}


const FEATURES = ["patient", "doctor", "pdf", "admin"];
const SECURITY = ["roles", "session", "audit", "https"];
const STEPS = ["1", "2", "3"];
const MOCK_ROWS = ["r1", "r2"];

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
            <header className="landing-nav">
                <div className="landing-nav-inner">
                    <div className="landing-brand">
                        <span className="landing-logo"><Icon name="admin" size={18} /></span>
                        {t("app.name")}
                    </div>
                    <div className="landing-nav-right">
                        <LanguageSwitcher />
                        <Link to="/login" className="btn btn-secondary landing-btn">{t("auth.login")}</Link>
                    </div>
                </div>
            </header>

            <section className="landing-hero">
                <div className="landing-hero-text">
                    <h1>
                        {t("landing.heroTitleA")} <em>{t("landing.heroTitleB")}</em>
                    </h1>
                    <p>{t("landing.heroText")}</p>
                    <div className="landing-cta">
                        <Link to="/login" className="btn btn-primary landing-btn landing-btn-lg">{t("auth.loginButton")}</Link>
                        <Link to="/register" className="btn btn-secondary landing-btn landing-btn-lg">{t("auth.registerButton")}</Link>
                    </div>
                </div>

                <div className="landing-hero-visual" aria-hidden="true">
                    <div className="stage">
                        <div className="stage-rings"><i /><i /><i /></div>
                        <div className="stage-shield">
                            <svg viewBox="0 0 120 140" width="150" height="175">
                                <defs>
                                    <linearGradient id="sh" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0" stopColor="#3FB8A6" />
                                        <stop offset="1" stopColor="#0E5C56" />
                                    </linearGradient>
                                </defs>
                                <path d="M60 6L108 24V68C108 100 88 122 60 134C32 122 12 100 12 68V24Z" fill="url(#sh)" stroke="#BFE8E1" strokeWidth="3" />
                                <path d="M42 70l13 13 26-28" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                        </div>

                        <div className="mock stage-a">
                            <div className="mock-bar"><i /><i /><i /><span>{t("landing.mock.title")}</span></div>
                            <div className="mock-body">
                                {MOCK_ROWS.map((r) => (
                                    <div className="mock-row" key={r}>
                                        <div className="mock-date">{t(`landing.mock.${r}.date`)}</div>
                                        <div>
                                            <div className="mock-diag">{t(`landing.mock.${r}.diag`)}</div>
                                            <div className="mock-sub">{t(`landing.mock.${r}.sub`)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="stage-card stage-b">
                            <div className="stage-card-title"><span className="rx">℞</span> {t("landing.cards.rx.title")}</div>
                            <div className="stage-line">{t("landing.cards.rx.l1")}</div>
                            <div className="stage-line stage-line-muted">{t("landing.cards.rx.l2")}</div>
                        </div>

                        <div className="stage-card stage-c">
                            <span className="stage-pdf"><Icon name="pdf" size={22} /></span>
                            <div>
                                <div className="stage-card-title">{t("landing.cards.pdf.title")}</div>
                                <div className="stage-line stage-line-muted">{t("landing.cards.pdf.sub")}</div>
                            </div>
                        </div>

                        <div className="mock-badge stage-lock"><Icon name="lock" size={16} /> {t("landing.mock.badge")}</div>
                    </div>
                    <div className="mock-note">{t("landing.mock.note")}</div>
                </div>
                <svg className="ecg" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
                    <path className="ecg-base" pathLength="1" d="M0 70H260l18-6 14 6H400l16-52 18 104 16-74 12 22H700l18-6 14 6H820l16-52 18 104 16-74 12 22H1200" />
                    <path className="ecg-line" pathLength="1" d="M0 70H260l18-6 14 6H400l16-52 18 104 16-74 12 22H700l18-6 14 6H820l16-52 18 104 16-74 12 22H1200" />
                </svg>
            </section>

            <section className="landing-section">
                <h2>{t("landing.stepsTitle")}</h2>
                <div className="landing-steps">
                    {STEPS.map((n) => (
                        <div className="landing-step" key={n}>
                            <div className="landing-step-num">{n}</div>
                            <h3>{t(`landing.steps.${n}.title`)}</h3>
                            <p>{t(`landing.steps.${n}.text`)}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="landing-section">
                <h2>{t("landing.featuresTitle")}</h2>
                <div className="landing-grid">
                    {FEATURES.map((key) => (
                        <div className="landing-card" key={key}>
                            <div className="landing-card-icon"><Icon name={key} /></div>
                            <h3>{t(`landing.features.${key}.title`)}</h3>
                            <p>{t(`landing.features.${key}.text`)}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="landing-security">
                <div className="landing-security-inner">
                    <div>
                        <span className="landing-eyebrow landing-eyebrow-dark">{t("landing.securityEyebrow")}</span>
                        <h2>{t("landing.securityTitle")}</h2>
                        <p>{t("landing.securityText")}</p>
                    </div>
                    <ul>
                        {SECURITY.map((key) => (
                            <li key={key}>
                                <span className="landing-check"><Icon name="check" size={16} /></span>
                                {t(`landing.security.${key}`)}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="landing-final">
                <h2>{t("landing.finalTitle")}</h2>
                <div className="landing-cta">
                    <Link to="/register" className="btn landing-btn landing-btn-lg landing-btn-accent">{t("auth.registerButton")}</Link>
                    <Link to="/login" className="btn btn-secondary landing-btn landing-btn-lg">{t("auth.loginButton")}</Link>
                </div>
            </section>

            <footer className="landing-footer">
                <span>© {new Date().getFullYear()} {t("app.name")}</span>
                <span>{t("landing.footerNote")}</span>
            </footer>
        </div>
    );
}
