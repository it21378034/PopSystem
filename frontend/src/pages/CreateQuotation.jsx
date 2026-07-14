import React, { useState, useRef } from "react";
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
  WrenchScrewdriverIcon,
  TruckIcon,
  CurrencyRupeeIcon,
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

const EMPTY_MATERIAL = { description: "", specification: "", qty: "", unit: "Nos", unitRate: "" };
const EMPTY_LABOUR = { task: "", days: "", ratePerDay: "" };
const EMPTY_EXTRA = { description: "", amount: "" };

const UNITS = ["Nos", "Kg", "Feet", "Meter", "Sq.ft", "Sq.m", "Rft", "Ltr", "Set", "Lot"];

const DEFAULT_TERMS = [
  "All materials supplied will be of standard quality as per industry specifications.",
  "Any changes to the scope of work will be charged separately.",
  "The contractor is not responsible for delays due to site conditions beyond control.",
  "Warranty: 1 year for fabrication workmanship defects.",
  "Payment to be made as per the agreed payment schedule.",
];

const DEFAULT_PAYMENT = { advance: 40, onCompletion: 60, terms: "Balance payment due within 7 days of project completion." };

function generateQuotNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `QUO-${y}${m}${d}-${rand}`;
}

function fmt(val) {
  const n = parseFloat(val);
  return isNaN(n) ? "0.00" : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CreateQuotation() {
  const location = useLocation();
  const navigate = useNavigate();
  const customer = location.state?.customer || null;
  const existing = location.state?.existingQuotation || null;
  const quotRef = useRef(null);

  const [quotNo] = useState(() => existing ? existing.quotNo : generateQuotNo());
  const [quotDate] = useState(() => existing ? existing.quotDate : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
  const [validUntil, setValidUntil] = useState(() => existing ? existing.validUntil : addDays(30));
  const [projectName, setProjectName] = useState(() => existing ? existing.projectName : "");
  const [siteLocation, setSiteLocation] = useState(() => existing ? existing.siteLocation : customer?.address || "");
  const [startDate, setStartDate] = useState(() => existing ? existing.startDate : "");
  const [materials, setMaterials] = useState(() => existing ? existing.materials : [{ ...EMPTY_MATERIAL }]);
  const [labours, setLabours] = useState(() => existing ? existing.labours : [{ ...EMPTY_LABOUR }]);
  const [extras, setExtras] = useState(() => existing ? existing.extras : [{ ...EMPTY_EXTRA }]);
  const [discount, setDiscount] = useState(() => existing ? existing.discount : "");
  const [paymentTerms, setPaymentTerms] = useState(() => existing ? existing.paymentTerms : { ...DEFAULT_PAYMENT });
  const [tcLines, setTcLines] = useState(() => existing ? existing.tcLines : [...DEFAULT_TERMS]);
  const [notes, setNotes] = useState(() => existing ? existing.notes : "");
  const [saved, setSaved] = useState(() => !!existing);
  const [errors, setErrors] = useState({});

  // — Totals —
  const materialTotal = materials.reduce((s, m) => {
    const q = parseFloat(m.qty);
    const r = parseFloat(m.unitRate) || 0;
    let rowTotal;
    if (!isNaN(q) && q !== 0) {
      rowTotal = q * r;           // qty entered → multiply
    } else if (isNaN(q) && r > 0) {
      rowTotal = r;               // qty empty but price entered → show price
    } else {
      rowTotal = 0;               // both empty → 0
    }
    return s + rowTotal;
  }, 0);
  const labourTotal = labours.reduce((s, l) => {
    const d = parseFloat(l.days);
    const r = parseFloat(l.ratePerDay) || 0;
    let rowTotal;
    if (!isNaN(d) && d !== 0) {
      rowTotal = d * r;
    } else if (isNaN(d) && r > 0) {
      rowTotal = r;
    } else {
      rowTotal = 0;
    }
    return s + rowTotal;
  }, 0);
  const extraTotal = extras.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const subtotal = materialTotal + labourTotal + extraTotal;
  const discountAmt = Math.min(parseFloat(discount) || 0, subtotal);
  const grandTotal = subtotal - discountAmt;
  const advanceAmt = (grandTotal * (paymentTerms.advance || 0)) / 100;
  const balanceAmt = grandTotal - advanceAmt;

  // — Material handlers —
  const setMat = (idx, field, val) => setMaterials(p => p.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  const addMat = () => setMaterials(p => [...p, { ...EMPTY_MATERIAL }]);
  const removeMat = idx => materials.length > 1 && setMaterials(p => p.filter((_, i) => i !== idx));

  // — Labour handlers —
  const setLab = (idx, field, val) => setLabours(p => p.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  const addLab = () => setLabours(p => [...p, { ...EMPTY_LABOUR }]);
  const removeLab = idx => labours.length > 1 && setLabours(p => p.filter((_, i) => i !== idx));

  // — Extra handlers —
  const setExt = (idx, field, val) => setExtras(p => p.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  const addExt = () => setExtras(p => [...p, { ...EMPTY_EXTRA }]);
  const removeExt = idx => extras.length > 1 && setExtras(p => p.filter((_, i) => i !== idx));

  // — T&C handlers —
  const setTc = (idx, val) => setTcLines(p => p.map((t, i) => i === idx ? val : t));
  const addTc = () => setTcLines(p => [...p, ""]);
  const removeTc = idx => tcLines.length > 1 && setTcLines(p => p.filter((_, i) => i !== idx));

  const validate = () => {
    const errs = {};
    if (!projectName.trim()) errs.projectName = "Project name is required";
    materials.forEach((m, i) => {
      if (!m.description.trim()) errs[`mat_${i}_desc`] = "Required";
    });
    labours.forEach((l, i) => {
      if (!l.task.trim()) errs[`lab_${i}_task`] = "Required";
    });
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const record = {
      quotNo, quotDate, validUntil, projectName, siteLocation, startDate,
      customer: { id: customer.id, name: customer.name, phone: customer.phone, address: customer.address, contracts: customer.contracts, otherDetails: customer.otherDetails || "" },
      materials, labours, extras, discount, paymentTerms, tcLines, notes,
      materialTotal, labourTotal, extraTotal, subtotal, discountAmt, grandTotal,
    };

    try {
      if (existing) {
        await api.updateQuotation(quotNo, record);
      } else {
        await api.createQuotation(record);
      }
      setSaved(true);
    } catch (e) {
      console.error("Failed to save quotation:", e);
    }
  };

  const handlePrint = () => window.print();

  const handleGeneratePDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const el = quotRef.current;
      if (!el) return;
      const name = (customer?.name || "Customer").replace(/[^a-zA-Z0-9]/g, "");

      el.classList.add("pdf-exporting");
      
      await html2pdf().from(el).set({
        margin: [0.3, 0.35, 0.3, 0.35],
        filename: `${name}_Quotation.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2.2, useCORS: true, logging: false, backgroundColor: "#ffffff", windowWidth: 1024 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      }).save();

      el.classList.remove("pdf-exporting");
    } catch (err) {
      console.error("PDF error:", err);
      quotRef.current?.classList.remove("pdf-exporting");
    }
  };

  if (!customer) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-700 dark:text-white">No Customer Selected</h2>
        <p className="text-gray-500 dark:text-gray-400">Please go to the Customers page and select a customer to create a quotation.</p>
        <button onClick={() => navigate("/customers")} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow hover:from-blue-800 hover:to-blue-600 transition">
          <ArrowLeftIcon className="h-4 w-4" /> Go to Customers
        </button>
      </div>
    );
  }

  const contractLabel = customer.contracts?.map(id => CONTRACT_TYPES[id]?.label).filter(Boolean).join(" & ") || "Fabrication";

  return (
    <section className="max-w-5xl mx-auto space-y-4">
      {/* — Action Bar — */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/quotations")} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Back to quotations">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
              <DocumentTextIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Create Quotation
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Draft #{quotNo} · {quotDate}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved && (
            <>
              <button onClick={() => navigate("/quotations")} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-lg text-sm transition">
                <ListBulletIcon className="h-4 w-4" /> All Quotations
              </button>
              <button onClick={() => setSaved(false)} className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 text-amber-700 dark:text-amber-400 font-semibold px-3 py-2 rounded-lg text-sm transition border border-amber-200 dark:border-amber-700">
                <PencilSquareIcon className="h-4 w-4" /> Edit
              </button>
            </>
          )}

          <button onClick={handlePrint} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-lg text-sm transition">
            <PrinterIcon className="h-4 w-4" /> Print
          </button>
          <button onClick={handleGeneratePDF} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-lg text-sm transition">
            <ArrowDownTrayIcon className="h-4 w-4" /> Download PDF
          </button>

          {!saved && (
            <button onClick={handleSave} className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-800 to-indigo-950 hover:from-indigo-700 hover:to-indigo-900 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow transition">
              <CheckCircleIcon className="h-4 w-4" /> Save Quotation
            </button>
          )}
        </div>
      </div>

      {/* — Quotation Document — */}
      <div ref={quotRef} id="quotation-print-area" className="bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 overflow-hidden font-sans">

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white px-6 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-1.5 rounded-full border-2 border-white/20 w-14 h-14 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src="/logo.png" alt="Logo" className="max-h-full max-w-full object-contain rounded-full" onError={e => { e.target.style.display = "none"; }} />
              </div>
              <div>
                <h1 style={{ lineHeight: 1.2, margin: 0 }}>
                  <span style={{ display: "inline-block" }}>
                    <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.6rem", fontWeight: 900, fontStyle: "italic", color: "#e0e7ff" }}>V</span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "2.5px", color: "#c7d2fe", textTransform: "uppercase" }}>asantha</span>
                  </span>
                  <br />
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "4px", color: "#a5b4fc", textTransform: "uppercase", fontStyle: "italic" }}>Iron Works</span>
                </h1>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "8px", color: "#818cf8", letterSpacing: "2px", textTransform: "uppercase", marginTop: "4px" }}>Professional Fabrication & Installation</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-indigo-300 text-[9px] uppercase tracking-wider font-semibold">Quotation</div>
              <div className="text-white text-xl font-black font-mono leading-none">{quotNo}</div>
              <div className="text-indigo-300 text-[10px] mt-1">Date: {quotDate}</div>
              <div className="text-indigo-300 text-[10px]">Valid until: <span className="text-white font-semibold">{validUntil}</span></div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-indigo-200 border-t border-white/10 pt-3">
            <span>📞 071-8658998</span>
            <span>📍 100/E Railway Cross Road Diyathalawa</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">

          {/* Project Info + Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Details */}
            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 rounded-lg p-4 space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Project Details</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Project / Work:</span>
                  {saved ? (
                    <span className="ml-2 font-bold text-slate-800">{projectName || "—"}</span>
                  ) : (
                    <div className="mt-1">
                      <input type="text" value={projectName} onChange={e => { setProjectName(e.target.value); setErrors(p => { const n={...p}; delete n.projectName; return n; }); }}
                        placeholder={`e.g. ${contractLabel} Work at Site`}
                        className={`w-full border-b border-dashed ${errors.projectName ? "border-red-400" : "border-indigo-200"} bg-transparent py-0.5 text-xs focus:outline-none focus:border-indigo-600 font-semibold text-slate-800 placeholder-slate-400`} />
                      {errors.projectName && <span className="text-[9px] text-red-500">{errors.projectName}</span>}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Site Location:</span>
                  {saved ? (
                    <span className="ml-2 text-slate-700">{siteLocation || "—"}</span>
                  ) : (
                    <input type="text" value={siteLocation} onChange={e => setSiteLocation(e.target.value)}
                      placeholder="Site address"
                      className="mt-1 w-full border-b border-dashed border-indigo-200 bg-transparent py-0.5 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 placeholder-slate-400" />
                  )}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Expected Start:</span>
                  {saved ? (
                    <span className="ml-2 text-slate-700">{startDate || "—"}</span>
                  ) : (
                    <input type="text" value={startDate} onChange={e => setStartDate(e.target.value)}
                      placeholder="e.g. 15 Jun 2025"
                      className="mt-1 w-full border-b border-dashed border-indigo-200 bg-transparent py-0.5 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 placeholder-slate-400" />
                  )}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Contract Type:</span>
                  <span className="ml-2 font-semibold text-indigo-700">{contractLabel}</span>
                </div>
                {!saved && (
                  <div>
                    <span className="text-slate-500 font-medium">Valid Until:</span>
                    <input type="text" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                      className="ml-2 border-b border-dashed border-indigo-200 bg-transparent py-0.5 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 w-28 inline-block" />
                  </div>
                )}
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quotation For</h3>
              <div className="text-xs space-y-1.5">
                <p className="font-bold text-base text-slate-800 leading-tight">{customer.name}</p>
                <p className="text-slate-500 leading-relaxed">{customer.address}</p>
                <p className="text-indigo-600 font-semibold">{customer.phone}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {customer.contracts?.map(id => {
                    const ct = CONTRACT_TYPES[id];
                    return ct ? (
                      <span key={id} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{ct.icon} {ct.label}</span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* — Materials Table — */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <WrenchScrewdriverIcon className="h-3.5 w-3.5" /> Materials & Items
              </h3>
              {!saved && (
                <button onClick={addMat} className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition print:hidden">
                  <PlusIcon className="h-3.5 w-3.5" /> Add Row
                </button>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-indigo-50 text-slate-700">
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wider border-r border-indigo-100">Description</th>
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wider border-r border-indigo-100 w-[18%]">Specification</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wider border-r border-indigo-100 w-[8%]">Qty</th>
                    <th className="px-3 py-2 text-center font-bold uppercase tracking-wider border-r border-indigo-100 w-[8%]">Unit</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wider border-r border-indigo-100 w-[14%]">Rate (RS)</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wider w-[14%]">Total (RS)</th>
                    {!saved && <th className="px-2 py-2 w-8 print:hidden"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map((m, idx) => {
                    const qty = parseFloat(m.qty);
                    const rate = parseFloat(m.unitRate) || 0;
                    let total;
                    if (!isNaN(qty) && qty !== 0) {
                      total = qty * rate;       // qty entered → multiply
                    } else if (isNaN(qty) && rate > 0) {
                      total = rate;             // qty empty, price entered → show price
                    } else {
                      total = 0;               // both empty → 0
                    }
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 border-r border-slate-100">
                          {saved ? <span className="text-slate-700">{m.description}</span> : (
                            <div>
                              <input type="text" value={m.description} onChange={e => setMat(idx, "description", e.target.value)}
                                placeholder="e.g. MS Square Pipe 40×40"
                                className={`w-full bg-transparent border-b border-dashed ${errors[`mat_${idx}_desc`] ? "border-red-400" : "border-slate-200"} py-0.5 focus:outline-none focus:border-indigo-600 text-slate-800 placeholder-slate-400`} />
                              {errors[`mat_${idx}_desc`] && <span className="text-[9px] text-red-500">Required</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100">
                          {saved ? <span className="text-slate-600">{m.specification}</span> : (
                            <input type="text" value={m.specification} onChange={e => setMat(idx, "specification", e.target.value)}
                              placeholder="Size / Grade"
                              className="w-full bg-transparent border-b border-dashed border-slate-200 py-0.5 focus:outline-none focus:border-indigo-600 text-slate-600 placeholder-slate-400" />
                          )}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right">
                          {saved ? <span className="font-mono">{m.qty}</span> : (
                            <input type="number" min="0" value={m.qty} onChange={e => setMat(idx, "qty", e.target.value)}
                              placeholder="0"
                              className="w-full bg-transparent border-b border-dashed border-slate-200 py-0.5 focus:outline-none focus:border-indigo-600 text-right font-mono placeholder-slate-400" />
                          )}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">
                          {saved ? <span>{m.unit}</span> : (
                            <select value={m.unit} onChange={e => setMat(idx, "unit", e.target.value)}
                              className="w-full bg-white dark:bg-gray-700 border border-slate-200 rounded text-[10px] focus:outline-none cursor-pointer px-0.5 py-0.5">
                              {UNITS.map(u => <option key={u}>{u}</option>)}
                            </select>
                          )}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right font-mono">
                          {saved ? <span>RS {fmt(m.unitRate)}</span> : (
                            <input type="number" min="0" step="0.01" value={m.unitRate} onChange={e => setMat(idx, "unitRate", e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-transparent border-b border-dashed border-slate-200 py-0.5 focus:outline-none focus:border-indigo-600 text-right font-mono placeholder-slate-400" />
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">RS {fmt(total)}</td>
                        {!saved && (
                          <td className="px-1 py-2 text-center print:hidden">
                            <button onClick={() => removeMat(idx)} disabled={materials.length === 1} className="text-red-400 hover:text-red-600 transition">
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  <tr className="bg-indigo-50/50 font-semibold text-xs">
                    <td colSpan={saved ? 5 : 6} className="px-3 py-2 text-right text-slate-600 border-t border-indigo-100">Materials Subtotal:</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-800 border-t border-indigo-100">RS {fmt(materialTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* — Labour Table — */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <TruckIcon className="h-3.5 w-3.5" /> Labour Charges
              </h3>
              {!saved && (
                <button onClick={addLab} className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition print:hidden">
                  <PlusIcon className="h-3.5 w-3.5" /> Add Row
                </button>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-50 text-slate-700">
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wider border-r border-amber-100">Task / Work Description</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wider border-r border-amber-100 w-[14%]">Days / Hours</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wider border-r border-amber-100 w-[18%]">Rate / Day (RS)</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wider w-[16%]">Total (RS)</th>
                    {!saved && <th className="px-2 py-2 w-8 print:hidden"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {labours.map((l, idx) => {
                    const days = parseFloat(l.days);
                    const rate = parseFloat(l.ratePerDay) || 0;
                    let total;
                    if (!isNaN(days) && days !== 0) {
                      total = days * rate;
                    } else if (isNaN(days) && rate > 0) {
                      total = rate;
                    } else {
                      total = 0;
                    }
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 border-r border-slate-100">
                          {saved ? <span className="text-slate-700">{l.task}</span> : (
                            <div>
                              <input type="text" value={l.task} onChange={e => setLab(idx, "task", e.target.value)}
                                placeholder="e.g. Fabrication & Welding"
                                className={`w-full bg-transparent border-b border-dashed ${errors[`lab_${idx}_task`] ? "border-red-400" : "border-slate-200"} py-0.5 focus:outline-none focus:border-amber-500 text-slate-800 placeholder-slate-400`} />
                              {errors[`lab_${idx}_task`] && <span className="text-[9px] text-red-500">Required</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right">
                          {saved ? <span className="font-mono">{l.days}</span> : (
                            <input type="number" min="0" value={l.days} onChange={e => setLab(idx, "days", e.target.value)}
                              placeholder="0"
                              className="w-full bg-transparent border-b border-dashed border-slate-200 py-0.5 focus:outline-none focus:border-amber-500 text-right font-mono placeholder-slate-400" />
                          )}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right font-mono">
                          {saved ? <span>RS {fmt(l.ratePerDay)}</span> : (
                            <input type="number" min="0" step="0.01" value={l.ratePerDay} onChange={e => setLab(idx, "ratePerDay", e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-transparent border-b border-dashed border-slate-200 py-0.5 focus:outline-none focus:border-amber-500 text-right font-mono placeholder-slate-400" />
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">RS {fmt(total)}</td>
                        {!saved && (
                          <td className="px-1 py-2 text-center print:hidden">
                            <button onClick={() => removeLab(idx)} disabled={labours.length === 1} className="text-red-400 hover:text-red-600 transition">
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  <tr className="bg-amber-50/50 font-semibold text-xs">
                    <td colSpan={saved ? 3 : 4} className="px-3 py-2 text-right text-slate-600 border-t border-amber-100">Labour Subtotal:</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-800 border-t border-amber-100">RS {fmt(labourTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* — Additional Costs — */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Additional Costs</h3>
              {!saved && (
                <button onClick={addExt} className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition print:hidden">
                  <PlusIcon className="h-3.5 w-3.5" /> Add
                </button>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-teal-50 text-slate-700">
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wider border-r border-teal-100">Description</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wider w-[22%]">Amount (RS)</th>
                    {!saved && <th className="px-2 py-2 w-8 print:hidden"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {extras.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 border-r border-slate-100">
                        {saved ? <span className="text-slate-700">{e.description}</span> : (
                          <input type="text" value={e.description} onChange={ev => setExt(idx, "description", ev.target.value)}
                            placeholder="e.g. Transport, Welding Gas, Primer"
                            className="w-full bg-transparent border-b border-dashed border-slate-200 py-0.5 focus:outline-none focus:border-teal-500 text-slate-800 placeholder-slate-400" />
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {saved ? <span className="font-bold">RS {fmt(e.amount)}</span> : (
                          <input type="number" min="0" step="0.01" value={e.amount} onChange={ev => setExt(idx, "amount", ev.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent border-b border-dashed border-slate-200 py-0.5 focus:outline-none focus:border-teal-500 text-right font-mono placeholder-slate-400" />
                        )}
                      </td>
                      {!saved && (
                        <td className="px-1 py-2 text-center print:hidden">
                          <button onClick={() => removeExt(idx)} disabled={extras.length === 1} className="text-red-400 hover:text-red-600 transition">
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-teal-50/50 font-semibold text-xs">
                    <td className="px-3 py-2 text-right text-slate-600 border-t border-teal-100">Additional Subtotal:</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-800 border-t border-teal-100">RS {fmt(extraTotal)}</td>
                    {!saved && <td className="border-t border-teal-100 print:hidden"></td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* — Grand Total Summary — */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-indigo-100">
                  <td className="px-4 py-2 text-slate-600 font-medium">Subtotal</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-800">RS {fmt(subtotal)}</td>
                </tr>
                <tr className="border-b border-indigo-100">
                  <td className="px-4 py-2 text-slate-600 font-medium flex items-center gap-1">
                    Discount
                    {!saved && (
                      <span className="text-slate-400 font-normal text-xs">
                        (RS <input type="number" min="0" max={subtotal} step="0.01" value={discount}
                          onChange={e => setDiscount(e.target.value)}
                          placeholder="0"
                          className="w-16 bg-transparent border-b border-dashed border-indigo-300 focus:outline-none text-slate-700 font-mono inline-block" />)
                      </span>
                    )}
                    {saved && discountAmt > 0 && <span className="text-slate-400 text-xs">(RS {fmt(discountAmt)})</span>}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-rose-600">- RS {fmt(discountAmt)}</td>
                </tr>
                <tr className="bg-indigo-900 text-white">
                  <td className="px-4 py-3 font-bold text-base">Grand Total</td>
                  <td className="px-4 py-3 text-right font-mono font-black text-lg">RS {fmt(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* — Payment Terms — */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CurrencyRupeeIcon className="h-3.5 w-3.5" /> Payment Schedule
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="font-semibold text-slate-700">Advance Payment</p>
                    {!saved ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input type="number" min="0" max="100" value={paymentTerms.advance}
                          onChange={e => setPaymentTerms(p => ({ ...p, advance: Math.min(100, parseFloat(e.target.value) || 0), onCompletion: Math.max(0, 100 - (parseFloat(e.target.value) || 0)) }))}
                          className="w-12 bg-transparent border-b border-dashed border-slate-300 focus:outline-none text-indigo-700 font-mono" />
                        <span className="text-slate-400">%</span>
                      </div>
                    ) : (
                      <p className="text-slate-500 mt-0.5">{paymentTerms.advance}%</p>
                    )}
                  </div>
                  <span className="font-mono font-bold text-indigo-700 text-sm">RS {fmt(advanceAmt)}</span>
                </div>
                <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="font-semibold text-slate-700">On Completion</p>
                    <p className="text-slate-500 mt-0.5">{paymentTerms.onCompletion}%</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 text-sm">RS {fmt(balanceAmt)}</span>
                </div>
                <div>
                  {saved ? (
                    <p className="text-slate-600 text-[11px] italic">{paymentTerms.terms}</p>
                  ) : (
                    <textarea value={paymentTerms.terms} onChange={e => setPaymentTerms(p => ({ ...p, terms: e.target.value }))}
                      rows={2}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none text-slate-600 placeholder-slate-400"
                      placeholder="Additional payment notes..." />
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notes</h3>
              {saved ? (
                <p className="text-xs text-slate-600 italic">{notes || "—"}</p>
              ) : (
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={5}
                  className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none text-slate-700 placeholder-slate-400"
                  placeholder="Any additional notes, special requirements, or site conditions..." />
              )}
            </div>
          </div>

          {/* — Terms & Conditions — */}
          <div className="rounded-lg border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Terms & Conditions</h3>
              {!saved && (
                <button onClick={addTc} className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                  <PlusIcon className="h-3.5 w-3.5" /> Add
                </button>
              )}
            </div>
            <ol className="space-y-1.5 text-xs text-slate-600 list-decimal list-inside">
              {tcLines.map((tc, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-slate-400 font-mono text-[10px] flex-shrink-0 mt-0.5">{idx + 1}.</span>
                  {saved ? (
                    <span>{tc}</span>
                  ) : (
                    <div className="flex-1 flex items-center gap-1">
                      <input type="text" value={tc} onChange={e => setTc(idx, e.target.value)}
                        className="flex-1 bg-transparent border-b border-dashed border-slate-200 py-0.5 focus:outline-none focus:border-indigo-400 text-slate-700 placeholder-slate-400"
                        placeholder="Add a term or condition..." />
                      <button onClick={() => removeTc(idx)} disabled={tcLines.length === 1} className="text-red-400 hover:text-red-600 transition flex-shrink-0">
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* — Signature Block — */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-2 border-t border-slate-100 mt-2">
            <div className="space-y-6 text-center min-w-[180px]">
              <p className="text-xs font-semibold text-slate-600">Client Acceptance:</p>
              <div className="border-t border-slate-400 w-40 pt-1 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Customer Signature & Date</div>
            </div>
            <div className="space-y-6 text-center min-w-[180px]">
              <p className="text-xs font-semibold text-slate-600">Approved by:</p>
              <div className="border-t border-slate-400 w-40 ml-auto pt-1 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Authorized Signature</div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400 font-medium" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: "1px" }}>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: 700, color: "#475569" }}>V</span>asantha Iron Works · Professional Metal Engineering · Diyathalawa · 071-8658998
            <br />
            <span className="text-[9px] text-slate-300">This quotation is valid until {validUntil}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
