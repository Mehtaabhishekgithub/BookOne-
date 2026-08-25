import React from "react";
import { Calendar, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="font-heading font-bold text-white text-lg tracking-tight">BookOne</span>
              <p className="text-xs text-slate-400">SaaS Booking & Automated Invoicing Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="https://github.com/Mehtaabhishekgithub/BookOne-" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GitHub Repository
            </a>
            <span className="text-slate-700">•</span>
            <span>PostgreSQL / MySQL + Prisma</span>
            <span className="text-slate-700">•</span>
            <span>Clerk + Stripe + PDFKit</span>
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for high-scale SaaS teams.
          </p>
        </div>
      </div>
    </footer>
  );
};
