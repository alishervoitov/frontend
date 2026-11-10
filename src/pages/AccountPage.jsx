import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

// Backend xatosi: {field: [msg]} yoki {detail}. Maydon bo'yicha xabarlar va umumiy xabar.
function parseErrors(err, fallback) {
    const d = err?.response?.data;
    if (!d || typeof d !== "object") return { _: fallback };
    if (err.response.status === 429) return { _: d.detail || fallback };
    const out = {};
    for (const [k, v] of Object.entries(d)) out[k === "detail" || k === "non_field_errors" ? "_" : k] = Array.isArray(v) ? v.join(" ") : String(v);
    return Object.keys(out).length ? out : { _: fallback };
}

function FieldError({ msg }) {
    return msg ? <div className="acc-field-error" role="alert">{msg}</div> : null;
}

// Profil sozlamalari: aloqa ma'lumotlarini tahrirlash va parolni o'zgartirish.
// Qon guruhi, allergiyalar, F.I.Sh. va hujjat raqamini bemor o'zgartira olmaydi - ularni shifokor
// yoki registratura tasdiqlab kiritadi (backend ham bu maydonlarni qabul qilmaydi).
export default function AccountPage() {
    const { t } = useTranslation();
    const { user, setUser } = useAuth();
    const isPatient = user?.role === "patient";

    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState(null);
    const [pErr, setPErr] = useState({});
    const [pMsg, setPMsg] = useState("");
    const [pBusy, setPBusy] = useState(false);

    const emptyPw = { current_password: "", new_password: "", new_password_confirm: "", code: "" };
    const [pw, setPw] = useState(emptyPw);
    const [wErr, setWErr] = useState({});
    const [wMsg, setWMsg] = useState("");
    const [wBusy, setWBusy] = useState(false);

    useEffect(() => {
        if (!user) return;
        const base = { phone: user.phone || "", email: user.email || "", current_password: "" };
        if (!isPatient) {
            setForm(base);
            return;
        }
        client.get("/records/patients/me/")
            .then((r) => {
                setProfile(r.data);
                setForm({ ...base, address: r.data.address || "", emergency_contact: r.data.emergency_contact || "",
                          gender: r.data.gender || "", date_of_birth: r.data.date_of_birth || "" });
            })
            .catch(() => setForm(base));
        // Faqat sahifa ochilganda yuklanadi (saqlangandan keyin user yangilansa forma qayta to'lmasin)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    if (!user || !form) return <div className="page"><div className="empty-state">{t("me.loading")}</div></div>;

    const emailChanged = isPatient && form.email.trim().toLowerCase() !== (user.email || "").toLowerCase();
    const dobLocked = Boolean(profile?.date_of_birth);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    async function saveProfile(e) {
        e.preventDefault();
        setPBusy(true);
        setPErr({});
        setPMsg("");
        const body = { phone: form.phone };
        if (emailChanged) Object.assign(body, { email: form.email, current_password: form.current_password });
        if (isPatient && profile) {
            Object.assign(body, { address: form.address, emergency_contact: form.emergency_contact, gender: form.gender });
            if (!dobLocked && form.date_of_birth) body.date_of_birth = form.date_of_birth;
        }
        try {
            const r = await client.patch("/auth/me/", body);
            setUser(r.data);
            if (isPatient && profile) {
                setProfile({ ...profile, address: form.address, emergency_contact: form.emergency_contact,
                             gender: form.gender, date_of_birth: profile.date_of_birth || form.date_of_birth || null });
            }
            setForm({ ...form, phone: r.data.phone || "", email: r.data.email || "", current_password: "" });
            setPMsg(emailChanged ? t("account.savedEmail") : t("account.saved"));
        } catch (err) {
            setPErr(parseErrors(err, t("account.saveError")));
        } finally {
            setPBusy(false);
        }
    }

    async function changePassword(e) {
        e.preventDefault();
        setWBusy(true);
        setWErr({});
        setWMsg("");
        try {
            const body = { ...pw };
            if (!user.mfa_enabled) delete body.code;
            const r = await client.post("/auth/password/change/", body);
            setPw(emptyPw);
            setWMsg(t("account.pwChanged", { count: r.data.revoked || 0 }));
        } catch (err) {
            setWErr(parseErrors(err, t("account.pwError")));
        } finally {
            setWBusy(false);
        }
    }

    const setP = (k) => (e) => setPw({ ...pw, [k]: k === "code" ? e.target.value.replace(/\s/g, "") : e.target.value });
    const pwReady = pw.current_password && pw.new_password && pw.new_password_confirm && (!user.mfa_enabled || pw.code.length >= 6);
    const fullName = [user.last_name, user.first_name].filter(Boolean).join(" ") || user.username;

    return (
        <div className="page acc-page">
            <div className="page-head">
                <h1>{t("account.title")}</h1>
            </div>
            <p className="q-muted acc-lead">{t("account.lead")}</p>

            <section className="mfa-card">
                <h2>{t("account.contactTitle")}</h2>
                <form onSubmit={saveProfile} noValidate>
                    <div className="acc-grid">
                        <div className="field">
                            <label htmlFor="acc-phone">{t("account.phone")}</label>
                            <input id="acc-phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+998901234567" autoComplete="tel" />
                            <FieldError msg={pErr.phone} />
                        </div>
                        <div className="field">
                            <label htmlFor="acc-email">{t("account.email")}</label>
                            <input id="acc-email" type="email" value={form.email} onChange={set("email")} disabled={!isPatient} autoComplete="email" />
                            {!isPatient && <div className="acc-hint">{t("account.staffEmailHint")}</div>}
                            {isPatient && user.email && !emailChanged && (
                                <div className={`acc-hint ${user.email_verified ? "acc-ok" : ""}`}>
                                    {user.email_verified ? `✓ ${t("account.emailVerified")}` : t("account.emailNotVerified")}
                                </div>
                            )}
                            <FieldError msg={pErr.email} />
                        </div>
                        {emailChanged && (
                            <div className="field acc-wide">
                                <label htmlFor="acc-cur">{t("account.currentPasswordForEmail")}</label>
                                <input id="acc-cur" type="password" value={form.current_password} onChange={set("current_password")} autoComplete="current-password" />
                                <div className="acc-hint">{t("account.emailChangeHint")}</div>
                                <FieldError msg={pErr.current_password} />
                            </div>
                        )}
                        {isPatient && profile && (
                            <>
                                <div className="field acc-wide">
                                    <label htmlFor="acc-address">{t("account.address")}</label>
                                    <input id="acc-address" value={form.address} onChange={set("address")} maxLength={300} autoComplete="street-address" />
                                    <FieldError msg={pErr.address} />
                                </div>
                                <div className="field acc-wide">
                                    <label htmlFor="acc-emergency">{t("account.emergency")}</label>
                                    <input id="acc-emergency" value={form.emergency_contact} onChange={set("emergency_contact")} maxLength={100}
                                           placeholder={t("account.emergencyPlaceholder")} />
                                    <FieldError msg={pErr.emergency_contact} />
                                </div>
                                <div className="field">
                                    <label htmlFor="acc-gender">{t("me.gender")}</label>
                                    <select id="acc-gender" value={form.gender} onChange={set("gender")}>
                                        <option value="">{t("me.notProvided")}</option>
                                        {["M", "F", "O"].map((g) => <option key={g} value={g}>{t(`me.genderValue.${g}`)}</option>)}
                                    </select>
                                    <FieldError msg={pErr.gender} />
                                </div>
                                <div className="field">
                                    <label htmlFor="acc-dob">{t("account.birthDate")}</label>
                                    <input id="acc-dob" type="date" value={form.date_of_birth} onChange={set("date_of_birth")} disabled={dobLocked}
                                           max={new Date().toISOString().slice(0, 10)} />
                                    <div className="acc-hint">{dobLocked ? t("account.dobLocked") : t("account.dobOnce")}</div>
                                    <FieldError msg={pErr.date_of_birth} />
                                </div>
                            </>
                        )}
                    </div>
                    {pErr._ && <div className="alert-error">{pErr._}</div>}
                    {pMsg && <div className="acc-success" role="status">{pMsg}</div>}
                    <button className="btn btn-primary acc-btn" disabled={pBusy || (emailChanged && !form.current_password)}>
                        {pBusy ? t("account.saving") : t("account.save")}
                    </button>
                </form>
            </section>

            <section className="mfa-card">
                <h2>{t("account.lockedTitle")}</h2>
                <p className="mfa-muted">{isPatient ? t("account.lockedLead") : t("account.lockedLeadStaff")}</p>
                <dl className="acc-locked">
                    <dt>{t("me.fullName")}</dt><dd>{fullName}</dd>
                    <dt>{t("account.username")}</dt><dd>@{user.username}</dd>
                    {isPatient && profile && (
                        <>
                            <dt>{t("me.bloodType")}</dt><dd>{profile.blood_type || t("me.notProvided")}</dd>
                            <dt>{t("me.allergies")}</dt><dd>{profile.allergies || t("me.notProvided")}</dd>
                        </>
                    )}
                </dl>
            </section>

            <section className="mfa-card" id="password">
                <h2>{t("account.pwTitle")}</h2>
                <p className="mfa-muted">{t("account.pwLead")}</p>
                <form onSubmit={changePassword} noValidate className="acc-pw">
                    <div className="field">
                        <label htmlFor="pw-cur">{t("account.currentPassword")}</label>
                        <input id="pw-cur" type="password" value={pw.current_password} onChange={setP("current_password")} autoComplete="current-password" />
                        <FieldError msg={wErr.current_password} />
                    </div>
                    <div className="field">
                        <label htmlFor="pw-new">{t("account.newPassword")}</label>
                        <input id="pw-new" type="password" value={pw.new_password} onChange={setP("new_password")} autoComplete="new-password" />
                        <div className="acc-hint">{t("account.pwRules")}</div>
                        <FieldError msg={wErr.new_password} />
                    </div>
                    <div className="field">
                        <label htmlFor="pw-new2">{t("account.newPasswordConfirm")}</label>
                        <input id="pw-new2" type="password" value={pw.new_password_confirm} onChange={setP("new_password_confirm")} autoComplete="new-password" />
                        <FieldError msg={wErr.new_password_confirm} />
                    </div>
                    {user.mfa_enabled && (
                        <div className="field">
                            <label htmlFor="pw-code">{t("mfa.codeOrBackup")}</label>
                            <input id="pw-code" className="mfa-code-input" value={pw.code} onChange={setP("code")} maxLength={11} autoComplete="one-time-code" inputMode="numeric" />
                            <FieldError msg={wErr.code} />
                        </div>
                    )}
                    {wErr._ && <div className="alert-error">{wErr._}</div>}
                    {wMsg && <div className="acc-success" role="status">{wMsg}</div>}
                    <button className="btn btn-primary acc-btn" disabled={wBusy || !pwReady}>
                        {wBusy ? t("account.saving") : t("account.pwSubmit")}
                    </button>
                </form>
                <p className="acc-hint acc-foot">
                    {t("account.forgotHint")} <Link to="/sessions">{t("sessions.title")} →</Link>
                </p>
            </section>
        </div>
    );
}
