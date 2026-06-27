import React from "react";
import Navbar from "@/components/Navbar";
import Calculators from "@/components/Calculators";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

export default function CalculatorsPage() {
  return (
    <div className="relative" data-testid="calculators-page-root">
      <Navbar />
      <main className="pt-24">
        <Calculators />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
