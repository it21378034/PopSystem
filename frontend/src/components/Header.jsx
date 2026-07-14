import React, { useState, useContext } from "react";
import { NavLink } from "react-router-dom";
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ThemeContext } from "../context/ThemeContext";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/quotations/create", label: "Quotation" },
  { to: "/invoices", label: "Invoices" },
  { to: "/item-lists", label: "Item Lists" },
];

export default function Header() {
  const { dark, toggle } = useContext(ThemeContext);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Vasantha Iron Works Logo" className="h-10 w-10 object-contain rounded-full bg-white p-0.5 border border-white/20" />
          <h1 className="text-xl md:text-2xl font-bold">Vasantha Iron Works POS</h1>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-4">
          <nav className="space-x-4">
            {navLinks.map((lnk) => (
              <NavLink
                key={lnk.to}
                to={lnk.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded ${isActive ? "bg-primary-light" : "hover:bg-primary-dark"}`
                }
              >
                {lnk.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={toggle}
            className="p-2 rounded hover:bg-primary-dark transition ml-4"
            aria-label="Toggle dark mode"
          >
            {dark ? (
              <SunIcon className="h-5 w-5 text-yellow-400" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-200" />
            )}
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center md:hidden">
          <button
            onClick={toggle}
            className="p-2 rounded hover:bg-primary-dark transition mr-2"
            aria-label="Toggle dark mode"
          >
            {dark ? (
              <SunIcon className="h-5 w-5 text-yellow-400" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-200" />
            )}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 focus:outline-none">
            {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden bg-primary-dark border-t border-primary px-4 py-2 space-y-2 pb-4">
          {navLinks.map((lnk) => (
            <NavLink
              key={lnk.to}
              to={lnk.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded ${isActive ? "bg-primary-light font-bold" : "hover:bg-primary/50"}`
              }
            >
              {lnk.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
