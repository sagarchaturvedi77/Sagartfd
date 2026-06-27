import React from "react";
import Navbar from "@/components/Navbar";
import TopFunds from "@/components/TopFunds";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

export default function TopFundsPage() {
  return (
    <div className="relative" data-testid="top-funds-page-root">
      <Navbar />
      <main className="pt-24">
        <TopFunds />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
