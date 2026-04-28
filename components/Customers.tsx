"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, MessageCircle, Star, ShoppingBag, Loader2, AlertTriangle, TrendingUp, Award, Phone, Mail, Calendar, ChevronRight, Users, X } from "lucide-react";
import toast from "react-hot-toast";

/* ── Helpers ── */
function loyaltyTier(spent: number) {
  if (spent >= 5000) return { label: "Gold",   color: "text-yellow-700 bg-yellow-50 border-yellow-200",   bar: "bg-yellow-400", pct: 100 };
  if (spent >= 2000) return { label: "Silver", color: "text-gray-600  bg-gray-50   border-gray-200",     bar: "bg-gray-400",   pct: Math.round((spent/5000)*100) };
  return               { label: "Bronze", color: "text-orange-700 bg-orange-50 border-orange-200",  bar: "bg-orange-400", pct: Math.round((spent/2000)*100) };
}
function daysSince(d: string) { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); }
function riskLabel(days: number) {
  if (days >= 14) return { text: "At Risk",  color: "bg-red-100 text-red-700" };
  if (days >= 7)  return { text: "Inactive", color: "bg-amber-100 text-amber-700" };
  return null;
}
function initials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2); }
const AVATAR_COLORS = ["bg-violet-600","bg-blue-600","bg-emerald-600","bg-orange-600","bg-pink-600","bg-indigo-600","bg-rose-600","bg-teal-600"];

