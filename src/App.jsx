import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MePage from "./pages/MePage";
import DoctorPatientsPage from "./pages/DoctorPatientsPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import "./styles/global.css";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

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
                    </Route>

                    <Route path="*" element={<Navigate to="/me" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
