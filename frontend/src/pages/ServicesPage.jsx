import React from "react";
import Navbar from "@/components/Navbar";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

export default function ServicesPage() {
  return (
    <div className="relative" data-testid="services-page-root">
      <Navbar />
      <main className="pt-24">
        <Services />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
