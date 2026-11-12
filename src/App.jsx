import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { RouteErrorBoundary } from "./components/ErrorBoundary";
import PageLoading from "./components/PageLoading";
import lazyPage from "./lazyPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
// registry.css avval ham umumiy uslublardan oldin yuklanardi (sahifa importi orqali). Tartib saqlanadi,
// aks holda u alohida bo'lakka tushib, global.css dan keyin yuklanadi va qoidalar ustunligi o'zgaradi.
import "./styles/registry.css";
import "./styles/global.css";
import "./styles/landing.css";
import "./styles/labs.css";
import "./styles/consent.css";
import "./styles/mfa.css";
import "./styles/photo.css";
import "./styles/queue.css";

// Kirish sahifalari (bosh sahifa, login, ro'yxatdan o'tish) asosiy faylda qoladi - ular darhol ochilishi kerak.
// Qolgan sahifalar alohida bo'laklarda: foydalanuvchi faqat o'zi ochgan sahifaning kodini yuklaydi.
const MePage = lazyPage(() => import("./pages/MePage"));
const DoctorPatientsPage = lazyPage(() => import("./pages/DoctorPatientsPage"));
const PatientDetailPage = lazyPage(() => import("./pages/PatientDetailPage"));
const AdminUsersPage = lazyPage(() => import("./pages/AdminUsersPage"));
const AdminAuditLogPage = lazyPage(() => import("./pages/AdminAuditLogPage"));
const AdminAnonymizePage = lazyPage(() => import("./pages/AdminAnonymizePage"));
const ForgotPasswordPage = lazyPage(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazyPage(() => import("./pages/ResetPasswordPage"));
const QueuePage = lazyPage(() => import("./pages/QueuePage"));
const DoctorQueuePage = lazyPage(() => import("./pages/DoctorQueuePage"));
const RegistryPage = lazyPage(() => import("./pages/RegistryPage"));
const KioskPage = lazyPage(() => import("./pages/KioskPage"));
const ArrivePage = lazyPage(() => import("./pages/ArrivePage"));
const SessionsPage = lazyPage(() => import("./pages/SessionsPage"));
const SecurityPage = lazyPage(() => import("./pages/SecurityPage"));
const AccountPage = lazyPage(() => import("./pages/AccountPage"));
const AdminQueueStatsPage = lazyPage(() => import("./pages/AdminQueueStatsPage"));
const LabPage = lazyPage(() => import("./pages/LabPage"));
const AccessLogPage = lazyPage(() => import("./pages/AccessLogPage"));
const ConsentPage = lazyPage(() => import("./pages/ConsentPage"));
const AdminAlertsPage = lazyPage(() => import("./pages/AdminAlertsPage"));
const AdminKiosksPage = lazyPage(() => import("./pages/AdminKiosksPage"));

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                {/* Menyusiz sahifalar (login, kiosk, QR) uchun ham oq ekran o'rniga xabar */}
                <RouteErrorBoundary full>
                <Suspense fallback={<PageLoading />}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
                    <Route path="/kiosk" element={<KioskPage />} />
                    {/* QR skanerlanganda: kirmagan bo'lsa kodni saqlab login sahifasiga yuboradi */}
                    <Route path="/arrive" element={<ArrivePage />} />
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/me" element={<MePage />} />
                        <Route path="/sessions" element={<SessionsPage />} />
                        <Route path="/security" element={<SecurityPage />} />
                        <Route path="/account" element={<AccountPage />} />
                        <Route
                            path="/queue"
                            element={
                                <ProtectedRoute allowedRoles={["patient"]}>
                                    <QueuePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/doctor/queue"
                            element={
                                <ProtectedRoute allowedRoles={["doctor"]}>
                                    <DoctorQueuePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/queue-stats"
                            element={
                                <ProtectedRoute allowedRoles={["admin"]}>
                                    <AdminQueueStatsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/kiosks"
                            element={
                                <ProtectedRoute allowedRoles={["admin"]}>
                                    <AdminKiosksPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/alerts"
                            element={
                                <ProtectedRoute allowedRoles={["admin"]}>
                                    <AdminAlertsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-consent"
                            element={
                                <ProtectedRoute allowedRoles={["patient"]}>
                                    <ConsentPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-access"
                            element={
                                <ProtectedRoute allowedRoles={["patient"]}>
                                    <AccessLogPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/lab"
                            element={
                                <ProtectedRoute allowedRoles={["lab"]}>
                                    <LabPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/registry"
                            element={
                                <ProtectedRoute allowedRoles={["admin"]}>
                                    <RegistryPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/patients"
                            element={
                                <ProtectedRoute allowedRoles={["doctor", "admin"]}>
                                    <DoctorPatientsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/patients/:id"
                            element={
                                <ProtectedRoute allowedRoles={["doctor", "admin"]}>
                                    <PatientDetailPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/users"
                            element={
                                <ProtectedRoute allowedRoles={["admin"]}>
                                    <AdminUsersPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/audit"
                            element={
                                <ProtectedRoute allowedRoles={["admin"]}>
                                    <AdminAuditLogPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/anonymize"
                            element={
                                <ProtectedRoute allowedRoles={["admin"]}>
                                    <AdminAnonymizePage />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    <Route path="*" element={<Navigate to="/me" replace />} />
                </Routes>
                </Suspense>
                </RouteErrorBoundary>
            </AuthProvider>
        </BrowserRouter>
    );
}
