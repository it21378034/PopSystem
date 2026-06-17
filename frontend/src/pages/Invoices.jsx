import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  DocumentTextIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  BanknotesIcon,
  ClockIcon,
  UserIcon,
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

function fmt(val) {
  const n = parseFloat(val);
  return isNaN(n) ? "0.00" : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SealBadge({ type }) {
  if (type === "estimate") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">
        📋 Estimate
      </span>
    );
  }
  if (type === "pay") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700">
        💰 Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
      — Draft
    </span>
  );
}

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await api.getInvoices();
      setInvoices(data);
    } catch (e) {
      console.error("Failed to load invoices:", e);
      setInvoices([]);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDeleteClick = (invoiceNo) => {
    setDeleteTarget(invoiceNo);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteInvoice(deleteTarget);
      setInvoices((prev) => prev.filter((inv) => inv.invoiceNo !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete invoice:", err);
    }
  };

  const handleOpen = (inv) => {
    // Navigate to customers page — open invoice creation with saved customer
    navigate("/invoices/create", { state: { customer: inv.customer, existingInvoice: inv } });
  };

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.invoiceNo.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q) ||
      inv.customer?.phone?.includes(q) ||
      inv.invoiceDate?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = invoices
    .filter((inv) => inv.sealType === "pay")
    .reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0);

  const estimateCount = invoices.filter((inv) => inv.sealType === "estimate").length;
  const paidCount = invoices.filter((inv) => inv.sealType === "pay").length;

  return (
    <section className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Invoices</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            All saved estimates and invoices
          </p>
        </div>
        <button
          onClick={() => navigate("/customers")}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
        >
          <DocumentTextIcon className="h-5 w-5" />
          New Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{invoices.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
            <ClockIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Estimates</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{estimateCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
            <BanknotesIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Paid Revenue</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">RS {fmt(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Invoice Records
            {invoices.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({invoices.length} {invoices.length === 1 ? "invoice" : "invoices"})
              </span>
            )}
          </h3>
          {invoices.length > 0 && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices..."
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-56"
              />
            </div>
          )}
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <DocumentTextIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No invoices saved yet</p>
            <p className="text-sm mt-1">Go to Customers and create an invoice to get started</p>
            <button
              onClick={() => navigate("/customers")}
              className="mt-5 flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition"
            >
              <UserIcon className="h-4 w-4" />
              Go to Customers
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
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice No.</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contract</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Total (RS)</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((inv, idx) => (
                  <tr key={inv.invoiceNo} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="px-6 py-4 text-gray-400 dark:text-gray-500 font-mono text-xs">
                      {String(idx + 1).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                        {inv.invoiceNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {inv.customer?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{inv.customer?.name}</p>
                          <p className="text-xs text-gray-400">{inv.customer?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(inv.customer?.contracts || []).map((id) => {
                          const ct = CONTRACT_TYPES[id];
                          return ct ? (
                            <span key={id} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                              {ct.icon} {ct.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap">
                      {inv.invoiceDate}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-800 dark:text-white whitespace-nowrap">
                      RS {fmt(inv.grandTotal)}
                    </td>
                    <td className="px-6 py-4">
                      <SealBadge type={inv.sealType} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpen(inv)}
                          title="View / Re-open invoice"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                        >
                          <ArrowRightIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(inv.invoiceNo)}
                          title="Delete invoice"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        >
                          <TrashIcon className="h-4 w-4" />
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <TrashIcon className="h-6 w-6" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Invoice?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Are you sure you want to delete invoice <span className="font-bold text-gray-800 dark:text-white">{deleteTarget}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
