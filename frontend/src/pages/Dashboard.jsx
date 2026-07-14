import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

function fmt(val) {
  const n = parseFloat(val);
  return isNaN(n) ? "0.00" : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InvoiceSealBadge({ type }) {
  if (type === "estimate") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">
        📋 Estimate
      </span>
    );
  }
  if (type === "pay") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700">
        💰 Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
      — Draft
    </span>
  );
}

function QuotationStatusBadge({ validUntil }) {
  const isExpired = () => {
    if (!validUntil) return false;
    try {
      const d = new Date(validUntil);
      return d < new Date();
    } catch { return false; }
  };

  if (isExpired()) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700">
        ⏰ Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">
      ✅ Active
    </span>
  );
}

function ItemListStatusBadge({ type }) {
  if (type === "packed") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-700 border border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700">
        📦 Packed
      </span>
    );
  }
  if (type === "shipped") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700">
        🚚 Shipped
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
      — Draft
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [itemLists, setItemLists] = useState([]);
  const [activeTab, setActiveTab] = useState("invoices");
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [invData, quotData, listData] = await Promise.all([
        api.getInvoices(),
        api.getQuotations(),
        api.getItemLists(),
      ]);
      setInvoices(invData || []);
      setQuotations(quotData || []);
      setItemLists(listData || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  };

  const handleDeleteClick = (type, id) => {
    setDeleteTarget({ type, id });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { type, id } = deleteTarget;
      if (type === "invoice") {
        await api.deleteInvoice(id);
        setInvoices((prev) => prev.filter((item) => item.invoiceNo !== id));
      } else if (type === "quotation") {
        await api.deleteQuotation(id);
        setQuotations((prev) => prev.filter((item) => item.quotNo !== id));
      } else if (type === "item-list") {
        await api.deleteItemList(id);
        setItemLists((prev) => prev.filter((item) => item.listNo !== id));
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(`Failed to delete ${deleteTarget.type}:`, err);
    }
  };

  const handleOpen = (type, item) => {
    if (type === "invoice") {
      navigate("/invoices/create", { state: { customer: item.customer, existingInvoice: item } });
    } else if (type === "quotation") {
      navigate("/quotations/create", { state: { customer: item.customer, existingQuotation: item } });
    } else if (type === "item-list") {
      navigate("/item-lists/create", { state: { customer: item.customer, existingList: item } });
    }
  };

  // Filter lists based on tab and search
  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceDate.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQuotations = quotations.filter(
    (quot) =>
      quot.quotNo.toLowerCase().includes(search.toLowerCase()) ||
      quot.quotDate.toLowerCase().includes(search.toLowerCase()) ||
      (quot.projectName || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredItemLists = itemLists.filter(
    (list) =>
      list.listNo.toLowerCase().includes(search.toLowerCase()) ||
      list.listDate.toLowerCase().includes(search.toLowerCase())
  );

  // Totals calculations
  const totalInvoicesValue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0);
  const totalQuotationsValue = quotations.reduce((sum, q) => sum + (parseFloat(q.grandTotal) || 0), 0);

  return (
    <section className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of recently generated billing documents and records
          </p>
        </div>
        <button
          onClick={() => navigate("/customers")}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition transform hover:scale-[1.02]"
        >
          Go to Customers
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Invoices Stat */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
            <DocumentTextIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">{invoices.length}</p>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">Rs. {fmt(totalInvoicesValue)}</p>
          </div>
        </div>

        {/* Quotations Stat */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
            <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Total Quotations</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">{quotations.length}</p>
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">Rs. {fmt(totalQuotationsValue)}</p>
          </div>
        </div>

        {/* Item Lists Stat */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center flex-shrink-0">
            <ListBulletIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Total Item Lists</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">{itemLists.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {itemLists.filter(l => l.sealType === "shipped").length} Shipped · {itemLists.filter(l => l.sealType === "packed").length} Packed
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tab buttons */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 md:border-b-0 gap-2">
            <button
              onClick={() => { setActiveTab("invoices"); setSearch(""); }}
              className={`pb-2.5 px-4 text-sm font-bold border-b-2 transition duration-200 ${
                activeTab === "invoices"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Invoices ({invoices.length})
            </button>
            <button
              onClick={() => { setActiveTab("quotations"); setSearch(""); }}
              className={`pb-2.5 px-4 text-sm font-bold border-b-2 transition duration-200 ${
                activeTab === "quotations"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Quotations ({quotations.length})
            </button>
            <button
              onClick={() => { setActiveTab("item-lists"); setSearch(""); }}
              className={`pb-2.5 px-4 text-sm font-bold border-b-2 transition duration-200 ${
                activeTab === "item-lists"
                  ? "border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Item Lists ({itemLists.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab.replace("-", " ")}...`}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full md:w-64"
            />
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="p-0">
          {/* INVOICES PANEL */}
          {activeTab === "invoices" && (
            <>
              {filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                  <DocumentTextIcon className="h-14 w-14 mb-3 opacity-20" />
                  <p className="text-base font-semibold">No invoices found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                        <th className="px-6 py-3">#</th>
                        <th className="px-6 py-3">Invoice No.</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Seal/Status</th>
                        <th className="px-6 py-3 text-right">Grand Total</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                      {filteredInvoices.map((inv, idx) => (
                        <tr key={inv.invoiceNo} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">{String(idx + 1).padStart(3, "0")}</td>
                          <td className="px-6 py-4 font-semibold font-mono text-emerald-600 dark:text-emerald-400">{inv.invoiceNo}</td>
                          <td className="px-6 py-4 text-xs">{inv.invoiceDate}</td>
                          <td className="px-6 py-4">
                            <InvoiceSealBadge type={inv.sealType} />
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-800 dark:text-white">Rs. {fmt(inv.grandTotal)}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpen("invoice", inv)}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 transition text-slate-700 dark:text-slate-200"
                              >
                                Open <ArrowRightIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick("invoice", inv.invoiceNo)}
                                className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                title="Delete"
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
            </>
          )}

          {/* QUOTATIONS PANEL */}
          {activeTab === "quotations" && (
            <>
              {filteredQuotations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                  <ClipboardDocumentListIcon className="h-14 w-14 mb-3 opacity-20" />
                  <p className="text-base font-semibold">No quotations found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                        <th className="px-6 py-3">#</th>
                        <th className="px-6 py-3">Quotation No.</th>
                        <th className="px-6 py-3">Project Name</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Grand Total</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                      {filteredQuotations.map((q, idx) => (
                        <tr key={q.quotNo} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">{String(idx + 1).padStart(3, "0")}</td>
                          <td className="px-6 py-4 font-semibold font-mono text-indigo-600 dark:text-indigo-400">{q.quotNo}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-gray-800 dark:text-white truncate max-w-[150px]">{q.projectName || "—"}</td>
                          <td className="px-6 py-4 text-xs">{q.quotDate}</td>
                          <td className="px-6 py-4">
                            <QuotationStatusBadge validUntil={q.validUntil} />
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-800 dark:text-white">Rs. {fmt(q.grandTotal)}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpen("quotation", q)}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 transition text-slate-700 dark:text-slate-200"
                              >
                                Open <ArrowRightIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick("quotation", q.quotNo)}
                                className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                title="Delete"
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
            </>
          )}

          {/* ITEM LISTS PANEL */}
          {activeTab === "item-lists" && (
            <>
              {filteredItemLists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                  <ListBulletIcon className="h-14 w-14 mb-3 opacity-20" />
                  <p className="text-base font-semibold">No item lists found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                        <th className="px-6 py-3">#</th>
                        <th className="px-6 py-3">List No.</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Items Count</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                      {filteredItemLists.map((list, idx) => (
                        <tr key={list.listNo} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">{String(idx + 1).padStart(3, "0")}</td>
                          <td className="px-6 py-4 font-semibold font-mono text-teal-600 dark:text-teal-400">{list.listNo}</td>
                          <td className="px-6 py-4 text-xs">{list.listDate}</td>
                          <td className="px-6 py-4">
                            <ItemListStatusBadge type={list.sealType} />
                          </td>
                          <td className="px-6 py-4 text-xs">{Array.isArray(list.items) ? list.items.length : 0} items</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpen("item-list", list)}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 transition text-slate-700 dark:text-slate-200"
                              >
                                Open <ArrowRightIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick("item-list", list.listNo)}
                                className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                title="Delete"
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
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-650 dark:text-red-400">
              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Confirm Delete</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this {deleteTarget.type.replace("-", " ")} ({deleteTarget.id})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition"
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
