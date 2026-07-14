import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PrinterIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ListBulletIcon,
  ArrowDownTrayIcon,
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

// Packaging list items only need category, description, qty
const EMPTY_ITEM = { category: "", description: "", qty: "" };

function generateListNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `PKG-${y}${m}${d}-${rand}`;
}

export default function CreatePackagingList() {
  const location = useLocation();
  const navigate = useNavigate();
  const customer = location.state?.customer || null;
  const existingList = location.state?.existingList || null;
  const listRef = useRef(null);

  const [listNo] = useState(() =>
    existingList ? existingList.listNo : generateListNo()
  );
  const [listDate] = useState(() =>
    existingList
      ? existingList.listDate
      : new Date().toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        })
  );
  const [items, setItems] = useState(() =>
    existingList ? existingList.items : [{ ...EMPTY_ITEM }]
  );
  const [notes, setNotes] = useState(() =>
    existingList ? existingList.notes : ""
  );
  const [saved, setSaved] = useState(() => !!existingList);
  const [errors, setErrors] = useState({});
  const [sealType, setSealType] = useState(() =>
    existingList ? existingList.sealType : "none"
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
      }]);
    }
  }, [customer]);

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
    });
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const listRecord = {
      listNo,
      listDate,
      sealType,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        contracts: customer.contracts,
        otherDetails: customer.otherDetails || "",
      },
      items: items.map((item) => ({ ...item })),
      notes,
    };

    try {
      if (existingList) {
        await api.updatePackagingList(listNo, listRecord);
      } else {
        await api.createPackagingList(listRecord);
      }
      setSaved(true);
    } catch (e) {
      console.error("Failed to save packaging list to database", e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = listRef.current;
      if (!element) return;

      const cleanCustomerName = (customer?.name || "Customer").replace(/[^a-zA-Z0-9]/g, "");
      const filename = `${cleanCustomerName}_PackagingList.pdf`;

      const opt = {
        margin: [0.35, 0.4, 0.35, 0.4],
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2.2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 1024
        },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
      };

      element.classList.add("pdf-exporting");
      await html2pdf().from(element).set(opt).save();
      element.classList.remove("pdf-exporting");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      listRef.current?.classList.remove("pdf-exporting");
    }
  };

  if (!customer) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-700 dark:text-white">No Customer Selected</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Please go to the Customers page and select a customer to create a packaging list.
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
              <DocumentTextIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Create Packaging List
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Draft #{listNo} · {listDate}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Seal Selector */}
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
              onClick={() => setSealType("packed")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
                sealType === "packed"
                  ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Packed
            </button>
            <button
              onClick={() => setSealType("shipped")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
                sealType === "shipped"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Shipped
            </button>
          </div>

          {saved && (
            <>
              <button
                onClick={() => navigate("/packaging-lists")}
                className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-lg text-sm transition"
                title="View all packaging lists"
              >
                <ListBulletIcon className="h-4 w-4" />
                All Lists
              </button>
              <button
                onClick={() => setSaved(false)}
                className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/40 text-amber-700 dark:text-amber-400 font-semibold px-3 py-2 rounded-lg text-sm transition border border-amber-200 dark:border-amber-700"
                title="Unlock to edit"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit
              </button>
            </>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-lg text-sm transition"
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleGeneratePDF}
            className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-lg text-sm transition"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download PDF
          </button>

          {!saved && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 font-semibold px-4 py-2 rounded-lg text-sm shadow transition-all bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-600 hover:to-teal-800 text-white"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Save List
            </button>
          )}
        </div>
      </div>

      {/* Packaging List Document */}
      <div
        ref={listRef}
        id="packaging-list-print-area"
        className="relative bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 overflow-hidden font-sans p-5 sm:p-6"
      >
        {/* Header Block */}
        <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-slate-50 text-slate-800 rounded-lg p-4 sm:p-5 space-y-3 border border-teal-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Logo and Name */}
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-full shadow-sm border-2 border-teal-200 w-14 h-14 flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                  <span style={{ display: "inline-block", borderBottom: "2px solid #5eead4", paddingBottom: "3px" }}>
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
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "8px", color: "#2dd4bf", letterSpacing: "2px", textTransform: "uppercase", marginTop: "4px" }}>Professional Fabrication &amp; Installation</p>
              </div>
            </div>
            {/* Packaging List Label */}
            <div className="text-left sm:text-right">
              <span className="text-teal-500 text-[9px] uppercase tracking-wider block font-semibold">Packaging List No.</span>
              <span className="text-slate-700 text-base font-mono font-bold leading-none">{listNo}</span>
              {sealType !== "none" && (
                <span className={`mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  sealType === "packed"
                    ? "bg-teal-100 text-teal-700 border-teal-300"
                    : "bg-blue-100 text-blue-700 border-blue-300"
                }`}>
                  {sealType}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-teal-100"></div>

          {/* Contact Details Line */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-slate-600 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-teal-500 font-bold">📞</span>
              <span className="font-medium">071-8658998</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-teal-500 font-bold">📍</span>
              <span className="font-medium">100/E Railway Cross Road Diyathalawa</span>
            </div>
          </div>

          {/* Info Grid Table */}
          <div className="space-y-2 pt-1">
            <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
              {customer.contracts && customer.contracts.length > 0
                ? `${customer.contracts
                    .map((id) => CONTRACT_TYPES[id]?.label)
                    .filter(Boolean)
                    .join(" & ")} — Packaging List`
                : "Packaging List"}
            </h2>
            <div className="border border-teal-100 rounded-lg overflow-hidden text-xs bg-white">
              {/* Row 1: Date */}
              <div className="grid grid-cols-4 border-b border-teal-50">
                <div className="bg-teal-50/70 py-1.5 px-3 font-semibold text-slate-600 border-r border-teal-100 flex items-center">
                  Date:
                </div>
                <div className="py-1.5 px-3 col-span-3 text-slate-800 font-medium">
                  {listDate}
                </div>
              </div>
              {/* Row 2: To */}
              <div className="grid grid-cols-4">
                <div className="bg-teal-50/70 py-2.5 px-3 font-semibold text-slate-600 border-r border-teal-100 flex items-start">
                  To:
                </div>
                <div className="py-2.5 px-3 col-span-3 text-slate-800 space-y-1">
                  <p className="font-bold text-sm leading-tight">{customer.name}</p>
                  <p className="text-slate-500 text-xs leading-normal">{customer.address}</p>
                  <p className="text-teal-600 font-semibold text-xs pt-0.5">{customer.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Packing Items
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

          {/* Table */}
          <div className="relative overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-teal-50 text-slate-700">
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wider w-[20%] border-r border-teal-100">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wider border-r border-teal-100">
                    Description / Item
                  </th>
                  <th className="px-3 py-2 text-right font-bold uppercase tracking-wider w-[15%]">
                    Quantity
                  </th>
                  {!saved && <th className="px-2 py-2 w-10"></th>}
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
                              className="w-full bg-transparent border-b border-dashed border-slate-200 py-0.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600"
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
                              placeholder="Item name / work description..."
                              className={`w-full bg-transparent border-b border-dashed ${
                                errors[`item_${idx}_description`] ? "border-red-400" : "border-slate-200"
                              } py-0.5 text-xs focus:outline-none focus:border-teal-600`}
                            />
                            {errors[`item_${idx}_description`] && (
                              <span className="text-[9px] text-red-500 block mt-0.5">Required</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-2 text-right align-top text-slate-700">
                        {saved ? (
                          <span className="font-mono">{item.qty}</span>
                        ) : (
                          <input
                            type="text"
                            value={item.qty}
                            onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                            placeholder="e.g. 10 Nos"
                            className="w-full bg-transparent border-b border-dashed border-slate-200 py-0.5 text-xs text-right focus:outline-none focus:border-teal-600"
                          />
                        )}
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

        {/* Notes & Signature */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs">
          <div className="space-y-1.5 max-w-sm">
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
                placeholder="Add notes or special instructions here..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 resize-none text-slate-700 placeholder-slate-400"
              />
            )}
          </div>
          <div className="text-right space-y-8 min-w-[180px] self-end">
            <p className="font-bold text-slate-800">Prepared by:</p>
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
