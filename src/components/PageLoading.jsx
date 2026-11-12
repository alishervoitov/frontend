import { useTranslation } from "react-i18next";

// Sahifa kodi yuklanayotganda ko'rinadi (lazyPage). Odatda soniyaning ulushida o'tib ketadi.
export default function PageLoading() {
    const { t } = useTranslation();
    return <div className="page"><div className="empty-state" role="status">{t("me.loading")}</div></div>;
}
