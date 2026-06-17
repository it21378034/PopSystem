import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  UserIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

const CONTRACT_TYPES = {
  gate: { label: "Gate", icon: "🚪" },
  roof: { label: "Roof", icon: "🏠" },
  ceiling: { label: "Ceiling", icon: "🪟" },
  hand_railing: { label: "Hand Railing", icon: "🛗" },
  staircase: { label: "Staircase", icon: "🪜" },
  window_grills: { label: "Window Grills", icon: "🔲" },
  door_frames: { label: "Door Frames", icon: "🚪" },
  other: { label: "Other Contract", icon: "📋" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {customers.length > 0
              ? `${customers.length} saved customer${customers.length > 1 ? "s" : ""}`
              : "No customers yet"}
          </p>
        </div>
        <button
          onClick={() => navigate("/customers")}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
        >
          <UserPlusIcon className="h-5 w-5" />
          Add Customer
        </button>
      </div>

      {/* Customer List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Customer Records</h3>
          {customers.length > 0 && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-56"
              />
            </div>
          )}
        </div>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <UserIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No customers saved yet</p>
            <p className="text-sm mt-1">Click "Add Customer" to get started</p>
            <button
              onClick={() => navigate("/customers")}
              className="mt-5 flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition"
            >
              <UserPlusIcon className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <MagnifyingGlassIcon className="h-14 w-14 mb-3 opacity-30" />
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contracts</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((customer, idx) => (
                  <tr key={customer.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="px-6 py-4 text-gray-400 dark:text-gray-500 font-mono text-xs">
                      {String(idx + 1).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{customer.name}</p>
                          {customer.notes && (
                            <p className="text-xs text-gray-400 truncate max-w-[120px]">{customer.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{customer.phone}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-[160px]">
                      <p className="truncate" title={customer.address}>{customer.address}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {customer.contracts.map((id) => {
                          const ct = CONTRACT_TYPES[id];
                          return ct ? (
                            <span key={id} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                              {ct.icon} {ct.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate("/invoices/create", { state: { customer } })}
                          title="Create Invoice"
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/40 transition border border-green-200 dark:border-green-700"
                        >
                          <DocumentTextIcon className="h-3.5 w-3.5" />
                          Invoice
                        </button>
                        <button
                          onClick={() => navigate("/quotations/create", { state: { customer } })}
                          title="Create Quotation"
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition border border-indigo-200 dark:border-indigo-700"
                        >
                          <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
                          Quotation
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
