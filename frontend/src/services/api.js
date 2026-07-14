import axios from 'axios';

// Vite proxy routes all `/api/*` to backend server in local dev.
// On Vercel, it routes using vercel.json rewrite rules.
// Using a relative baseURL allows same code to run in all environments.
const API = axios.create({
  baseURL: '/api',
});

export const api = {
  // Customers CRUD
  getCustomers: () => API.get('/customers').then(res => res.data),
  createCustomer: (customer) => API.post('/customers', customer).then(res => res.data),
  updateCustomer: (id, customer) => API.put(`/customers/${id}`, customer).then(res => res.data),
  deleteCustomer: (id) => API.delete(`/customers/${id}`).then(res => res.data),

  // Quotations CRUD
  getQuotations: () => API.get('/quotations').then(res => res.data),
  createQuotation: (quotation) => API.post('/quotations', quotation).then(res => res.data),
  updateQuotation: (quotNo, quotation) => API.put(`/quotations/${quotNo}`, quotation).then(res => res.data),
  deleteQuotation: (quotNo) => API.delete(`/quotations/${quotNo}`).then(res => res.data),

  // Invoices CRUD
  getInvoices: () => API.get('/invoices').then(res => res.data),
  createInvoice: (invoice) => API.post('/invoices', invoice).then(res => res.data),
  updateInvoice: (invoiceNo, invoice) => API.put(`/invoices/${invoiceNo}`, invoice).then(res => res.data),
  deleteInvoice: (invoiceNo) => API.delete(`/invoices/${invoiceNo}`).then(res => res.data),

  // Item Lists CRUD
  getItemLists: () => API.get('/item-lists').then(res => res.data),
  createItemList: (list) => API.post('/item-lists', list).then(res => res.data),
  updateItemList: (listNo, list) => API.put(`/item-lists/${listNo}`, list).then(res => res.data),
  deleteItemList: (listNo) => API.delete(`/item-lists/${listNo}`).then(res => res.data),
};

export default api;
