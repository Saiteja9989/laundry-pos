"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search, MessageCircle, CheckCircle, Clock, Package, Truck,
  Loader2, Sparkles, QrCode, Printer, Download, RefreshCw,
  X, Zap, Bell,
} from "lucide-react";
import toast from "react-hot-toast";

interface Order {
  orderId: string;
  customer: { name: string; phone: string; email?: string };
  itemsSummary: string;
  primaryService: string;
  status: string;
  total: number;
  priority: string;
  createdAt: string;
}

const STATUS_CFG: Record<string, { bg: string; text: string; dot: string; icon: React.ComponentType<{ className?: string }> }> = {
  Pending:    { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   icon: Clock },
  Processing: { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    icon: Package },
  Ready:      { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle },
  Delivered:  { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400",    icon: Truck },
};

const STAT_CARDS = [
  { key: "Pending",    label: "Pending",    light: "bg-amber-50 text-amber-600" },
  { key: "Processing", label: "Processing", light: "bg-blue-50 text-blue-600" },
  { key: "Ready",      label: "Ready",      light: "bg-emerald-50 text-emerald-600" },
  { key: "Delivered",  label: "Delivered",  light: "bg-gray-50 text-gray-600" },
];

export default function Orders() {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("All");
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchActive, setAiSearchActive]   = useState(false);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchOrders = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/orders");
      setOrders(await res.json());
    } catch { console.error("Failed to fetch orders"); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const aiSearch = async () => {
    if (!search.trim()) return;
    setAiSearchLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: search }),
      });
      const data = await res.json();
      setOrders(data.orders);
      setAiSearchActive(true);
      setFilter("All");
    } catch { console.error("AI search failed"); }
    setAiSearchLoading(false);
  };

  const filtered = orders.filter(o => {
    const matchSearch = aiSearchActive
      ? true
      : (o.customer?.name?.toLowerCase().includes(search.toLowerCase()) || o.orderId?.includes(search));
    const matchFilter = filter === "All" || o.status === filter;
    return matchSearch && matchFilter;
  });

  // Status update — no auto WhatsApp popup (avoids freeze), shows toast with WA button
  const updateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    // Optimistic UI update
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (newStatus === "Ready" || newStatus === "Delivered") {
        const msg = newStatus === "Ready"
          ? `Hi ${order.customer.name}! 🎉 Your order ${order.orderId} is ready for pickup! Items: ${order.itemsSummary}. Amount: ₹${order.total}. Quick Dry Cleaning, Hyderabad 🧺`
          : `Hi ${order.customer.name}! ✅ Order ${order.orderId} delivered. Thank you! Quick Dry Cleaning, Hyderabad 🧺`;

        const waUrl = `https://wa.me/91${order.customer.phone}?text=${encodeURIComponent(msg)}`;

        toast((t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Status → <strong>{newStatus}</strong></span>
            <button
              onClick={() => { window.open(waUrl, "_blank"); toast.dismiss(t.id); }}
              className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-700"
            >
              <MessageCircle className="w-3 h-3" /> Send WA
            </button>
          </div>
        ), { duration: 6000 });
      } else {
        toast.success(`${order.orderId} → ${newStatus}`);
      }
    } catch {
      toast.error("Failed to update status");
      // Revert on error
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: order.status } : o));
    }
  };

  const sendWhatsApp = (order: Order) => {
    const msgs: Record<string, string> = {
      Pending:    `Hi ${order.customer.name}! 📋 Order ${order.orderId} received. Items: ${order.itemsSummary}. Amount: ₹${order.total}. Quick Dry Cleaning, Hyderabad 🧺`,
      Processing: `Hi ${order.customer.name}! ⚙️ Order ${order.orderId} is being processed. We'll notify when ready. Quick Dry Cleaning, Hyderabad 🧺`,
      Ready:      `Hi ${order.customer.name}! 🎉 Order ${order.orderId} is ready for pickup! Items: ${order.itemsSummary}. Amount: ₹${order.total}. Quick Dry Cleaning, Hyderabad 🧺`,
      Delivered:  `Hi ${order.customer.name}! ✅ Thank you for collecting order ${order.orderId}. Quick Dry Cleaning, Hyderabad 🧺`,
    };
    const msg = encodeURIComponent(msgs[order.status] ?? `Update on order ${order.orderId}. Quick Dry Cleaning 🧺`);
    window.open(`https://wa.me/91${order.customer.phone}?text=${msg}`, "_blank");
  };

  const exportCSV = () => {
    const headers = ["Order ID", "Customer", "Phone", "Items", "Service", "Status", "Amount (INR)", "Priority", "Date"];
    const rows = orders.map(o => [
      o.orderId,
      `"${o.customer?.name ?? ""}"`,
      `"'${o.customer?.phone ?? ""}"`,
      `"${o.itemsSummary ?? ""}"`,
      `"${o.primaryService ?? ""}"`,
      o.status, o.total, o.priority,
      new Date(o.createdAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${orders.length} orders`);
  };

  const notifyAllReady = () => {
    const readyOrders = orders.filter(o => o.status === "Ready");
    if (readyOrders.length === 0) return;
    readyOrders.forEach((order, i) => {
      setTimeout(() => {
        const msg = encodeURIComponent(`Hi ${order.customer.name}! 🎉 Your order ${order.orderId} is ready for pickup!\n\nItems: ${order.itemsSummary}\nAmount: ₹${order.total}\n\nQuick Dry Cleaning, Hyderabad 🧺`);
        window.open(`https://wa.me/91${order.customer.phone}?text=${msg}`, "_blank");
      }, i * 1000);
    });
    toast.success(`Notifying ${readyOrders.length} customers`);
  };

  // Invoice — opens in new tab WITHOUT auto-print (prevents page freeze)
  const printInvoice = (order: Order) => {
    const today = new Date(order.createdAt).toLocaleDateString("en-IN");
    const html = `<!DOCTYPE html><html><head><title>Invoice ${order.orderId}</title>
    <style>
      body{font-family:Arial,sans-serif;max-width:520px;margin:30px auto;color:#111;font-size:14px}
      h2{margin:0;font-size:20px}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th{background:#111;color:#fff;padding:8px 10px;text-align:left;font-size:12px}
      td{padding:7px 10px;border-bottom:1px solid #eee}
      .right{text-align:right}
      .total-row td{background:#f5f5f5;font-weight:bold}
      .footer{font-size:11px;color:#999;text-align:center;margin-top:24px}
      .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:bold;background:#111;color:#fff}
      .print-btn{display:block;margin:20px auto;padding:10px 32px;background:#111;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:bold}
      @media print{.print-btn{display:none}}
    </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:14px">
        <div><h2>Quick Dry Cleaning</h2><p style="margin:3px 0;font-size:12px;color:#666">Hyderabad</p><p style="margin:3px 0;font-size:12px;color:#666">GST/Tax Invoice</p></div>
        <div style="text-align:right"><p style="font-size:22px;font-weight:bold;margin:0">${order.orderId}</p><p style="font-size:12px;color:#666;margin:2px 0">Date: ${today}</p><span class="badge">${order.status}</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;font-size:13px">
        <div>
          <p style="margin:3px 0"><strong>Customer:</strong> ${order.customer.name}</p>
          <p style="margin:3px 0"><strong>Phone:</strong> ${order.customer.phone}</p>
          ${order.customer.email ? `<p style="margin:3px 0"><strong>Email:</strong> ${order.customer.email}</p>` : ""}
        </div>
        <div style="text-align:right">
          <p style="margin:3px 0"><strong>Service:</strong> ${order.primaryService}</p>
          <p style="margin:3px 0"><strong>Priority:</strong> ${order.priority}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>Item Description</th><th class="right">Amount</th></tr></thead>
        <tbody>
          <tr><td>${order.itemsSummary}<br/><span style="font-size:12px;color:#666">${order.primaryService}</span></td><td class="right">&#8377;${order.total}</td></tr>
          <tr class="total-row"><td style="text-align:right;font-weight:bold">TOTAL AMOUNT</td><td class="right">&#8377;${order.total}</td></tr>
        </tbody>
      </table>
      <div style="border:1px solid #eee;border-radius:8px;padding:12px;font-size:12px">
        <p style="margin:0 0 6px 0;font-weight:bold">Terms & Conditions</p>
        <p style="margin:2px 0;color:#666">• Items not collected within 30 days will be disposed of.</p>
        <p style="margin:2px 0;color:#666">• Not responsible for pre-existing damage.</p>
        <p style="margin:2px 0;color:#666">• Payment due at time of pickup.</p>
      </div>
      <div class="footer">
        <p>Thank you for choosing Quick Dry Cleaning, Hyderabad!</p>
        <p style="margin-top:8px">Authorized Signature: _______________________</p>
      </div>
      <button class="print-btn" onclick="window.print()">🖨️ Print Invoice</button>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const readyCount = orders.filter(o => o.status === "Ready").length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${orders.length} total · ${filtered.length} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {readyCount > 0 && (
            <button onClick={notifyAllReady}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all btn-press shadow-sm">
              <Bell className="w-4 h-4" />
              Notify Ready ({readyCount})
            </button>
          )}
          <button onClick={exportCSV}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all btn-press">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => fetchOrders(true)}
            className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all btn-press">
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3">
        {STAT_CARDS.map((sc, i) => {
          const count = orders.filter(o => o.status === sc.key).length;
          const Icon = STATUS_CFG[sc.key].icon;
          const active = filter === sc.key;
          return (
            <button key={sc.key} onClick={() => setFilter(active ? "All" : sc.key)}
              className={`relative bg-white border rounded-2xl p-4 text-left transition-all duration-200 card-hover animate-fade-in-up delay-${(i+1)*50} ${active ? "border-gray-900 shadow-md" : "border-gray-100"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${sc.light}`}>{sc.label}</span>
                <div className={`w-7 h-7 rounded-lg ${sc.light} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900">{count}</p>
              {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-b-2xl" />}
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder='AI Search: "show ready orders", "rahul dry clean"…'
              value={search}
              onChange={e => { setSearch(e.target.value); if (aiSearchActive) { fetchOrders(); setAiSearchActive(false); } }}
              onKeyDown={e => e.key === "Enter" && aiSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-900 transition-all"
            />
            {aiSearchActive && (
              <button onClick={() => { fetchOrders(); setAiSearchActive(false); setSearch(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-700" />
              </button>
            )}
          </div>
          <button onClick={aiSearch} disabled={aiSearchLoading || !search.trim()}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all btn-press">
            {aiSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Search
          </button>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1">
          {["All", "Pending", "Processing", "Ready", "Delivered"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === s ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* AI Banner */}
      {aiSearchActive && (
        <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-2.5 animate-fade-in">
          <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
          <p className="text-sm text-violet-700 font-medium flex-1">
            AI found <strong>{filtered.length}</strong> results for <em>"{search}"</em>
          </p>
          <button onClick={() => { fetchOrders(); setAiSearchActive(false); setSearch(""); }}
            className="text-xs text-violet-500 hover:text-violet-700 font-semibold">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Loading orders…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
            <Package className="w-8 h-8 opacity-30" />
            <p className="text-sm font-medium">{orders.length === 0 ? "No orders yet" : "No orders match"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {["Order", "Customer", "Items", "Status", "Amount", "Priority", "Actions"].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order, idx) => {
                  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG["Pending"];
                  const date = new Date(order.createdAt);
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <tr key={order.orderId}
                      style={{ animationDelay: `${idx * 30}ms` }}
                      className="group hover:bg-gray-50/60 transition-colors row-enter">

                      {/* Order */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-mono font-bold text-gray-900">{order.orderId}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {isToday ? `Today ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : date.toLocaleDateString("en-IN")}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {order.customer?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{order.customer?.name}</p>
                            <p className="text-[11px] text-gray-400">{order.customer?.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5 max-w-[160px]">
                        <p className="text-sm text-gray-800 font-medium truncate">{order.itemsSummary}</p>
                        <p className="text-[11px] text-gray-400">{order.primaryService}</p>
                      </td>

                      {/* Status — simple native select, most reliable */}
                      <td className="px-4 py-3.5">
                        <select
                          value={order.status}
                          onChange={e => updateStatus(order.orderId, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer outline-none ${cfg.bg} ${cfg.text}`}
                        >
                          {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-black text-gray-900">₹{order.total}</p>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5">
                        {order.priority === "Express" ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg w-fit">
                            <Zap className="w-3 h-3" /> Express
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Standard</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <a href={`/track/${order.orderId}`} target="_blank"
                            className="flex items-center gap-1 text-[11px] font-medium border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <QrCode className="w-3 h-3" /> Track
                          </a>
                          <button onClick={() => printInvoice(order)}
                            className="flex items-center gap-1 text-[11px] font-medium border border-gray-200 text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <Printer className="w-3 h-3" /> Invoice
                          </button>
                          <button onClick={() => sendWhatsApp(order)}
                            className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 rounded-lg transition-colors">
                            <MessageCircle className="w-3 h-3" /> WA
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
