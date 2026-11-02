import { useTranslation } from "react-i18next";
import { hhmm } from "../api/queue";
import { earliestEta, groupBySpecialty, specLabel } from "../api/specialty";

// Mutaxassislik plitalari: nomi, shifokorlar soni, eng yaqin vaqt
export default function SpecialtyPicker({ doctors, onPick, className = "", walkin = false }) {
    const { t } = useTranslation();
    const groups = groupBySpecialty(doctors);
    if (groups.length === 0) return <div className="empty-state">{t("queue.noMatch")}</div>;
    return (
        <div className={`q-spec-grid ${className}`}>
            {groups.map(([code, list]) => {
                const eta = earliestEta(list, walkin);
                return (
                    <button key={code} type="button" className="q-spec" onClick={() => onPick(code)}>
                        <span className="q-spec-name">{specLabel(t, code)}</span>
                        <span className="q-spec-meta">
                            {t("queue.doctorsCount", { count: list.length })}
                            {" · "}
                            {eta ? `${t("queue.nearest")} ~${hhmm(eta)}` : t("queue.closed")}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
