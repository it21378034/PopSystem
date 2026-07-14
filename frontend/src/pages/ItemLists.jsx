import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  DocumentTextIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  UserIcon,
  ClipboardDocumentListIcon,
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

function SealBadge({ type }) {
  if (type === "packed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-700 border border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700">
        📦 Packed
      </span>
    );
  }
  if (type === "shipped") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700">
        🚚 Shipped
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
      — Draft
    </span>
  );
}

export default function ItemLists() {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const data = await api.getItemLists();
      setLists(data);
    } catch (e) {
      console.error("Failed to load item lists:", e);
      setLists([]);
    }
  };

  const handleDeleteClick = (listNo) => {
    setDeleteTarget(listNo);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteItemList(deleteTarget);
      setLists((prev) => prev.filter((l) => l.listNo !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete item list:", err);
    }
  };

  const handleOpen = (list) => {
    navigate("/item-lists/create", {
      state: { customer: list.customer, existingList: list },
    });
  };

  const filtered = lists.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.listNo.toLowerCase().includes(q) ||
      l.customer?.name?.toLowerCase().includes(q) ||
      l.customer?.phone?.includes(q) ||
      l.listDate?.toLowerCase().includes(q)
    );
  });

  return (
    <section className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Item Lists</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            All saved item lists
          </p>
        </div>
        <button
          onClick={() => navigate("/customers")}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-600 hover:to-teal-800 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
        >
          <ClipboardDocumentListIcon className="h-5 w-5" />
          New Item List
        </button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
            <DocumentTextIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Lists</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{lists.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📦</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Packed</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {lists.filter((l) => l.sealType === "packed").length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🚚</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Shipped</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {lists.filter((l) => l.sealType === "shipped").length}
            </p>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Item List Records
            {lists.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({lists.length} {lists.length === 1 ? "list" : "lists"})
              </span>
            )}
          </h3>
          {lists.length > 0 && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item lists..."
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition w-56"
              />
            </div>
          )}
        </div>

        {lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <DocumentTextIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No item lists saved yet</p>
            <p className="text-sm mt-1">Go to Customers and create an item list to get started</p>
            <button
              onClick={() => navigate("/customers")}
              className="mt-5 flex items-center gap-2 bg-teal-700 hover:bg-teal-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition"
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
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">List No.</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contract</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((list, idx) => (
                  <tr key={list.listNo} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="px-6 py-4 text-gray-400 dark:text-gray-500 font-mono text-xs">
                      {String(idx + 1).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                        {list.listNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {list.customer?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{list.customer?.name}</p>
                          <p className="text-xs text-gray-400">{list.customer?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(list.customer?.contracts || []).map((id) => {
                          const ct = CONTRACT_TYPES[id];
                          return ct ? (
                            <span key={id} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                              {ct.icon} {ct.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap">
                      {list.listDate}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">
                      {Array.isArray(list.items) ? list.items.length : 0} item(s)
                    </td>
                    <td className="px-6 py-4">
                      <SealBadge type={list.sealType} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpen(list)}
                          title="View / Re-open item list"
                          className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition"
                        >
                          <ArrowRightIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(list.listNo)}
                          title="Delete item list"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <TrashIcon className="h-6 w-6" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Item List?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Are you sure you want to delete <span className="font-bold text-gray-800 dark:text-white">{deleteTarget}</span>? This action cannot be undone.
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
