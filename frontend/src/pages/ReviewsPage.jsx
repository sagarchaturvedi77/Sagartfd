import React from "react";
import Navbar from "@/components/Navbar";
import Reviews from "@/components/Reviews";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

export default function ReviewsPage() {
  return (
    <div className="relative" data-testid="reviews-page-root">
      <Navbar />
      <main className="pt-24">
        <Reviews />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
