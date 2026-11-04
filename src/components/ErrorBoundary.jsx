import { Component } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Kutilmagan render xatosida butun ilova oq ekranga aylanmasin: faqat shu qism o'rnida xabar chiqadi.
// resetKey o'zgarsa (masalan boshqa sahifaga o'tilsa) xato holati tozalanadi.
class Boundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
        this.reset = () => this.setState({ error: null });
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        // Ishlab chiqish konsoli uchun; foydalanuvchiga texnik tafsilot ko'rsatilmaydi
        console.error("[ErrorBoundary]", error, info?.componentStack);
    }

    componentDidUpdate(prev) {
        if (this.state.error && prev.resetKey !== this.props.resetKey) this.reset();
    }

    render() {
        if (!this.state.error) return this.props.children;
        return <Fallback error={this.state.error} onRetry={this.reset} full={this.props.full} />;
    }
}

function Fallback({ error, onRetry, full }) {
    const { t } = useTranslation();
    return (
        <div className={full ? "eb eb-full" : "eb"} role="alert">
            <div className="eb-card">
                <div className="eb-icon" aria-hidden="true">!</div>
                <h1>{t("errorPage.title")}</h1>
                <p>{t("errorPage.text")}</p>
                <div className="eb-actions">
                    <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>{t("errorPage.reload")}</button>
                    <button type="button" className="btn btn-secondary" onClick={onRetry}>{t("errorPage.retry")}</button>
                    <a className="btn btn-secondary" href="/me">{t("errorPage.home")}</a>
                </div>
                {import.meta.env.DEV && <pre className="eb-details">{String(error?.stack || error)}</pre>}
            </div>
        </div>
    );
}

// Sahifa almashganda xato holatini avtomatik tozalaydigan variant (Router ichida ishlatiladi)
export function RouteErrorBoundary({ children, full = false }) {
    const { pathname } = useLocation();
    return <Boundary resetKey={pathname} full={full}>{children}</Boundary>;
}

export default Boundary;
