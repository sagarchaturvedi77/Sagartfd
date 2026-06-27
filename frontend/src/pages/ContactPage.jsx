import React from "react";
import Navbar from "@/components/Navbar";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

export default function ContactPage() {
  return (
    <div className="relative" data-testid="contact-page-root">
      <Navbar />
      <main className="pt-24">
        <Contact />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
