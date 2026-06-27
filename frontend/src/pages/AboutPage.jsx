import React from "react";
import Navbar from "@/components/Navbar";
import About from "@/components/About";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

export default function AboutPage() {
  return (
    <div className="relative" data-testid="about-page-root">
      <Navbar />
      <main className="pt-24">
        <About />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