interface Customer {
  _id: string; name: string; phone: string; email: string;
  totalOrders: number; totalSpent: number; lastVisit: string;
  favoriteService: string; loyaltyPoints: number;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<Customer | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/customers"); setCustomers(await r.json()); }
    catch { console.error("fetch customers failed"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  const atRisk   = customers.filter(c => daysSince(c.lastVisit) >= 7);
  const totalRev = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgVal   = customers.length ? Math.round(totalRev / customers.reduce((s,c)=>s+c.totalOrders,0) || 0) : 0;

  const sendWA = (c: Customer, reEngage = false) => {
    const msg = reEngage
      ? encodeURIComponent(`Hi ${c.name}! 👋 We miss you at Quick Dry Cleaning!\n\nCome back and get 15% OFF your next order — valid this week!\nYou have ${c.loyaltyPoints} loyalty points waiting. 🧺`)
      : encodeURIComponent(`Hi ${c.name}! 🌟 Thank you for choosing Quick Dry Cleaning, Hyderabad!\n\nYou have ${c.loyaltyPoints} loyalty points. Get 10% off your next visit! 🧺`);
    window.open(`https://wa.me/91${c.phone}?text=${msg}`, "_blank");
    toast.success(`WhatsApp sent to ${c.name}`);
  };

  const blastAll = () => {
    customers.forEach((c, i) => setTimeout(() => {
      const msg = encodeURIComponent(`Hi ${c.name}! 🎉 Weekend Special at Quick Dry Cleaning! 15% off Dry Clean this weekend. Book now! 🧺`);
      window.open(`https://wa.me/91${c.phone}?text=${msg}`, "_blank");
    }, i * 800));
    toast.success(`Blasting to ${customers.length} customers`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{customers.length} registered · ₹{totalRev.toLocaleString()} total revenue</p>
        </div>
        <button onClick={blastAll} disabled={customers.length === 0}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-all btn-press shadow-sm disabled:opacity-40">
          <MessageCircle className="w-4 h-4" /> WhatsApp Blast ({customers.length})
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Customers", value: customers.length,             icon: Users,       color: "bg-blue-50 border-blue-100",   iconBg: "bg-blue-100",   iconColor: "text-blue-600" },
          { label: "Total Revenue",   value: `₹${totalRev.toLocaleString()}`, icon: TrendingUp,  color: "bg-emerald-50 border-emerald-100", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
          { label: "Avg Order Value", value: `₹${avgVal}`,                 icon: ShoppingBag, color: "bg-purple-50 border-purple-100", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
          { label: "At Risk",         value: atRisk.length,                icon: AlertTriangle, color: "bg-amber-50 border-amber-100", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-2xl border p-4 card-hover animate-fade-in-up ${s.color}`} style={{ animationDelay: `${i*60}ms` }}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.iconBg}`}>
                <Icon className={`w-4 h-4 ${s.iconColor}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* At-Risk Banner */}
      {atRisk.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-bold text-amber-800">{atRisk.length} customers need re-engagement</p>
            <span className="text-xs text-amber-600 ml-auto font-medium">Haven&apos;t visited in 7+ days</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {atRisk.map(c => {
              const days = daysSince(c.lastVisit);
              const risk = riskLabel(days);
              const color = AVATAR_COLORS[c.name.charCodeAt(0) % AVATAR_COLORS.length];
              return (
                <div key={c._id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-amber-100 shadow-sm">
                  <div className={`w-7 h-7 rounded-full ${color} text-white flex items-center justify-center text-xs font-bold`}>{initials(c.name)}</div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{c.name.split(" ")[0]}</p>
                    <p className="text-[10px] text-gray-400">{days}d ago</p>
                  </div>
                  {risk && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${risk.color}`}>{risk.text}</span>}
                  <button onClick={() => sendWA(c, true)}
                    className="ml-1 flex items-center gap-1 text-[10px] font-bold bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 transition-colors btn-press">
                    <MessageCircle className="w-3 h-3" /> Re-engage
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input type="text" placeholder="Search by name or phone..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all shadow-sm" />
      </div>

      {/* Content area */}
      <div className="flex gap-5">

        {/* Customer Grid */}
        <div className={`${selected ? "w-[55%]" : "w-full"} transition-all duration-300`}>
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="skeleton w-12 h-12 rounded-full mb-3" />
                  <div className="skeleton h-3 w-24 mb-2" />
                  <div className="skeleton h-2.5 w-16 mb-4" />
                  <div className="skeleton h-2 w-full mb-1.5" />
                  <div className="skeleton h-2 w-3/4" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{customers.length === 0 ? "No customers yet. Place your first order!" : "No customers found"}</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${selected ? "grid-cols-2" : "grid-cols-3"}`}>
              {filtered.map((c, i) => {
                const tier  = loyaltyTier(c.totalSpent);
                const days  = daysSince(c.lastVisit);
                const risk  = riskLabel(days);
                const color = AVATAR_COLORS[c.name.charCodeAt(0) % AVATAR_COLORS.length];
                const isSelected = selected?._id === c._id;
                return (
                  <div key={c._id} onClick={() => setSelected(isSelected ? null : c)}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className={`bg-white rounded-2xl border cursor-pointer transition-all duration-200 card-hover animate-fade-in-up overflow-hidden ${isSelected ? "border-black shadow-md ring-2 ring-black/5" : "border-gray-100 shadow-sm hover:border-gray-300"}`}>

                    {/* Card header */}
                    <div className="p-5 pb-3">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center text-base font-bold shadow-sm`}>
                          {initials(c.name)}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${tier.color}`}>{tier.label}</span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.phone}</p>
                      {risk && <span className={`inline-block mt-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${risk.color}`}>{risk.text}</span>}
                    </div>

                    {/* Stats */}
                    <div className="px-5 pb-4 grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-xs font-bold text-gray-900">₹{c.totalSpent.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">Total spent</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-xs font-bold text-gray-900">{c.totalOrders}</p>
                        <p className="text-[10px] text-gray-400">Orders</p>
                      </div>
                    </div>

                    {/* Loyalty bar */}
                    <div className="px-5 pb-4">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>{c.loyaltyPoints} pts</span>
                        <span>{tier.label}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${tier.bar}`} style={{ width: `${tier.pct}%` }} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-50 px-5 py-3 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">{days === 0 ? "Today" : `${days}d ago`}</span>
                      <div className="flex gap-1.5">
                        <button onClick={e => { e.stopPropagation(); sendWA(c); }}
                          className="w-7 h-7 bg-green-600 text-white rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors btn-press">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isSelected ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isSelected ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="flex-1 animate-slide-in-right">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-20">

              {/* Panel header */}
              <div className="relative">
                <div className={`h-20 ${AVATAR_COLORS[selected.name.charCodeAt(0) % AVATAR_COLORS.length]} opacity-10`} />
                <div className="absolute inset-0 px-5 py-4 flex items-start justify-between">
                  <div className={`w-14 h-14 rounded-2xl ${AVATAR_COLORS[selected.name.charCodeAt(0) % AVATAR_COLORS.length]} text-white flex items-center justify-center text-lg font-bold shadow-md border-2 border-white mt-2`}>
                    {initials(selected.name)}
                  </div>
                  <button onClick={() => setSelected(null)} className="w-7 h-7 bg-white/80 backdrop-blur rounded-lg flex items-center justify-center hover:bg-white transition-colors btn-press border border-gray-100">
                    <X className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="flex items-end justify-between mb-1">
                  <div>
                    <p className="font-bold text-gray-900 text-base">{selected.name}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${loyaltyTier(selected.totalSpent).color}`}>
                      <Award className="w-3 h-3 inline mr-0.5" />{loyaltyTier(selected.totalSpent).label} Member
                    </span>
                  </div>
                </div>

                {/* Contact */}
                <div className="mt-4 space-y-2">
                  {[
                    { icon: Phone, val: selected.phone },
                    { icon: Mail,  val: selected.email || "—" },
                    { icon: Calendar, val: `Last visit: ${daysSince(selected.lastVisit) === 0 ? "Today" : `${daysSince(selected.lastVisit)} days ago`}` },
                  ].map((row, i) => {
                    const Icon = row.icon;
                    return (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-gray-600">
                        <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
                          <Icon className="w-3 h-3 text-gray-400" />
                        </div>
                        {row.val}
                      </div>
                    );
                  })}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  {[
                    { label: "Orders",   val: selected.totalOrders },
                    { label: "Spent",    val: `₹${selected.totalSpent.toLocaleString()}` },
                    { label: "Points",   val: selected.loyaltyPoints },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-sm font-bold text-gray-900">{m.val}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Loyalty bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span className="font-semibold">Loyalty Progress</span>
                    <span>{loyaltyTier(selected.totalSpent).label}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${loyaltyTier(selected.totalSpent).bar}`}
                      style={{ width: `${loyaltyTier(selected.totalSpent).pct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{loyaltyTier(selected.totalSpent).pct}% to {loyaltyTier(selected.totalSpent).label === "Gold" ? "max" : loyaltyTier(selected.totalSpent).label === "Silver" ? "Gold" : "Silver"}</p>
                </div>

                {/* AI Insight */}
                <div className="mt-5 bg-gray-950 text-white rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs font-bold text-gray-300">AI Customer Insight</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {selected.name.split(" ")[0]} prefers <span className="text-white font-semibold">{selected.favoriteService}</span> and has spent <span className="text-white font-semibold">₹{selected.totalSpent.toLocaleString()}</span> across {selected.totalOrders} visits.
                    {selected.totalSpent >= 2000 ? " High-value customer — offer priority service and exclusive discounts." : " Growing customer — encourage repeat visits with loyalty rewards."}
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mt-5">
                  <button onClick={() => sendWA(selected)}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-green-700 transition-all btn-press shadow-sm">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button onClick={() => sendWA(selected, true)}
                    className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all btn-press">
                    <TrendingUp className="w-3.5 h-3.5" /> Re-engage
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
