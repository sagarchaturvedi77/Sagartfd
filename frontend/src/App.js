import "./App.css";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CareerPage from "./pages/CareerPage"; 
import { Toaster } from "sonner";
import { ModalProvider } from "./context/ModalContext"; 

// 🩺 TEMPORARY PLACEHOLDERS (Design ready hone par inhe alag files me daal denge)
const AboutPage = () => <div className="min-h-screen bg-[#FBF7EE] p-20 text-center text-3xl font-serif">About TFD Team (Coming Soon)</div>;
const TermInsurancePage = () => <div className="min-h-screen bg-[#FBF7EE] p-20 text-center text-3xl font-serif">Term Insurance Solutions (Coming Soon)</div>;
const HealthInsurancePage = () => <div className="min-h-screen bg-[#FBF7EE] p-20 text-center text-3xl font-serif">Health Insurance (Mediclaim) (Coming Soon)</div>;
const MotorInsurancePage = () => <div className="min-h-screen bg-[#FBF7EE] p-20 text-center text-3xl font-serif">Motor (Car/Bike) Insurance (Coming Soon)</div>;
const PartnerPage = () => <div className="min-h-screen bg-[#FBF7EE] p-20 text-center text-3xl font-serif">Partner With TFD Team (Coming Soon)</div>;

// 🧮 UNIFIED CALCULATOR ROUTE (Har calculator link direct isi single page pr aayegi)
const CalculatorsPage = () => <div className="min-h-screen bg-[#FBF7EE] p-20 text-center text-3xl font-serif">TFD All-in-One Money Calculators (Coming Soon)</div>;

function App() {
  return (
    <div className="App">
      <ModalProvider> 
        <BrowserRouter>
          <Routes>
            {/* 🏠 Main Homepage */}
            <Route path="/" element={<Home />} />
            
            {/* 🎯 Career & Hiring Page */}
            <Route path="/career" element={<CareerPage />} />

            {/* 👤 About TFD Section */}
            <Route path="/about" element={<AboutPage />} />

            {/* 🧮 Single Unified Calculators Page (Handle all traffic) */}
            <Route path="/calculators" element={<CalculatorsPage />} />

            {/* 💼 Insurance Categories */}
            <Route path="/term-insurance" element={<TermInsurancePage />} />
            <Route path="/health-insurance" element={<HealthInsurancePage />} />
            <Route path="/motor-insurance" element={<MotorInsurancePage />} />

            {/* 👥 Partnership Onboarding */}
            <Route path="/partner-with-us" element={<PartnerPage />} />
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
      </ModalProvider>
    </div>
  );
}

export default App;
