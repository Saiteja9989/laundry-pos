"use client";
import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import NewOrder from "@/components/NewOrder";
import Orders from "@/components/Orders";
import Customers from "@/components/Customers";
import AIChat from "@/components/AIChat";
import {
  LayoutDashboard, PlusCircle, ClipboardList, Users,
  Bell, CheckCircle, Clock, TrendingUp, Shirt,
  ChevronRight,
} from "lucide-react";

const tabs = [
  { id: "dashboard",  label: "Dashboard",  icon: LayoutDashboard, desc: "Overview & analytics" },
  { id: "new-order",  label: "New Order",   icon: PlusCircle,      desc: "Create order" },
  { id: "orders",     label: "Orders",      icon: ClipboardList,   desc: "Manage orders" },
  { id: "customers",  label: "Customers",   icon: Users,           desc: "Customer profiles" },
];

interface Notif { id: number; text: string; sub: string; type: "ready"|"pending"|"info"; }

export default function Home() {
  const [activeTab, setActiveTab]   = useState("dashboard");
  const [notifs, setNotifs]         = useState<Notif[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unread, setUnread]         = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch("/api/dashboard");
        const data = await res.json();
        const n: Notif[] = [];
        if (data.ready   > 0) n.push({ id: 1, text: `${data.ready} orders ready for pickup`,   sub: "Send WhatsApp reminders",       type: "ready"   });
        if (data.pending > 0) n.push({ id: 2, text: `${data.pending} orders pending`,           sub: "Start processing soon",         type: "pending" });
        if (data.todayRevenue > 0) n.push({ id: 3, text: `Today's revenue: ₹${data.todayRevenue}`, sub: "Keep up the great work!",   type: "info"    });
        setNotifs(n); setUnread(n.length);
      } catch { /* silent */ }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const nIcon  = { ready: CheckCircle, pending: Clock, info: TrendingUp };
  const nColor = { ready: "text-emerald-500 bg-emerald-50", pending: "text-amber-500 bg-amber-50", info: "text-blue-500 bg-blue-50" };

  const currentTab = tabs.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20">

        {/* Brand */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-md">
              <Shirt className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">CleanPOS</p>
              <p className="text-[11px] text-gray-400 leading-tight">Quick Dry Cleaning</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pb-2">Navigation</p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group btn-press ${
                  active
                    ? "bg-black text-white font-semibold shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
                }`}>
                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`} />
                <span className="flex-1 text-left">{tab.label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                {tab.id === "new-order" && !active && (
                  <span className="w-5 h-5 bg-gray-100 text-gray-500 text-xs rounded-lg flex items-center justify-center font-bold">+</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status */}
        <div className="px-4 pb-5 space-y-3">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-semibold text-gray-600">System Online</span>
            </div>
            <p className="text-[10px] text-gray-400">MongoDB · Groq AI · Active</p>
          </div>
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-black text-white flex items-center justify-center text-xs font-bold shadow-sm">Q</div>
            <div>
              <p className="text-xs font-semibold text-gray-800">Quick Dry Cleaning</p>
              <p className="text-[10px] text-gray-400">Hyderabad</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────── */}
      <div className="ml-60 flex-1 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="glass sticky top-0 z-10 border-b border-gray-100/80 px-8 py-0 flex items-center justify-between h-14">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 font-medium">CleanPOS</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-semibold text-gray-900">{currentTab.label}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live badge */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </div>

            {/* Bell */}
            <div className="relative">
              <button onClick={() => { setShowNotifs(v => !v); setUnread(0); }}
                className="w-8 h-8 rounded-xl border border-gray-100 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors btn-press relative">
                <Bell className="w-3.5 h-3.5 text-gray-600" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                    {unread}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-down">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">Notifications</p>
                    <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{notifs.length} new</span>
                  </div>
                  {notifs.length === 0
                    ? <p className="text-xs text-gray-400 text-center py-8">All caught up!</p>
                    : notifs.map((n, i) => {
                        const Icon = nIcon[n.type];
                        return (
                          <div key={n.id} onClick={() => { setShowNotifs(false); setActiveTab(n.type === "info" ? "dashboard" : "orders"); }}
                            style={{ animationDelay: `${i * 50}ms` }}
                            className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors animate-fade-in">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${nColor[n.type]}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900">{n.text}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{n.sub}</p>
                            </div>
                          </div>
                        );
                      })}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-8 py-6">
          <div key={activeTab} className="animate-fade-in-up">
            {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === "new-order" && <NewOrder setActiveTab={setActiveTab} />}
            {activeTab === "orders"    && <Orders />}
            {activeTab === "customers" && <Customers />}
          </div>
        </main>
      </div>

      {/* AI Chat */}
      <AIChat />

      {/* Backdrop for notifs */}
      {showNotifs && <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />}
    </div>
  );
}
