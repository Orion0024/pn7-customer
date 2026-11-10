import React, { useState, useEffect } from 'react';

const API_URL = "https://sheetdb.io/api/v1/rquudl7z1svhb";
const CACHE_KEY = "pn7_customers_cache";
const LAST_FETCH_KEY = "pn7_last_fetch_time";

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Show toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Fetch data with 60-second localStorage throttle rule
  const fetchCustomers = async (force = false) => {
    const lastFetch = localStorage.getItem(LAST_FETCH_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);
    const now = Date.now();

    if (!force && cachedData && lastFetch && (now - parseInt(lastFetch) < 60000)) {
      setCustomers(JSON.parse(cachedData));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCustomers(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(LAST_FETCH_KEY, now.toString());
      }
    } catch (error) {
      console.error("Failed to fetch from SheetDB:", error);
      if (cachedData) {
        setCustomers(JSON.parse(cachedData));
        showToast("Loaded from offline cache", "error");
      } else {
        showToast("Failed to load data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }

    const now = new Date();
    const id = `CUST-${Date.now().toString().slice(-6)}`;
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    const newCustomer = { id, date, time, name: name.trim(), phone: phone.trim() };

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [newCustomer] }),
      });

      if (response.ok) {
        const updatedList = [newCustomer, ...customers];
        setCustomers(updatedList);
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedList));
        localStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
        
        setName('');
        setPhone('');
        showToast("Customer saved successfully");
      } else {
        throw new Error("Server error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save customer", "error");
    } finally {
      setLoading(false);
    }
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    if (customers.length === 0) {
      showToast("No data to export", "error");
      return;
    }
    const headers = ["ID", "Date", "Time", "Name", "Phone"];
    const rows = customers.map(c => [c.id, c.date, c.time, `"${c.name}"`, `"${c.phone}"`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PN7_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV Exported successfully");
  };

  // Share Data via Web Share API or Clipboard
  const handleShare = async () => {
    const summary = customers.map(c => `${c.name} (${c.phone}) - ${c.date}`).join("\n");
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PN7 Automobile Customers',
          text: summary,
        });
      } catch (err) {
        console.log("Share canceled");
      }
    } else {
      navigator.clipboard.writeText(summary);
      showToast("Customer list copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 p-4 sm:p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">PN7 Automobile Customer Info</h1>
            <p className="text-sm text-zinc-500">Manage showroom customer records efficiently</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => fetchCustomers(true)}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Export
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors"
              title="Share / Copy"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            </button>
          </div>
        </header>

        {/* Input Form Card */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Customer Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end mt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>}
                Save Record
              </button>
            </div>
          </form>
        </section>

        {/* Table View */}
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Customer Records</h2>
            <span className="text-xs bg-zinc-100 px-2.5 py-1 rounded-full text-zinc-600 font-medium">{customers.length} Entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">ID</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Time</th>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-zinc-400">No customer records found.</td>
                  </tr>
                ) : (
                  customers.map((c, index) => (
                    <tr key={c.id || index} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-zinc-500">{c.id}</td>
                      <td className="py-3 px-4 text-zinc-600">{c.date}</td>
                      <td className="py-3 px-4 text-zinc-600">{c.time}</td>
                      <td className="py-3 px-4 font-medium text-zinc-900">{c.name}</td>
                      <td className="py-3 px-4 text-zinc-600">{c.phone}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all z-50 ${toast.type === 'error' ? 'bg-red-600' : 'bg-zinc-900'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
