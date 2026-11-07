import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { RouteErrorBoundary } from "./components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MePage from "./pages/MePage";
import DoctorPatientsPage from "./pages/DoctorPatientsPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminAuditLogPage from "./pages/AdminAuditLogPage";
import "./styles/global.css";
import "./styles/landing.css";
import AdminAnonymizePage from "./pages/AdminAnonymizePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import QueuePage from "./pages/QueuePage";
import DoctorQueuePage from "./pages/DoctorQueuePage";
import RegistryPage from "./pages/RegistryPage";
import KioskPage from "./pages/KioskPage";
import ArrivePage from "./pages/ArrivePage";
import SessionsPage from "./pages/SessionsPage";
import SecurityPage from "./pages/SecurityPage";
import AdminQueueStatsPage from "./pages/AdminQueueStatsPage";
import LabPage from "./pages/LabPage";
import AccessLogPage from "./pages/AccessLogPage";
import ConsentPage from "./pages/ConsentPage";
import AdminAlertsPage from "./pages/AdminAlertsPage";
import AdminKiosksPage from "./pages/AdminKiosksPage";
import "./styles/labs.css";
import "./styles/consent.css";
import "./styles/mfa.css";
import "./styles/photo.css";
import "./styles/queue.css";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                {/* Menyusiz sahifalar (login, kiosk, QR) uchun ham oq ekran o'rniga xabar */}
                <RouteErrorBoundary full>
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
                </RouteErrorBoundary>
            </AuthProvider>
        </BrowserRouter>
    );
}
