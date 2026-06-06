import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PrinterIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ListBulletIcon,
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

const EMPTY_ITEM = { category: "", description: "", qty: "", unitPrice: "", priceType: "unit" };

function generateInvoiceNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `INV-${y}${m}${d}-${rand}`;
}

function fmt(val) {
  const n = parseFloat(val);
  return isNaN(n) ? "0.00" : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CreateInvoice() {
  const location = useLocation();
  const navigate = useNavigate();
  const customer = location.state?.customer || null;
  const existingInvoice = location.state?.existingInvoice || null;
  const invoiceRef = useRef(null);

  // If reopening a saved invoice, use its data; otherwise generate fresh
  const [invoiceNo] = useState(() =>
    existingInvoice ? existingInvoice.invoiceNo : generateInvoiceNo()
  );
  const [invoiceDate] = useState(() =>
    existingInvoice
      ? existingInvoice.invoiceDate
      : new Date().toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        })
  );
  const [items, setItems] = useState(() =>
    existingInvoice ? existingInvoice.items : [{ ...EMPTY_ITEM }]
  );
  const [notes, setNotes] = useState(() =>
    existingInvoice ? existingInvoice.notes : ""
  );
  const [saved, setSaved] = useState(() => !!existingInvoice);
  const [errors, setErrors] = useState({});
  const [sealType, setSealType] = useState(() =>
    existingInvoice ? existingInvoice.sealType : "none"
  );

  // Auto-initialize first item's category with the customer's contract type on load
  useEffect(() => {
    if (customer && items.length === 1 && !items[0].category) {
      const contractLabels = customer.contracts
        .map((id) => CONTRACT_TYPES[id]?.label)
        .filter(Boolean);
      const primaryContract = contractLabels[0] || "Welding";
      setItems([{
        category: `${primaryContract} Services:`,
        description: "",
        qty: "",
        unitPrice: "",
        priceType: "unit"
      }]);
    }
  }, [customer]);

  const lineTotal = (item) => {
    const p = parseFloat(item.unitPrice) || 0;
    if (item.priceType === "liters") {
      return p;
    }
    const q = parseFloat(item.qty) || 0;
    return q * p;
  };

  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const grandTotal = subtotal;

  const handleItemChange = (idx, field, value) => {
    setItems((prev) => {
      if (field === "category") {
        return prev.map((item) => ({ ...item, category: value }));
      }
      return prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`item_${idx}_${field}`];
      return next;
    });
  };

  const addItem = () => {
    const lastCategory = items[items.length - 1]?.category || "";
    setItems((prev) => [...prev, { ...EMPTY_ITEM, category: lastCategory }]);
  };

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const errs = {};
    items.forEach((item, idx) => {
      if (!item.description.trim()) errs[`item_${idx}_description`] = "Required";
      
      if (item.priceType === "unit") {
        if (!item.qty || isNaN(parseFloat(item.qty)) || parseFloat(item.qty) <= 0) {
          errs[`item_${idx}_qty`] = "Invalid";
        }
      } else {
        if (!item.qty || !item.qty.trim()) {
          errs[`item_${idx}_qty`] = "Required";
        }
      }

      if (!item.unitPrice || isNaN(parseFloat(item.unitPrice)) || parseFloat(item.unitPrice) < 0)
        errs[`item_${idx}_unitPrice`] = "Invalid";
    });
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // Build invoice record
    const invoiceRecord = {
      id: invoiceNo,
      invoiceNo,
      invoiceDate,
      sealType,
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        contracts: customer.contracts,
        otherDetails: customer.otherDetails || "",
      },
      items: items.map((item) => ({ ...item })),
      notes,
      subtotal,
      grandTotal,
      savedAt: new Date().toISOString(),
    };

    // Persist to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem("pos_invoices") || "[]");
      // Replace if same invoice number already saved, otherwise prepend
      const idx = existing.findIndex((inv) => inv.invoiceNo === invoiceNo);
      if (idx !== -1) {
        existing[idx] = invoiceRecord;
      } else {
        existing.unshift(invoiceRecord);
      }
      localStorage.setItem("pos_invoices", JSON.stringify(existing));
    } catch (e) {
      console.error("Failed to save invoice to localStorage", e);
    }

    setSaved(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = invoiceRef.current;
      if (!element) return;

      const cleanCustomerName = (customer?.name || "Customer").replace(/[^a-zA-Z0-9]/g, "");
      const filename = `${cleanCustomerName}Project.pdf`;

      const opt = {
        margin: [0.35, 0.4, 0.35, 0.4], // Margins to fit perfectly on a single page
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2.2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff"
        },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
      };

      await html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    }
  };

  if (!customer) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-700 dark:text-white">No Customer Selected</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Please go to the Customers page and select a customer to create an invoice.
        </p>
        <button
          onClick={() => navigate("/customers")}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow hover:from-blue-800 hover:to-blue-600 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Go to Customers
        </button>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/customers")}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Back to customers"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
              <DocumentTextIcon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              Create Estimate / Invoice
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Draft #{invoiceNo} · {invoiceDate}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Document Seal Option Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner mr-1">
            <button
              onClick={() => setSealType("none")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
                sealType === "none"
                  ? "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              None
            </button>
            <button
              onClick={() => setSealType("estimate")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
                sealType === "estimate"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Estimate
            </button>
            <button
              onClick={() => setSealType("pay")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
                sealType === "pay"
                  ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Pay
            </button>
          </div>

          {saved && (
            <>
              <button
                onClick={() => navigate("/invoices")}
                className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-lg text-sm transition"
                title="View all saved invoices"
              >
                <ListBulletIcon className="h-4 w-4" />
                All Invoices
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-lg text-sm transition"
              >
                <PrinterIcon className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={handleGeneratePDF}
                className="flex items-center gap-1.5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold px-3 py-2 rounded-lg text-sm transition shadow"
              >
                <DocumentTextIcon className="h-4 w-4" />
                Generate PDF
              </button>
              <button
                onClick={() => setSaved(false)}
                className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/40 text-amber-700 dark:text-amber-400 font-semibold px-3 py-2 rounded-lg text-sm transition border border-amber-200 dark:border-amber-700"
                title="Unlock to edit this invoice"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit
              </button>
            </>
          )}
          {!saved && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 font-semibold px-4 py-2 rounded-lg text-sm shadow transition-all bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Save Estimate
            </button>
          )}
        </div>
      </div>

      {/* Real Single-Page Invoice Sheet */}
      <div
        ref={invoiceRef}
        id="invoice-print-area"
        className="relative bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 overflow-hidden font-sans p-5 sm:p-6"
      >
        {/* Header Block — Light Professional Blue */}
        <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 text-slate-800 rounded-lg p-4 sm:p-5 space-y-3 border border-blue-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Logo and Name */}
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-full shadow-sm border-2 border-blue-200 w-14 h-14 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="max-h-full max-w-full object-contain rounded-full"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <div>
                <h1 style={{ lineHeight: 1.2, margin: 0 }}>
                  {/* VASANTHA — inline layout for PDF compatibility */}
                  <span style={{ display: "inline-block", borderBottom: "2px solid #93c5fd", paddingBottom: "3px" }}>
                    <span
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: "1.6rem",
                        fontWeight: 900,
                        fontStyle: "italic",
                        color: "#1e3a5f",
                        lineHeight: 1,
                      }}
                    >
                      V
                    </span>
                    <span
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        letterSpacing: "2.5px",
                        color: "#334155",
                        textTransform: "uppercase",
                      }}
                    >
                      asantha
                    </span>
                  </span>
                  <br />
                  {/* IRON WORKS — on second line */}
                  <span
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      letterSpacing: "4px",
                      color: "#64748b",
                      textTransform: "uppercase",
                      fontStyle: "italic",
                      display: "inline-block",
                      paddingTop: "3px",
                    }}
                  >
                    Iron Works
                  </span>
                </h1>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "8px", color: "#60a5fa", letterSpacing: "2px", textTransform: "uppercase", marginTop: "4px" }}>Professional Fabrication & Installation</p>
              </div>
            </div>
            {/* Invoice Label */}
            <div className="text-left sm:text-right">
              <span className="text-blue-400 text-[9px] uppercase tracking-wider block font-semibold">Invoice Number</span>
              <span className="text-slate-700 text-base font-mono font-bold leading-none">{invoiceNo}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-blue-100"></div>

          {/* Contact Details Line */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-slate-600 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-400 font-bold">📞</span>
              <span className="font-medium">071-8658998</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-blue-400 font-bold">📍</span>
              <span className="font-medium">100/E Railway Cross Road Diyathalawa</span>
            </div>
          </div>

          {/* Estimate Info Grid Table */}
          <div className="space-y-2 pt-1">
            <h2 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
              {customer.contracts && customer.contracts.length > 0
                ? `${customer.contracts
                    .map((id) => CONTRACT_TYPES[id]?.label)
                    .filter(Boolean)
                    .join(" & ")} Work Estimate`
                : "Welding Work Estimate"}
            </h2>
            <div className="border border-blue-100 rounded-lg overflow-hidden text-xs bg-white">
              {/* Row 1: Project */}
              <div className="grid grid-cols-4 border-b border-blue-50">
                <div className="bg-blue-50/70 py-1.5 px-3 font-semibold text-slate-600 border-r border-blue-100 flex items-center">
                  Project:
                </div>
                <div className="py-1.5 px-3 col-span-3 text-slate-800 font-medium">
                  {customer.contracts
                    .map((id) => CONTRACT_TYPES[id]?.label)
                    .filter(Boolean)
                    .join(", ") || "Custom Fabrication"}
                </div>
              </div>
              {/* Row 2: Date */}
              <div className="grid grid-cols-4 border-b border-blue-50">
                <div className="bg-blue-50/70 py-1.5 px-3 font-semibold text-slate-600 border-r border-blue-100 flex items-center">
                  Date:
                </div>
                <div className="py-1.5 px-3 col-span-3 text-slate-800 font-medium">
                  {invoiceDate}
                </div>
              </div>
              {/* Row 3: To */}
              <div className="grid grid-cols-4">
                <div className="bg-blue-50/70 py-2.5 px-3 font-semibold text-slate-600 border-r border-blue-100 flex items-start">
                  To:
                </div>
                <div className="py-2.5 px-3 col-span-3 text-slate-800 space-y-1">
                  <p className="font-bold text-sm leading-tight">{customer.name}</p>
                  <p className="text-slate-500 text-xs leading-normal">{customer.address}</p>
                  <p className="text-blue-500 font-semibold text-xs pt-0.5">{customer.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Body (Line Items Table) - Compact Margins */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Estimate Line Items
            </h3>
            {!saved && (
              <button
                onClick={addItem}
                className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add Row
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {/* Rubber Stamp Seal centered inside the Table */}
            {sealType !== "none" && (
              sealType === "estimate" ? (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-8 border-double border-emerald-500 text-emerald-500 text-lg md:text-3xl font-black uppercase tracking-[0.3em] px-8 py-2.5 rounded-xl rotate-[-15deg] select-none pointer-events-none mix-blend-multiply opacity-50 shadow-[0_0_3px_rgba(16,185,129,0.3)] transition-all duration-300 whitespace-nowrap" style={{ fontFamily: "'Montserrat', sans-serif", zIndex: 50 }}>
                  Estimate
                </div>
              ) : (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-8 border-double border-rose-500 text-rose-500 text-lg md:text-3xl font-black uppercase tracking-[0.3em] px-8 py-2.5 rounded-xl rotate-[-15deg] select-none pointer-events-none mix-blend-multiply opacity-50 shadow-[0_0_3px_rgba(244,63,94,0.3)] transition-all duration-300 whitespace-nowrap" style={{ fontFamily: "'Montserrat', sans-serif", zIndex: 50 }}>
                  PAY
                </div>
              )
            )}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-blue-50 text-slate-700">
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wider w-[15%] border-r border-blue-100">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wider border-r border-blue-100">
                    Description
                  </th>
                  <th className="px-3 py-2 text-right font-bold uppercase tracking-wider w-[12%] border-r border-blue-100">
                    Quantity
                  </th>
                  <th className="px-3 py-2 text-right font-bold uppercase tracking-wider w-[18%] border-r border-blue-100">
                    Unit Price (RS)
                  </th>
                  <th className="px-3 py-2 text-right font-bold uppercase tracking-wider w-[24%]">
                    Total (RS)
                  </th>
                  {!saved && <th className="px-2 py-2 w-10 animate-fade-in"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      {/* Category */}
                      <td className="px-3 py-2 border-r border-slate-100 align-top">
                        {idx === 0 ? (
                          saved ? (
                            <span className="font-bold text-slate-800">{item.category}</span>
                          ) : (
                            <input
                              type="text"
                              value={item.category}
                              onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                              placeholder="e.g. Welding Services:"
                              className="w-full bg-transparent border-b border-dashed border-slate-200 py-0.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                            />
                          )
                        ) : (
                          <span className="text-slate-300 font-mono text-center block w-full">"</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-3 py-2 border-r border-slate-100 align-top text-slate-700">
                        {saved ? (
                          <span>{item.description}</span>
                        ) : (
                          <div>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                              placeholder="Describe product / work details..."
                              className={`w-full bg-transparent border-b border-dashed ${
                                errors[`item_${idx}_description`] ? "border-red-400" : "border-slate-200"
                              } py-0.5 text-xs focus:outline-none focus:border-slate-800`}
                            />
                            {errors[`item_${idx}_description`] && (
                              <span className="text-[9px] text-red-500 block mt-0.5">Required</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-2 text-right border-r border-slate-100 align-top text-slate-700">
                        {saved ? (
                          <span className="font-mono">
                            {item.priceType === "liters"
                              ? (item.qty.trim().toLowerCase().endsWith("l") ? item.qty.trim() : `${item.qty.trim()}L`)
                              : item.qty}
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1 items-end">
                            <input
                              type="text"
                              value={item.qty}
                              onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                              placeholder="e.g. 6L"
                              className={`w-full bg-transparent border-b border-dashed ${
                                errors[`item_${idx}_qty`] ? "border-red-400" : "border-slate-200"
                              } py-0.5 text-xs text-right focus:outline-none focus:border-slate-800`}
                            />
                            <select
                              value={item.priceType || "unit"}
                              onChange={(e) => handleItemChange(idx, "priceType", e.target.value)}
                              className="text-[9px] bg-white dark:bg-gray-700 border border-slate-200 text-slate-700 focus:outline-none cursor-pointer rounded px-0.5 py-0.5"
                            >
                              <option value="unit">Unit</option>
                              <option value="liters">Liters</option>
                            </select>
                            {errors[`item_${idx}_qty`] && (
                              <span className="text-[9px] text-red-500 block">Invalid</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Unit Price (RS) */}
                      <td className="px-3 py-2 text-right border-r border-slate-100 align-top font-mono text-slate-800">
                        {saved ? (
                          <span>RS {fmt(item.unitPrice)}</span>
                        ) : (
                          <div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                              placeholder="0.00"
                              className={`w-full bg-transparent border-b border-dashed ${
                                errors[`item_${idx}_unitPrice`] ? "border-red-400" : "border-slate-200"
                              } py-0.5 text-xs text-right focus:outline-none focus:border-slate-800`}
                            />
                            {errors[`item_${idx}_unitPrice`] && (
                              <span className="text-[9px] text-red-500 block mt-0.5">Invalid</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Total (RS) */}
                      <td className="px-3 py-2 text-right align-top font-mono text-slate-800 font-bold whitespace-nowrap">
                        <span>RS {fmt(lineTotal(item))}</span>
                      </td>

                      {/* Remove Button */}
                      {!saved && (
                        <td className="px-1 py-2 text-center align-top">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                            className="text-red-400 hover:text-red-600 transition"
                          >
                            <TrashIcon className="h-4 w-4 mx-auto" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {/* Total Estimate Highlight Row - Styled in highly professional Slate highlight */}
                <tr className="bg-blue-50 font-bold text-slate-700 text-sm">
                  <td colSpan={4} className="px-3 py-3 border-r border-slate-200">
                    Total Estimate:
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-base whitespace-nowrap">
                    RS {fmt(grandTotal)}
                  </td>
                  {!saved && <td className="px-2 py-3"></td>}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add Row underneath table when editing */}
          {!saved && (
            <button
              onClick={addItem}
              className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 hover:border-slate-400 transition flex items-center justify-center gap-1"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add another item line
            </button>
          )}
        </div>

        {/* Notes & Authorized Signature */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs">
          <div className="space-y-1.5 max-w-sm">
            <p className="font-bold text-slate-700">
              *Notes: Materials are subject to change based on market prices.
            </p>
            {saved ? (
              notes && (
                <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {notes}
                </p>
              )
            ) : (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes, special payment conditions, terms here..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 resize-none text-slate-700 placeholder-slate-400"
              />
            )}
          </div>
          <div className="text-right space-y-8 min-w-[180px] self-end">
            <p className="font-bold text-slate-800">Approved by:</p>
            <div className="border-t border-slate-400 w-40 ml-auto pt-1 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              Authorized Signature
            </div>
          </div>
        </div>

        {/* Small Footer label */}
        <div className="mt-5 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400 font-medium" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: "1px" }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: 700, color: "#475569" }}>V</span>asantha Iron Works · Professional Metal Engineering · Diyathalawa
        </div>
      </div>
    </section>
  );
}
