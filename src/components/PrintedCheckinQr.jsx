import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { errorText, queueApi } from "../api/queue";

// Zaxira: kiosk ekrani ishlamay qolganda devorga ilinadigan bugungi QR kod (faqat administrator)
export default function PrintedCheckinQr() {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => { queueApi.printedQr().then(setData).catch(() => setData({ active: false })); }, []);

    async function run(fn, confirmText) {
        if (confirmText && !window.confirm(confirmText)) return;
        setBusy(true);
        setError("");
        try { setData(await fn()); } catch (err) { setError(errorText(err, t)); } finally { setBusy(false); }
    }

    function print() {
        const w = window.open("", "_blank", "width=700,height=900");
        if (!w) return;
        const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>QR</title>
<style>body{font-family:system-ui,sans-serif;text-align:center;padding:40px;color:#111}
h1{font-size:34px;margin:0 0 8px}p{font-size:20px;margin:6px 0}.qr{width:420px;margin:24px auto}
.small{font-size:14px;color:#555}</style></head><body>
<h1>${esc(t("queue.kioskQrTitle"))}</h1><p>${esc(t("queue.kioskQrHint"))}</p>
<div class="qr">${data.svg}</div><p class="small">${esc(t("queue.printedValidFor", { date: data.date }))}</p>
<script>window.onload=function(){window.print()}</script></body></html>`);
        w.document.close();
    }

    if (!data) return null;
    return (
        <div className="card q-printed-qr">
            <div className="q-printed-qr-text">
                <h2 className="q-h2">{t("queue.printedTitle")}</h2>
                <p className="q-muted">{t("queue.printedHint")}</p>
                {error && <div className="alert-error">{error}</div>}
                <div className="btn-row">
                    {data.active ? (
                        <>
                            <button className="btn btn-primary q-btn-auto" disabled={busy} onClick={print}>{t("queue.print")}</button>
                            <button className="btn btn-secondary q-btn-auto" disabled={busy} onClick={() => run(queueApi.printedQrCreate, t("queue.printedRenewConfirm"))}>{t("queue.printedRenew")}</button>
                            <button className="btn btn-secondary q-btn-auto q-danger-text" disabled={busy} onClick={() => run(queueApi.printedQrRevoke, t("queue.printedRevokeConfirm"))}>{t("queue.printedRevoke")}</button>
                        </>
                    ) : (
                        <button className="btn btn-primary q-btn-auto" disabled={busy} onClick={() => run(queueApi.printedQrCreate)}>{t("queue.printedCreate")}</button>
                    )}
                </div>
                <p className="q-muted q-printed-status">
                    {data.active ? t("queue.printedActive", { date: data.date }) : t("queue.printedInactive")}
                </p>
            </div>
            {data.active && <div className="q-printed-qr-code" dangerouslySetInnerHTML={{ __html: data.svg }} />}
        </div>
    );
}
