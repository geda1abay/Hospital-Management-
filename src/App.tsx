import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DoctorsPage from "./pages/admin/DoctorsPage";
import PatientsPage from "./pages/admin/PatientsPage";
import DepartmentsPage from "./pages/admin/DepartmentsPage";
import ServicesPage from "./pages/admin/ServicesPage";
import BillsPage from "./pages/admin/BillsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import GeneralDoctorPage from "./pages/doctor/GeneralDoctorPage";
import GeneralDiagnosesPage from "./pages/doctor/GeneralDiagnosesPage";
import SpecialistDoctorPage from "./pages/doctor/SpecialistDoctorPage";
import SpecialistTreatmentsPage from "./pages/doctor/SpecialistTreatmentsPage";
import SpecialistBillingPage from "./pages/doctor/SpecialistBillingPage";
import LabDashboard from "./pages/laboratory/LabDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><DoctorsPage /></ProtectedRoute>} />
            <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={['admin']}><PatientsPage /></ProtectedRoute>} />
            <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['admin']}><DepartmentsPage /></ProtectedRoute>} />
            <Route path="/admin/services" element={<ProtectedRoute allowedRoles={['admin']}><ServicesPage /></ProtectedRoute>} />
            <Route path="/admin/bills" element={<ProtectedRoute allowedRoles={['admin']}><BillsPage /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><PaymentsPage /></ProtectedRoute>} />

            {/* General Doctor routes */}
            <Route path="/doctor/general" element={<ProtectedRoute allowedRoles={['general_doctor']}><GeneralDoctorPage /></ProtectedRoute>} />
            <Route path="/doctor/general/diagnoses" element={<ProtectedRoute allowedRoles={['general_doctor']}><GeneralDiagnosesPage /></ProtectedRoute>} />

            {/* Specialist Doctor routes */}
            <Route path="/doctor/specialist" element={<ProtectedRoute allowedRoles={['specialist_doctor']}><SpecialistDoctorPage /></ProtectedRoute>} />
            <Route path="/doctor/specialist/treatments" element={<ProtectedRoute allowedRoles={['specialist_doctor']}><SpecialistTreatmentsPage /></ProtectedRoute>} />
            <Route path="/doctor/specialist/billing" element={<ProtectedRoute allowedRoles={['specialist_doctor']}><SpecialistBillingPage /></ProtectedRoute>} />

            {/* Laboratory routes */}
            <Route path="/laboratory/dashboard" element={<ProtectedRoute allowedRoles={['laboratory_technician']}><LabDashboard /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
