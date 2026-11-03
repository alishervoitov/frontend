import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { errorText, hhmm, pendingCheckin, queueApi } from "../api/queue";

// QR kod skanerlanganda ochiladigan sahifa: /arrive?c=<kod>
export default function ArrivePage() {
    const { t } = useTranslation();
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [state, setState] = useState({ phase: "working" });
    const sent = useRef(false);

    useEffect(() => {
        if (loading || sent.current) return;
        const code = params.get("c") || pendingCheckin.get();
        if (!code) { setState({ phase: "error", message: t("queue.errors.bad_code") }); return; }
        if (!user) {
            pendingCheckin.set(code);               // kirgandan keyin shu yerga qaytamiz
            navigate("/login", { replace: true });
            return;
        }
        if (user.role !== "patient") { pendingCheckin.set(""); setState({ phase: "error", message: t("queue.checkinPatientsOnly") }); return; }
        sent.current = true;
        pendingCheckin.set("");
        queueApi.checkin(code)
            .then((d) => setState({ phase: "ok", ...d }))
            .catch((err) => setState({ phase: "error", message: errorText(err, t), code: err?.response?.data?.code }));
    }, [loading, user, params, navigate, t]);

    const waiting = (state.tickets || []).filter((x) => x.status === "waiting" || x.status === "called");

    return (
        <div className="q-arrive-page">
            <header className="q-arrive-head">
                <Link to="/" className="q-arrive-brand">{t("app.name")}</Link>
            </header>
            {state.phase === "working" && <div className="empty-state">{t("queue.checkinWorking")}</div>}
            {state.phase === "error" && (
                <div className="card q-checkin q-checkin-bad">
                    <div className="q-checkin-icon" aria-hidden="true">!</div>
                    <h1>{t("queue.checkinFailed")}</h1>
                    <p>{state.message}</p>
                    <Link className="btn btn-secondary q-btn-auto" to={user?.role === "patient" ? "/queue" : "/me"}>{t("queue.toMyQueue")}</Link>
                </div>
            )}
            {state.phase === "ok" && (
                <div className="card q-checkin">
                    <div className="q-checkin-icon" aria-hidden="true">✓</div>
                    <h1>{state.confirmed ? t("queue.checkinOk") : t("queue.checkinAlready")}</h1>
                    <p className="q-muted">{t("queue.checkinWait")}</p>
                    <div className="q-checkin-list">
                        {waiting.map((x) => (
                            <div key={x.id} className="q-checkin-row">
                                <b>№{x.number}</b>
                                <span>{x.doctor.name}{x.doctor.room ? ` · ${t("queue.room")} ${x.doctor.room}` : ""}</span>
                                <span className="q-muted">
                                    {x.status === "called" ? t("queue.calledNow") : `${t("queue.ahead")}: ${x.ahead} · ~${hhmm(x.eta)}`}
                                </span>
                            </div>
                        ))}
                    </div>
                    <Link className="btn btn-primary q-btn-auto" to="/queue">{t("queue.toMyQueue")}</Link>
                </div>
            )}
        </div>
    );
}
