import React from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Education from "@/components/Education";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

export default function LearnPage() {
  return (
    <div className="relative" data-testid="learn-page-root">
      <SEO
        title="The Financial Doctor | Learn Before You Invest — Mutual Fund Basics"
        description="Free financial education from Sagar Chaturvedi — mutual funds, SIP, lumpsum vs SWP, and why insurance comes before investing. Simple explanations in English, Hindi & Hinglish."
        keywords="mutual fund basics, what is SIP, lumpsum vs SWP, financial education India, learn mutual funds, financial literacy"
        path="/learn"
      />
      <Navbar />
      <main className="pt-24">
        <Education />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
