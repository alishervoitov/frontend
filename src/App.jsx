import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MePage from "./pages/MePage";
import DoctorPatientsPage from "./pages/DoctorPatientsPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminAuditLogPage from "./pages/AdminAuditLogPage";
import "./styles/global.css";
import AdminAnonymizePage from "./pages/AdminAnonymizePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/me" element={<MePage />} />
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
            </AuthProvider>
        </BrowserRouter>
    );
}
