import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

export default function PageLayout({ testId, children }) {
    return (
        <div className="relative" data-testid={testId}>
            <Navbar />
            <main className="pt-24">{children}</main>
            <Footer />
            <FloatingActions />
        </div>
    );
}
