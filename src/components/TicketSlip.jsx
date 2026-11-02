import { useTranslation } from "react-i18next";
import { hhmm } from "../api/queue";
import { specLabel } from "../api/specialty";

// Chop etiladigan navbat chiptasi (registratura va kiosk)
export default function TicketSlip({ ticket }) {
    const { t } = useTranslation();
    if (!ticket) return null;
    return (
        <div className="ticket-slip">
            <div className="ticket-slip-brand">{t("app.name")}</div>
            <div className="ticket-slip-label">{t("queue.yourNumber")}</div>
            <div className="ticket-slip-number">{ticket.number}</div>
            <div className="ticket-slip-doctor">{ticket.doctor.name}</div>
            <div className="ticket-slip-meta">
                {specLabel(t, ticket.doctor.specialty)}
                {ticket.doctor.room ? ` · ${t("queue.room")} ${ticket.doctor.room}` : ""}
            </div>
            <div className="ticket-slip-row">
                <span>{t("queue.ahead")}</span><b>{ticket.ahead}</b>
            </div>
            <div className="ticket-slip-row">
                <span>{t("queue.eta")}</span><b>~{hhmm(ticket.eta)}</b>
            </div>
            <div className="ticket-slip-foot">{ticket.date} · {hhmm(ticket.created_at)}</div>
        </div>
    );
}
