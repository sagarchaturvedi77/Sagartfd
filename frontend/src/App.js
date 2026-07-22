import "./App.css";
import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ModalProvider } from "./context/ModalContext";
import { LanguageProvider } from "./context/LanguageContext";
// Staff Portal (Admin + Employee)
import { AuthProvider } from "./context/AuthContext";
import { CallReturnProvider } from "./context/CallReturnContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AnalyticsTracker from "./components/AnalyticsTracker";
import WebsiteNotificationPrompt from "./components/WebsiteNotificationPrompt";
import { InternshipAuthProvider } from "./portal/student/InternshipAuthContext";
import StudentProtectedRoute from "./portal/student/StudentProtectedRoute";


// React Router does NOT reset scroll position on navigation the way a full
// page load does — clicking a footer/nav link that changes the route left
// the viewport wherever it already was (e.g. still at the footer), forcing
// a manual scroll-up to see the new page. If the URL carries a hash
// (`/#about`), scroll to that element instead of the top.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);
  return null;
}

function RouteLoadingFallback() {
  return (
    <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid #E2D8C2",
          borderTopColor: "#024396",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </div>
  );
}


// Route-level code splitting — each page is its own chunk, only
// downloaded when a visitor actually navigates there. A public-site
// visitor never triggers the Admin/Employee/Student portal chunks at all.
const Home = lazy(() => import("./pages/Home"));
const CareerPage = lazy(() => import("./pages/CareerPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CalculatorsPage = lazy(() => import("./pages/CalculatorsPage"));
const TopFundsPage = lazy(() => import("./pages/TopFundsPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const EducationPortal = lazy(() => import("./pages/EducationPortal"));
const EmployeeTasks = lazy(() => import("./pages/EmployeeTasks"));
const PortalLogin = lazy(() => import("./pages/PortalLogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminEmployeeList = lazy(() => import("./pages/AdminEmployeeList"));
const AdminStorageStatus = lazy(() => import("./pages/AdminStorageStatus"));
const AdminProfile = lazy(() => import("./pages/AdminProfile"));
const AdminDataCleanup = lazy(() => import("./pages/AdminDataCleanup"));
const AdminCertificates = lazy(() => import("./pages/AdminCertificates"));
const AdminInvoices = lazy(() => import("./pages/AdminInvoices"));
const AdminCalculators = lazy(() => import("./pages/AdminCalculators"));
const AdminLetterheads = lazy(() => import("./pages/AdminLetterheads"));
const AdminDocumentSearch = lazy(() => import("./pages/AdminDocumentSearch"));
const AdminAttendance = lazy(() => import("./pages/AdminAttendance"));
const AdminTargets = lazy(() => import("./pages/AdminTargets"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const EmployeeAttendance = lazy(() => import("./pages/EmployeeAttendance"));
const EmployeeTargets = lazy(() => import("./pages/EmployeeTargets"));
const EmployeeSettings = lazy(() => import("./pages/EmployeeSettings"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const EmployeeLeads = lazy(() => import("./pages/EmployeeLeads"));
const EmployeeSalary = lazy(() => import("./pages/EmployeeSalary"));
const AdminAnnounce = lazy(() => import("./pages/AdminAnnounce"));
const AdminWebsite = lazy(() => import("./pages/AdminWebsite"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminServices = lazy(() => import("./pages/AdminServices"));
const AdminSalary = lazy(() => import("./pages/AdminSalary"));
const AdminTasks = lazy(() => import("./pages/AdminTasks"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminDocuments = lazy(() => import("./pages/AdminDocuments"));
const AdminAccounts = lazy(() => import("./pages/AdminAccounts"));
const EmployeeOnboarding = lazy(() => import("./pages/EmployeeOnboarding"));
const EmployeeProfile = lazy(() => import("./pages/EmployeeProfile"));
const EmployeeAchievements = lazy(() => import("./pages/EmployeeAchievements"));
const AdminWebsiteContent = lazy(() => import("./pages/AdminWebsiteContent"));
const AdminPipelines = lazy(() => import("./pages/AdminPipelines"));
const AdminEmployeeProfile = lazy(() => import("./pages/AdminEmployeeProfile"));
const AdminChat = lazy(() => import("./pages/AdminChat"));
const AdminLeaveManagement = lazy(() => import("./pages/AdminLeaveManagement"));
const AdminAccessControl = lazy(() => import("./pages/AdminAccessControl"));
const EmployeeCalculators = lazy(() => import("./pages/EmployeeCalculators"));
const EmployeeChat = lazy(() => import("./pages/EmployeeChat"));
const EmployeeLeaveRequest = lazy(() => import("./pages/EmployeeLeaveRequest"));
const EmployeeIDCardPage = lazy(() => import("./pages/EmployeeIDCardPage"));
const EmployeeAgreement = lazy(() => import("./pages/EmployeeAgreement"));
const PublicVerifyEmployee = lazy(() => import("./pages/PublicVerifyEmployee"));
const PublicVerify = lazy(() => import("./pages/PublicVerify"));
const InternApplicationPage = lazy(() => import("./pages/InternApplicationPage"));
const InternshipLandingPage = lazy(() => import("./pages/InternshipLandingPage"));
const InternshipTrackPage = lazy(() => import("./pages/InternshipTrackPage"));
const InternshipResumePayment = lazy(() => import("./pages/InternshipResumePayment"));
const InternshipSignup = lazy(() => import("./pages/InternshipSignup"));
const InternshipLogin = lazy(() => import("./pages/InternshipLogin"));
const InternshipForgotPassword = lazy(() => import("./pages/InternshipForgotPassword"));
const InternshipResetPassword = lazy(() => import("./pages/InternshipResetPassword"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const StudentOnboarding = lazy(() => import("./pages/StudentOnboarding"));
const StudentMissions = lazy(() => import("./pages/StudentMissions"));
const TaskWorkspace = lazy(() => import("./pages/TaskWorkspace"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const InternIDCardPage = lazy(() => import("./pages/InternIDCardPage"));
const StudentQuiz = lazy(() => import("./pages/StudentQuiz"));
const StudentStudyMaterial = lazy(() => import("./pages/StudentStudyMaterial"));
const StudentMailbox = lazy(() => import("./pages/StudentMailbox"));
const StudentConnect = lazy(() => import("./pages/StudentConnect"));
const StudentLeaderboard = lazy(() => import("./pages/StudentLeaderboard"));
const StudentReport = lazy(() => import("./pages/StudentReport"));
const StudentCertificate = lazy(() => import("./pages/StudentCertificate"));
const StudentContentStudio = lazy(() => import("./pages/StudentContentStudio"));
const PublicVerifyIntern = lazy(() => import("./pages/PublicVerifyIntern"));
const AdminInternship = lazy(() => import("./pages/AdminInternship"));
const AdminInternshipContent = lazy(() => import("./pages/AdminInternshipContent"));
const PublicBlog = lazy(() => import("./pages/PublicBlog"));
const PublicFAQ = lazy(() => import("./pages/PublicFAQ"));
const TermInsurancePage = lazy(() => import("./pages/TermInsurancePage"));
const HealthInsurancePage = lazy(() => import("./pages/HealthInsurancePage"));
const MotorInsurancePage = lazy(() => import("./pages/MotorInsurancePage"));
const PartnerPage = lazy(() => import("./pages/PartnerPage"));

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
              <ScrollToTop />
              <AnalyticsTracker />
              <WebsiteNotificationPrompt />
              <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                {/* 🏠 Main Homepage */}
                <Route path="/" element={<Home />} />

                {/* 🎯 Career & Hiring Page */}
                <Route path="/career" element={<CareerPage />} />

                {/* 👤 About TFD Section */}
                <Route path="/about" element={<AboutPage />} />

                {/* 📘 Financial Education (extracted off the homepage) */}
                <Route path="/learn" element={<LearnPage />} />

                {/* 🔍 Sitewide FAQ + blog search */}
                <Route path="/search" element={<SearchPage />} />

                {/* 🧮 Calculators */}
                <Route path="/calculators" element={<CalculatorsPage />} />
                {/* 👇 Ye nayi line aapko add karni hai */}
                <Route path="/calculators/:activeType" element={<CalculatorsPage />} />

                {/* 📈 Top Funds */}
                <Route path="/top-funds" element={<TopFundsPage />} />

                {/* 🛠️ Services */}
                <Route path="/services" element={<ServicesPage />} />

                {/* ✍️ Blog + FAQ — written by TFD Internship students, admin-approved */}
                <Route path="/blog" element={<PublicBlog />} />
                <Route path="/blog/:contentId" element={<PublicBlog />} />
                <Route path="/faq" element={<PublicFAQ />} />

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

                {/* 🎓 TFD Internship — gamified 90-day program (own login,
                    fully separate from TFD Workspace staff/employee auth —
                    see portal/student/InternshipAuthContext.jsx) */}
                <Route path="/internship" element={<InternshipLandingPage />} />
                <Route path="/internship/tracks/:trackId" element={<InternshipTrackPage />} />
                <Route path="/internship/resume-payment/:token" element={<InternshipResumePayment />} />
                <Route path="/internship/apply" element={<InternshipSignup />} />
                <Route path="/internship/login" element={<InternshipLogin />} />
                <Route path="/internship/forgot-password" element={<InternshipForgotPassword />} />
                <Route path="/internship/reset-password" element={<InternshipResetPassword />} />
                <Route
                  path="/portal/student/onboarding"
                  element={
                    <StudentProtectedRoute skipOnboardingGate>
                      <StudentOnboarding />
                    </StudentProtectedRoute>
                  }
                />
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
                  path="/portal/student/task/:taskId"
                  element={
                    <StudentProtectedRoute>
                      <TaskWorkspace />
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
                  path="/portal/student/study-material"
                  element={
                    <StudentProtectedRoute>
                      <StudentStudyMaterial />
                    </StudentProtectedRoute>
                  }
                />
                <Route
                  path="/portal/student/mailbox"
                  element={
                    <StudentProtectedRoute>
                      <StudentMailbox />
                    </StudentProtectedRoute>
                  }
                />
                <Route
                  path="/portal/student/connect"
                  element={
                    <StudentProtectedRoute>
                      <StudentConnect />
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
                  path="/portal/student/content-studio"
                  element={
                    <StudentProtectedRoute>
                      <StudentContentStudio />
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
                  path="/portal/admin/internship/content"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminInternshipContent />
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

                {/* Last-resort safety net: any URL that doesn't match a
                    route above (a mistyped/old/unlisted link _redirects
                    doesn't know about) sends the visitor Home instead of
                    rendering a blank page — the exact failure mode behind
                    the /about-us/ bug report. */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </Suspense>
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
