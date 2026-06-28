import "./App.css";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CareerPage from "./pages/CareerPage";
import AboutPage from "./pages/AboutPage";
import CalculatorsPage from "./pages/CalculatorsPage";
import TopFundsPage from "./pages/TopFundsPage";
import ServicesPage from "./pages/ServicesPage";
import ReviewsPage from "./pages/ReviewsPage";
import ContactPage from "./pages/ContactPage";
import { Toaster } from "sonner";
import { ModalProvider } from "./context/ModalContext";
import { LanguageProvider } from "./context/LanguageContext";
import EducationPortal from './pages/EducationPortal';

// Staff Portal (Admin + Employee)
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PortalLogin from "./pages/PortalLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAttendance from "./pages/AdminAttendance";
import AdminTargets from "./pages/AdminTargets";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeAttendance from "./pages/EmployeeAttendance";
import EmployeeTargets from "./pages/EmployeeTargets";
import EmployeeSettings from "./pages/EmployeeSettings";
import EmployeeLeads from "./pages/EmployeeLeads";
import EmployeeSalary from "./pages/EmployeeSalary";
import AdminAnnounce from "./pages/AdminAnnounce";
import AdminWebsite from "./pages/AdminWebsite";
import AdminLeads from "./pages/AdminLeads";
import AdminSalary from "./pages/AdminSalary";
import AdminTasks from "./pages/AdminTasks";
import AdminReports from "./pages/AdminReports";
import AnalyticsTracker from "./components/AnalyticsTracker";
import WebsiteNotificationPrompt from "./components/WebsiteNotificationPrompt";
import EmployeeOnboarding from "./pages/EmployeeOnboarding";
import EmployeeIDCard from "./pages/EmployeeIDCard";
import EmployeeProfile from "./pages/EmployeeProfile";
import AdminWebsiteContent from "./pages/AdminWebsiteContent";

// 🩺 TEMPORARY PLACEHOLDERS (Design ready hone par inhe alag files me daal denge)
const TermInsurancePage = () => <div className="min-h-screen bg-[#FBF7EE] p-20 text-center text-3xl font-serif">Term Insurance Solutions (Coming Soon)</div>;
const HealthInsurancePage = () => <div className="min-h-screen bg-[#FBF7EE] p-20 text-center text-3xl font-serif">Health Insurance (Mediclaim) (Coming Soon)</div>;
const MotorInsurancePage = () => <div className="min-h-screen bg-[#FBF7EE] p-20 text-center text-3xl font-serif">Motor (Car/Bike) Insurance (Coming Soon)</div>;
const PartnerPage = () => <div className="min-h-screen bg-[#FBF7EE] p-20 text-center text-3xl font-serif">Partner With TFD Team (Coming Soon)</div>;

function App() {
  return (
    <div className="App">
      <LanguageProvider>
        <ModalProvider>
          <AuthProvider>
            <BrowserRouter>
              <AnalyticsTracker />
              <WebsiteNotificationPrompt />
              <Routes>
                {/* 🏠 Main Homepage */}
                <Route path="/" element={<Home />} />

                {/* 🎯 Career & Hiring Page */}
                <Route path="/career" element={<CareerPage />} />

                {/* 👤 About TFD Section */}
                <Route path="/about" element={<AboutPage />} />

                {/* 🧮 Calculators */}
                <Route path="/calculators" element={<CalculatorsPage />} />

                {/* 📈 Top Funds */}
                <Route path="/top-funds" element={<TopFundsPage />} />

                {/* 🛠️ Services */}
                <Route path="/services" element={<ServicesPage />} />

                {/* ⭐ Reviews */}
                <Route path="/reviews" element={<ReviewsPage />} />

                {/* 📞 Contact */}
                <Route path="/contact" element={<ContactPage />} />

                {/* 💼 Insurance Categories */}
                <Route path="/term-insurance" element={<TermInsurancePage />} />
                <Route path="/health-insurance" element={<HealthInsurancePage />} />
                <Route path="/motor-insurance" element={<MotorInsurancePage />} />

                <Route path="/research-learning-hub" element={<EducationPortal />} />

                {/* 👥 Partnership Onboarding */}
                <Route path="/partner-with-us" element={<PartnerPage />} />

                {/* 🔐 STAFF PORTAL — Admin + Employee */}
                <Route path="/portal/login" element={<PortalLogin />} />
                <Route
                  path="/portal/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/attendance"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAttendance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/targets"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminTargets />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/leads"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminLeads />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/website"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminWebsite />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/salary"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSalary />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/tasks"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminTasks />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/reports"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/announce"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAnnounce />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/attendance"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeAttendance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/targets"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeTargets />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/salary"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeSalary />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/leads"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeLeads />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/settings"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/onboarding"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeOnboarding />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/documents"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeIDCard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/profile"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/website-content"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminWebsiteContent />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
            <Toaster
              position="bottom-center"
              toastOptions={{
                style: {
                  background: "#0E1B2C",
                  color: "#F6F1E8",
                  border: "1px solid #2A364B",
                  fontFamily: "'DM Sans', sans-serif",
                },
              }}
            />
          </AuthProvider>
        </ModalProvider>
      </LanguageProvider>
    </div>
  );
}

export default App;
