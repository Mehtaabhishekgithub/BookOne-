import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar.js";
import { Footer } from "./components/Footer.js";
import { HomePage } from "./pages/HomePage.js";
import { PublicBookingPage } from "./pages/PublicBookingPage.js";
import { BookingSuccessPage } from "./pages/BookingSuccessPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";

export function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/p/:handle" element={<PublicBookingPage />} />
            <Route path="/booking/success" element={<BookingSuccessPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
