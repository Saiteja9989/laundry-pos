"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, Package, Clock, CheckCircle, Plus, Loader2, Sparkles, TrendingDown, IndianRupee, Users } from "lucide-react";

interface DashboardData {
  todayRevenue: number;
  totalOrders: number;
  pending: number;
  ready: number;
  weekData: { day: string; revenue: number; orders: number }[];
  recentOrders: { id: string; customer: string; items: string; status: string; amount: string; time: string }[];
  totalRevenue?: number;
}

interface ForecastData {
  forecast: string;
  insight: string;
  action: string;
  weekData: { day: string; revenue: number; orders: number }[];
}

const statusColor: Record<string, string> = {
  Ready: "bg-emerald-100 text-emerald-700",
  Processing: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  Delivered: "bg-gray-100 text-gray-600",
};

/* ── Animated counter hook ── */
function useCounter(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return value;
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 p-4 bg-white">
      <div className="skeleton h-3 w-20 mb-4" />
      <div className="skeleton h-8 w-16 mb-2" />
      <div className="skeleton h-2.5 w-28" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="skeleton h-3 w-28 mb-4" />
      <div className="skeleton h-44 w-full" />
    </div>
  );
}

/* ── Stat card with animated counter ── */
function StatCard({ label, target, prefix = "", sub, icon: Icon, bg, iconBg, iconColor, border, delay }:
  { label: string; target: number; prefix?: string; sub: string; icon: React.ComponentType<{ className?: string }>;
    bg: string; iconBg: string; iconColor: string; border: string; delay: string }) {
  const value = useCounter(target);
  return (
    <div className={`rounded-xl border p-4 card-hover animate-fade-in-up ${delay} ${bg} ${border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 animate-count-up tabular-nums">
        {prefix}{value.toLocaleString()}
      </p>
      <p className="text-xs font-semibold text-gray-600 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(true);

  const fetchData = useCallback(async () => {
    setLoadingDash(true);
    try { const res = await fetch("/api/dashboard"); setData(await res.json()); }
    catch { console.error("Dashboard fetch failed"); }
    setLoadingDash(false);
  }, []);

  const fetchForecast = useCallback(async () => {
    setLoadingForecast(true);
    try { const res = await fetch("/api/ai-forecast"); setForecast(await res.json()); }
    catch { console.error("Forecast fetch failed"); }
    setLoadingForecast(false);
  }, []);

  useEffect(() => { fetchData(); fetchForecast(); }, [fetchData, fetchForecast]);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const chartData = forecast?.weekData ?? data?.weekData ?? [];

  const stats = [
    { label: "Today's Revenue", target: data?.todayRevenue ?? 0, prefix: "₹", sub: "From today's orders", icon: IndianRupee, bg: "bg-emerald-50", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", border: "border-emerald-100", delay: "delay-50" },
    { label: "Total Orders",    target: data?.totalOrders ?? 0,  prefix: "",  sub: "All time",            icon: Package,      bg: "bg-blue-50",   iconBg: "bg-blue-100",   iconColor: "text-blue-600",   border: "border-blue-100",   delay: "delay-100" },
    { label: "Pending",         target: data?.pending ?? 0,      prefix: "",  sub: "Needs attention",     icon: Clock,        bg: "bg-amber-50",  iconBg: "bg-amber-100",  iconColor: "text-amber-600",  border: "border-amber-100",  delay: "delay-150" },
    { label: "Ready for Pickup",target: data?.ready ?? 0,        prefix: "",  sub: "Notify customers",    icon: CheckCircle,  bg: "bg-purple-50", iconBg: "bg-purple-100", iconColor: "text-purple-600", border: "border-purple-100", delay: "delay-200" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{today}</p>
        </div>
        <button onClick={() => setActiveTab("new-order")}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all btn-press shadow-md hover:shadow-lg">
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {loadingDash
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((s) => <StatCard key={s.label} {...s} />)
        }
      </div>

      {/* AI Forecast Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* AI Forecast — animated gradient */}
        <div className="relative rounded-xl overflow-hidden animate-fade-in-up delay-200">
          <div className="gradient-border absolute inset-0 rounded-xl" />
          <div className="relative bg-gray-950 text-white rounded-xl p-5 m-[1.5px] flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                </div>
                <span className="text-xs font-semibold text-gray-300">AI Revenue Forecast</span>
              </div>
              {loadingForecast && <Loader2 className="w-3 h-3 animate-spin text-gray-500" />}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tomorrow&apos;s Predicted Revenue</p>
              <p className="text-3xl font-bold tracking-tight">
                {loadingForecast ? <span className="skeleton inline-block w-24 h-8 rounded-lg" /> : forecast?.forecast ?? "—"}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">AI Insight</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {loadingForecast ? "Analyzing patterns..." : forecast?.insight}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col card-hover animate-fade-in-up delay-250">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span className="text-xs font-semibold text-gray-700">AI Recommendation</span>
          </div>
          <p className="text-sm text-gray-600 flex-1 leading-relaxed">
            {loadingForecast
              ? <><span className="skeleton block h-3 w-full mb-2 rounded" /><span className="skeleton block h-3 w-3/4 rounded" /></>
              : forecast?.action}
          </p>
          <button onClick={() => setActiveTab("orders")}
            className="mt-4 w-full text-xs bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-all btn-press">
            View Orders →
          </button>
        </div>

        {/* Business Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 card-hover animate-fade-in-up delay-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Business Summary</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "7-Day Revenue", value: `₹${chartData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}` },
              { label: "7-Day Orders",  value: chartData.reduce((s, d) => s + d.orders, 0).toString() },
              { label: "Avg Order Value", value: data?.totalOrders ? `₹${Math.round((data.totalRevenue ?? 0) / data.totalOrders || 0)}` : "₹0" },
              { label: "Ready Pickup",  value: `${data?.ready ?? 0} orders` },
            ].map((item, i) => (
              <div key={item.label} className={`flex justify-between items-center py-1.5 border-b border-gray-50 animate-fade-in delay-${(i+2)*50}`}>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-sm font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      {loadingDash ? (
        <div className="grid grid-cols-2 gap-4">
          <SkeletonChart /><SkeletonChart />
        </div>
      ) : chartData.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 card-hover animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Weekly Revenue</p>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">Last 7 days</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#000" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`₹${v}`, "Revenue"]} contentStyle={{ borderRadius: "10px", border: "1px solid #f3f4f6", fontSize: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                <Area type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: "#000", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#000" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 card-hover animate-fade-in-up delay-350">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Orders This Week</p>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">Last 7 days</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #f3f4f6", fontSize: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="orders" fill="#000" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {(data?.recentOrders?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 animate-fade-in-up delay-400">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Recent Orders</p>
            <button onClick={() => setActiveTab("orders")} className="text-xs text-gray-400 hover:text-black transition-colors">View all →</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {["Order ID", "Customer", "Items", "Status", "Amount", "Time"].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-400 font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders.map((order, i) => (
                <tr key={order.id} className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors row-enter delay-${i * 50}`}>
                  <td className="px-5 py-3 text-xs font-mono text-gray-400">{order.id}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">{order.customer}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{order.items}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColor[order.status] ?? "bg-gray-100 text-gray-700"}`}>{order.status}</span>
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-gray-900">{order.amount}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(data?.totalOrders ?? 0) === 0 && !loadingDash && (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center animate-scale-in">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
            <Package className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm mb-4">No orders yet. Start by placing your first order.</p>
          <button onClick={() => setActiveTab("new-order")}
            className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all btn-press shadow-md">
            Place First Order
          </button>
        </div>
      )}
    </div>
  );
}
