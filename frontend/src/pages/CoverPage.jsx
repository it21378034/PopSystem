import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function CoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex flex-col items-center justify-center p-4 text-white">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-12 text-center max-w-lg w-full border border-white/20 transform transition-all hover:scale-[1.02]">
        
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="Vasantha Iron Works Logo" 
            className="h-28 w-28 md:h-36 md:w-36 object-contain rounded-full bg-white p-2 border-4 border-white/30 shadow-lg" 
          />
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
          Vasantha Iron Works
        </h1>
        <p className="text-lg md:text-xl font-light mb-8 text-white/90">
          Point of Sale Management System
        </p>

        <Link 
          to="/dashboard"
          className="inline-flex items-center space-x-2 bg-white text-primary-dark hover:bg-gray-100 font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/50"
        >
          <span>Get Started</span>
          <ArrowRightIcon className="h-5 w-5" />
        </Link>
        
      </div>
      
      <div className="absolute bottom-6 text-sm text-white/60">
        &copy; {new Date().getFullYear()} Vasantha Iron Works. All rights reserved.
      </div>
    </div>
  );
}
