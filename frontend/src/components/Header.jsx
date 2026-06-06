import React from "react";
import { NavLink } from "react-router-dom";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/invoices", label: "Invoices" },
];

export default function Header() {
  const { dark, toggle } = useContext(ThemeContext);
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Vasantha Iron Works Logo" className="h-10 w-10 object-contain rounded-full bg-white p-0.5 border border-white/20" />
          <h1 className="text-2xl font-bold">Vasantha Iron Works POS</h1>
        </div>
        <nav className="space-x-4">
          {navLinks.map((lnk) => (
            <NavLink
              key={lnk.to}
              to={lnk.to}
              className={({ isActive }) =>
                `px-3 py-1 rounded ${isActive ? "bg-primary-light" : "hover:bg-primary-dark"}`
              }
            >
              {lnk.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={toggle}
          className="p-2 rounded hover:bg-primary-dark transition"
          aria-label="Toggle dark mode"
        >
          {dark ? (
            <SunIcon className="h-5 w-5 text-yellow-400" />
          ) : (
            <MoonIcon className="h-5 w-5 text-gray-200" />
          )}
        </button>
      </div>
    </header>
  );
}
