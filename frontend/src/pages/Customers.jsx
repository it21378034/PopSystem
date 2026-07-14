import React, { useState, useEffect } from "react";
import {
  UserPlusIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const CONTRACT_TYPES = [
  { id: "gate", label: "Gate", icon: "🚪", color: "from-blue-500 to-blue-600" },
  { id: "roof", label: "Roof", icon: "🏠", color: "from-amber-500 to-amber-600" },
  { id: "ceiling", label: "Ceiling", icon: "🪟", color: "from-purple-500 to-purple-600" },
  { id: "hand_railing", label: "Hand Railing", icon: "🛗", color: "from-green-500 to-green-600" },
  { id: "staircase", label: "Staircase", icon: "🪜", color: "from-pink-500 to-pink-600" },
  { id: "window_grills", label: "Window Grills", icon: "🔲", color: "from-indigo-500 to-indigo-600" },
  { id: "door_frames", label: "Door Frames", icon: "🚪", color: "from-teal-500 to-teal-600" },
  { id: "other", label: "Other Contract", icon: "📋", color: "from-gray-500 to-gray-600" },
];

const EMPTY_FORM = {
  name: "",
  phone: "",
  address: "",
  contracts: [],
  otherDetails: "",
  notes: "",
};

export default function Customers() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [postSaveDialog, setPostSaveDialog] = useState(null);

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

  const toggleContract = (id) => {
    setForm((prev) => ({
      ...prev,
      contracts: prev.contracts.includes(id)
        ? prev.contracts.filter((c) => c !== id)
        : [...prev.contracts, id],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Customer name is required.";
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    else if (!/^[\d\s\-\+\(\)]{7,15}$/.test(form.phone.trim()))
      errs.phone = "Enter a valid phone number.";
    if (!form.address.trim()) errs.address = "Address is required.";
    if (form.contracts.length === 0)
      errs.contracts = "Select at least one contract type.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      if (editingId !== null) {
        const updated = await api.updateCustomer(editingId, form);
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c))
        );
        setEditingId(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setShowForm(false);
      } else {
        const created = await api.createCustomer(form);
        setCustomers((prev) => [created, ...prev]);
        setForm(EMPTY_FORM);
        setErrors({});
        setShowForm(false);
        setPostSaveDialog(created);
      }
    } catch (err) {
      console.error("Failed to save customer:", err);
      alert("Error saving customer. Please check your connection or database configuration.");
    }
  };

  const handleCreateInvoice = (customer) => {
    navigate("/invoices/create", { state: { customer } });
  };

  const handleCreateQuotation = (customer) => {
    navigate("/quotations/create", { state: { customer } });
  };

  const handleCreatePackagingList = (customer) => {
    navigate("/packaging-lists/create", { state: { customer } });
  };

  const handleEdit = (customer) => {
    setForm({ ...customer });
    setEditingId(customer.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (customer) => {
    setDeleteTarget(customer);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteCustomer(deleteTarget.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete customer:", err);
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <section className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Customers</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage customer records and contract types
          </p>
        </div>
        <button
          id="add-customer-btn"
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
        >
          <UserPlusIcon className="h-5 w-5" />
          Add Customer
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <UserPlusIcon className="h-6 w-6" />
              {editingId !== null ? "Edit Customer" : "New Customer"}
            </h3>
            <button
              onClick={handleCancel}
              className="text-white/70 hover:text-white transition p-1 rounded-full hover:bg-white/10"
              aria-label="Close form"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Customer Details Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                Customer Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="customer-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                        errors.name
                          ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      } text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="customer-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                        errors.phone
                          ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      } text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                {/* Address */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      id="customer-address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Full site/home address..."
                      rows={2}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border resize-none ${
                        errors.address
                          ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      } text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                  </div>
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
              </div>
            </div>

            {/* Contract Type Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Contract Type <span className="text-red-500">*</span>
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Select one or more contract types for this customer
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {CONTRACT_TYPES.map((ct) => {
                  const selected = form.contracts.includes(ct.id);
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      id={`contract-${ct.id}`}
                      onClick={() => toggleContract(ct.id)}
                      className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none
                        ${selected
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-md scale-105"
                          : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-400 hover:shadow-sm"
                        }`}
                    >
                      {selected && (
                        <span className="absolute top-2 right-2 bg-blue-600 text-white rounded-full h-4 w-4 flex items-center justify-center">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                      )}
                      <span className="text-2xl">{ct.icon}</span>
                      <span className={`text-xs font-semibold text-center leading-tight ${
                        selected ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-300"
                      }`}>
                        {ct.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.contracts && <p className="text-xs text-red-500 mt-2">{errors.contracts}</p>}
              {form.contracts.includes("other") && (
                <div className="mt-4 space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Specify Other Contract Details
                  </label>
                  <input
                    id="other-contract-details"
                    type="text"
                    value={form.otherDetails}
                    onChange={(e) => setForm({ ...form, otherDetails: e.target.value })}
                    placeholder="Describe the other contract work..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="customer-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes about this customer or project..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              />
            </div>

            {/* Info banner for new customers removed */}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="submit"
                id="save-customer-btn"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <CheckIcon className="h-5 w-5" />
                {editingId !== null ? "Update Customer" : "Save"}
              </button>
              <button
                type="button"
                id="cancel-customer-btn"
                onClick={handleCancel}
                className="flex-1 sm:flex-none sm:px-6 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-lg transition-all duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Customer Records
            {customers.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({customers.length} {customers.length === 1 ? "customer" : "customers"})
              </span>
            )}
          </h3>
          {customers.length > 0 && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="customer-search"
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
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <UserIcon className="h-14 w-14 mb-3 opacity-30" />
            <p className="text-lg font-medium">No customers yet</p>
            <p className="text-sm mt-1">Click "Add Customer" to get started</p>
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
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
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
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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
                          const ct = CONTRACT_TYPES.find((c) => c.id === id);
                          return ct ? (
                            <span key={id} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                              {ct.icon} {ct.label}
                            </span>
                          ) : null;
                        })}
                        {customer.contracts.includes("other") && customer.otherDetails && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                            ({customer.otherDetails})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCreateInvoice(customer)}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition"
                          title="Create invoice"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCreateQuotation(customer)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                          title="Create quotation"
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCreatePackagingList(customer)}
                          className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition"
                          title="Create packaging list"
                        >
                          <ArchiveBoxIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                          title="Edit customer"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(customer)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                          title="Delete customer"
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
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <TrashIcon className="h-6 w-6" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Customer?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Are you sure you want to delete customer <span className="font-bold text-gray-800 dark:text-white">{deleteTarget?.name}</span>? This action cannot be undone.
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

      {/* Post Save Action Modal */}
      {postSaveDialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all">
            <div className="flex items-center gap-3 text-green-600 mb-2">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <CheckIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Customer Saved!</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{postSaveDialog?.name} has been added</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 mt-3">
              What would you like to create for <span className="font-bold text-gray-800 dark:text-white">{postSaveDialog?.name}</span>?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setPostSaveDialog(null); handleCreateInvoice(postSaveDialog); }}
                className="w-full px-4 py-2.5 flex items-center gap-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 transition shadow-sm"
              >
                <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
                <span>Create Invoice / Estimate</span>
              </button>
              <button
                onClick={() => { setPostSaveDialog(null); handleCreateQuotation(postSaveDialog); }}
                className="w-full px-4 py-2.5 flex items-center gap-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 transition shadow-sm"
              >
                <ClipboardDocumentListIcon className="h-5 w-5 flex-shrink-0" />
                <span>Create Quotation</span>
              </button>
              <button
                onClick={() => { setPostSaveDialog(null); handleCreatePackagingList(postSaveDialog); }}
                className="w-full px-4 py-2.5 flex items-center gap-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition shadow-sm"
              >
                <ArchiveBoxIcon className="h-5 w-5 flex-shrink-0" />
                <span>Create Packaging List</span>
              </button>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setPostSaveDialog(null)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
              >
                No, maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
