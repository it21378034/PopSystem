import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DocumentTextIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ClockIcon,
  UserIcon,
  CurrencyRupeeIcon,
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

function isExpired(validUntil) {
  if (!validUntil) return false;
  try {
    // Parse dd Mon yyyy format
    const d = new Date(validUntil);
    return d < new Date();
  } catch { return false; }
}

function StatusBadge({ quot }) {
  if (isExpired(quot.validUntil)) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700">⏰ Expired</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">✅ Active</span>;
}

export default function Quotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("pos_quotations") || "[]");
      setQuotations(stored);
    } catch (e) {
      console.error("Failed to load quotations:", e);
      setQuotations([]);
    }
  }, []);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDeleteClick = (quotNo) => {
    setDeleteTarget(quotNo);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = quotations.filter(q => q.quotNo !== deleteTarget);
    setQuotations(updated);
    localStorage.setItem("pos_quotations", JSON.stringify(updated));
    setDeleteTarget(null);
  };

  const handleOpen = (quot) => {
    navigate("/quotations/create", { state: { customer: quot.customer, existingQuotation: quot } });
  };

  const filtered = quotations.filter(q => {
    const s = search.toLowerCase();
    return (
      q.quotNo?.toLowerCase().includes(s) ||
      q.customer?.name?.toLowerCase().includes(s) ||
      q.customer?.phone?.includes(s) ||
      q.projectName?.toLowerCase().includes(s)
    );
  });

  const totalValue = quotations.reduce((sum, q) => sum + (parseFloat(q.grandTotal) || 0), 0);
  const activeCount = quotations.filter(q => !isExpired(q.validUntil)).length;
  const expiredCount = quotations.filter(q => isExpired(q.validUntil)).length;

  return (
    <section className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Quotations</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">All saved project quotations</p>
        </div>
        <button
          onClick={() => navigate("/customers")}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-900 to-indigo-700 hover:from-indigo-800 hover:to-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
        >
          <DocumentTextIcon className="h-5 w-5" />
          New Quotation
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
            <DocumentTextIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Quotations</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{quotations.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
            <ClockIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Active</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
            <CurrencyRupeeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Quoted Value</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">RS {fmt(totalValue)}</p>
          </div>
        </div>
      </div>

      {/* Quotation List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Quotation Records
            {quotations.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({quotations.length} {quotations.length === 1 ? "quotation" : "quotations"})
              </span>
            )}
          </h3>
          {quotations.length > 0 && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search quotations..."
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition w-56"
              />
            </div>
          )}
        </div>

        {quotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <DocumentTextIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No quotations saved yet</p>
            <p className="text-sm mt-1">Go to Customers and click "Create Quotation" to get started</p>
            <button
              onClick={() => navigate("/customers")}
              className="mt-5 flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition"
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
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quot No.</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valid Until</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Total (RS)</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((quot, idx) => (
                  <tr key={quot.quotNo} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="px-6 py-4 text-gray-400 dark:text-gray-500 font-mono text-xs">
                      {String(idx + 1).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                        {quot.quotNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {quot.customer?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{quot.customer?.name}</p>
                          <p className="text-xs text-gray-400">{quot.customer?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs max-w-[140px]">
                      <p className="truncate font-medium" title={quot.projectName}>{quot.projectName || "—"}</p>
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {(quot.customer?.contracts || []).slice(0, 2).map(id => {
                          const ct = CONTRACT_TYPES[id];
                          return ct ? <span key={id} className="text-[9px] text-indigo-500">{ct.icon}</span> : null;
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap">
                      {quot.validUntil}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-800 dark:text-white whitespace-nowrap">
                      RS {fmt(quot.grandTotal)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge quot={quot} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpen(quot)}
                          title="View / Re-open quotation"
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        >
                          <ArrowRightIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(quot.quotNo)}
                          title="Delete quotation"
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Quotation?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Are you sure you want to delete quotation <span className="font-bold text-gray-800 dark:text-white">{deleteTarget}</span>? This action cannot be undone.
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
