import "./App.css";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import EmployeeTasks from "./pages/EmployeeTasks";
// Staff Portal (Admin + Employee)
import { AuthProvider } from "./context/AuthContext";
import { CallReturnProvider } from "./context/CallReturnContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PortalLogin from "./pages/PortalLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEmployeeList from "./pages/AdminEmployeeList";
import AdminStorageStatus from "./pages/AdminStorageStatus";
import AdminProfile from "./pages/AdminProfile";
import AdminDataCleanup from "./pages/AdminDataCleanup";
import AdminCertificates from "./pages/AdminCertificates";
import AdminInvoices from "./pages/AdminInvoices";
import AdminCalculators from "./pages/AdminCalculators";
import AdminLetterheads from "./pages/AdminLetterheads";
import AdminDocumentSearch from "./pages/AdminDocumentSearch";
import AdminAttendance from "./pages/AdminAttendance";
import AdminTargets from "./pages/AdminTargets";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeAttendance from "./pages/EmployeeAttendance";
import EmployeeTargets from "./pages/EmployeeTargets";
import EmployeeSettings from "./pages/EmployeeSettings";
import AdminSettings from "./pages/AdminSettings";
import EmployeeLeads from "./pages/EmployeeLeads";
import EmployeeSalary from "./pages/EmployeeSalary";
import AdminAnnounce from "./pages/AdminAnnounce";
import AdminWebsite from "./pages/AdminWebsite";
import AdminLeads from "./pages/AdminLeads";
import AdminServices from "./pages/AdminServices";
import AdminSalary from "./pages/AdminSalary";
import AdminTasks from "./pages/AdminTasks";
import AdminReports from "./pages/AdminReports";
import AdminDocuments from "./pages/AdminDocuments";
import AdminAccounts from "./pages/AdminAccounts";
import AnalyticsTracker from "./components/AnalyticsTracker";
import WebsiteNotificationPrompt from "./components/WebsiteNotificationPrompt";
import EmployeeOnboarding from "./pages/EmployeeOnboarding";
import EmployeeProfile from "./pages/EmployeeProfile";
import EmployeeAchievements from "./pages/EmployeeAchievements";
import AdminWebsiteContent from "./pages/AdminWebsiteContent";
import AdminPipelines from "./pages/AdminPipelines";
import AdminEmployeeProfile from "./pages/AdminEmployeeProfile";
import AdminChat from "./pages/AdminChat";
import AdminLeaveManagement from "./pages/AdminLeaveManagement";
import AdminAccessControl from "./pages/AdminAccessControl";
import EmployeeCalculators from "./pages/EmployeeCalculators";
import EmployeeChat from "./pages/EmployeeChat";
import EmployeeLeaveRequest from "./pages/EmployeeLeaveRequest";
import EmployeeIDCardPage from "./pages/EmployeeIDCardPage";
import EmployeeAgreement from "./pages/EmployeeAgreement";
import PublicVerifyEmployee from "./pages/PublicVerifyEmployee";
import PublicVerify from "./pages/PublicVerify";
import InternApplicationPage from "./pages/InternApplicationPage";
import InternshipLandingPage from "./pages/InternshipLandingPage";
import InternshipSignup from "./pages/InternshipSignup";
import InternshipLogin from "./pages/InternshipLogin";
import StudentDashboard from "./pages/StudentDashboard";
import StudentMissions from "./pages/StudentMissions";
import StudentProfile from "./pages/StudentProfile";
import InternIDCardPage from "./pages/InternIDCardPage";
import StudentQuiz from "./pages/StudentQuiz";
import StudentLeaderboard from "./pages/StudentLeaderboard";
import StudentReport from "./pages/StudentReport";
import StudentCertificate from "./pages/StudentCertificate";
import PublicVerifyIntern from "./pages/PublicVerifyIntern";
import AdminInternship from "./pages/AdminInternship";
import { InternshipAuthProvider } from "./portal/student/InternshipAuthContext";
import StudentProtectedRoute from "./portal/student/StudentProtectedRoute";

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
          <ThemeProvider>
          <AuthProvider>
          <InternshipAuthProvider>
          <CallReturnProvider>
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
                {/* 👇 Ye nayi line aapko add karni hai */}
                <Route path="/calculators/:activeType" element={<CalculatorsPage />} />

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
                <Route path="/portal/forgot-password" element={<ForgotPassword />} />
                <Route path="/portal/reset-password" element={<ResetPassword />} />
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
                  path="/portal/admin/services"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminServices />
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
                  path="/portal/admin/documents"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDocuments />
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
                  path="/portal/admin/accounts"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAccounts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/pipelines"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPipelines />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/employees"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminEmployeeList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/storage"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminStorageStatus />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/profile"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/data-cleanup"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDataCleanup />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/certificates"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminCertificates />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/invoices"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminInvoices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/calculators"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminCalculators />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/letterheads"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminLetterheads />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/document-search"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDocumentSearch />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/employees/:employeeId"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminEmployeeProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/chat"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminChat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/leaves"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminLeaveManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/access"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAccessControl />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/settings"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSettings />
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
                  path="/portal/employee/tasks"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeTasks />
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
                <Route path="/portal/employee/documents" element={<Navigate to="/portal/employee/id-card" replace />} />
                <Route
                  path="/portal/employee/id-card"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeIDCardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/calculators"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeCalculators />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/chat"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeChat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/leaves"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeLeaveRequest />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portal/employee/achievements"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeAchievements />
                    </ProtectedRoute>
                  }
                />
                {/* Public verification pages — no auth needed */}
                <Route path="/verify" element={<PublicVerify />} />
                <Route path="/intern-application" element={<InternApplicationPage />} />
                <Route path="/verify/:employee_id" element={<PublicVerifyEmployee />} />
                <Route path="/verify/intern/:intern_id" element={<PublicVerifyIntern />} />

                {/* 🎓 TFD Internship — gamified 45-day program (own login,
                    fully separate from TFD Workspace staff/employee auth —
                    see portal/student/InternshipAuthContext.jsx) */}
                <Route path="/internship" element={<InternshipLandingPage />} />
                <Route path="/internship/apply" element={<InternshipSignup />} />
                <Route path="/internship/login" element={<InternshipLogin />} />
                <Route
                  path="/portal/student"
                  element={
                    <StudentProtectedRoute>
                      <StudentDashboard />
                    </StudentProtectedRoute>
                  }
                />
                <Route
                  path="/portal/student/missions"
                  element={
                    <StudentProtectedRoute>
                      <StudentMissions />
                    </StudentProtectedRoute>
                  }
                />
                <Route
                  path="/portal/student/profile"
                  element={
                    <StudentProtectedRoute>
                      <StudentProfile />
                    </StudentProtectedRoute>
                  }
                />
                <Route
                  path="/portal/student/id-card"
                  element={
                    <StudentProtectedRoute>
                      <InternIDCardPage />
                    </StudentProtectedRoute>
                  }
                />
                <Route
                  path="/portal/student/quiz"
                  element={
                    <StudentProtectedRoute>
                      <StudentQuiz />
                    </StudentProtectedRoute>
                  }
                />
                <Route
                  path="/portal/student/leaderboard"
                  element={
                    <StudentProtectedRoute>
                      <StudentLeaderboard />
                    </StudentProtectedRoute>
                  }
                />
                <Route
                  path="/portal/student/report"
                  element={
                    <StudentProtectedRoute>
                      <StudentReport />
                    </StudentProtectedRoute>
                  }
                />
                <Route
                  path="/portal/student/certificate"
                  element={
                    <StudentProtectedRoute>
                      <StudentCertificate />
                    </StudentProtectedRoute>
                  }
                />
                <Route
                  path="/portal/admin/internship"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminInternship />
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
                <Route
                  path="/portal/employee/agreement"
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <EmployeeAgreement />
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
          </CallReturnProvider>
          </InternshipAuthProvider>
          </AuthProvider>
          </ThemeProvider>
        </ModalProvider>
      </LanguageProvider>
    </div>
  );
}

export default App;
