import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Quotations from "./pages/Quotations";
import CreateQuotation from "./pages/CreateQuotation";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="p-2 sm:p-4 md:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/quotations/create" element={<CreateQuotation />} />
          <Route path="/invoices/create" element={<CreateInvoice />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
