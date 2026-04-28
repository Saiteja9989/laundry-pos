"use client";
import { useState, useRef } from "react";
import {
  Sparkles, Plus, Trash2, Loader2, CheckCircle, Mic, MicOff,
  Printer, QrCode, Zap, CreditCard, Banknote, Smartphone, User,
  Phone, Mail, AlertTriangle, ChevronDown, ShoppingBag, Clock,
} from "lucide-react";
import toast from "react-hot-toast";

const SERVICES   = ["Wash & Fold", "Dry Clean", "Steam Iron", "Wash & Iron", "Stain Removal"];
const GARMENTS   = ["Shirt", "Trouser", "Saree", "Suit", "Kurta", "Lehenga", "Jacket", "Bedsheet", "Curtain", "Other"];
const GARMENT_EMOJI: Record<string, string> = {
  Shirt:"👔", Trouser:"👖", Saree:"🥻", Suit:"🤵", Kurta:"👘",
  Lehenga:"👗", Jacket:"🧥", Bedsheet:"🛏️", Curtain:"🪟", Other:"📦",
};

interface Item { garment: string; service: string; qty: number; price: number; }

const PRICE_TABLE: Record<string, Record<string, number>> = {
  Shirt:    { "Wash & Fold": 50,  "Wash & Iron": 70,  "Dry Clean": 120, "Steam Iron": 40,  "Stain Removal": 100 },
  Trouser:  { "Wash & Fold": 60,  "Wash & Iron": 80,  "Dry Clean": 130, "Steam Iron": 50,  "Stain Removal": 110 },
  Saree:    { "Wash & Fold": 150, "Wash & Iron": 180, "Dry Clean": 250, "Steam Iron": 120, "Stain Removal": 200 },
  Suit:     { "Wash & Fold": 200, "Wash & Iron": 250, "Dry Clean": 400, "Steam Iron": 180, "Stain Removal": 300 },
  Kurta:    { "Wash & Fold": 60,  "Wash & Iron": 80,  "Dry Clean": 130, "Steam Iron": 50,  "Stain Removal": 100 },
  Lehenga:  { "Wash & Fold": 200, "Wash & Iron": 250, "Dry Clean": 450, "Steam Iron": 180, "Stain Removal": 350 },
  Jacket:   { "Wash & Fold": 150, "Wash & Iron": 180, "Dry Clean": 350, "Steam Iron": 140, "Stain Removal": 250 },
  Bedsheet: { "Wash & Fold": 100, "Wash & Iron": 130, "Dry Clean": 200, "Steam Iron": 80,  "Stain Removal": 150 },
  Curtain:  { "Wash & Fold": 120, "Wash & Iron": 150, "Dry Clean": 220, "Steam Iron": 100, "Stain Removal": 180 },
  Other:    { "Wash & Fold": 80,  "Wash & Iron": 100, "Dry Clean": 180, "Steam Iron": 70,  "Stain Removal": 150 },
};

const PAYMENT_OPTIONS = [
  { value: "Cash",      icon: Banknote,    color: "hover:border-emerald-400 hover:bg-emerald-50", active: "border-emerald-500 bg-emerald-50 text-emerald-700" },
  { value: "UPI",       icon: Smartphone,  color: "hover:border-blue-400 hover:bg-blue-50",       active: "border-blue-500 bg-blue-50 text-blue-700" },
  { value: "Card",      icon: CreditCard,  color: "hover:border-purple-400 hover:bg-purple-50",   active: "border-purple-500 bg-purple-50 text-purple-700" },
  { value: "Pay Later", icon: Clock,       color: "hover:border-orange-400 hover:bg-orange-50",   active: "border-orange-500 bg-orange-50 text-orange-700" },
];

export default function NewOrder({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [customer, setCustomer]       = useState({ name: "", phone: "", email: "" });
  const [items, setItems]             = useState<Item[]>([{ garment: "Shirt", service: "Wash & Fold", qty: 1, price: 0 }]);
  const [express, setExpress]         = useState(false);
  const [paymentMethod, setPayment]   = useState("Cash");
  const [damageNotes, setDamageNotes] = useState("");
  const [damageReport, setDamageReport] = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiTip, setAiTip]             = useState("");
  const [placing, setPlacing]         = useState(false);
  const [listening, setListening]     = useState(false);
  const [placed, setPlaced]           = useState<{ orderId: string } | null>(null);
  const [qrUrl, setQrUrl]             = useState("");
  const recogRef = useRef<SpeechRecognition | null>(null);

  const addItem    = () => setItems(p => [...p, { garment: "Shirt", service: "Wash & Fold", qty: 1, price: 0 }]);
  const removeItem = (i: number) => { if (items.length === 1) return; setItems(p => p.filter((_, x) => x !== i)); };
  const setItem    = (i: number, k: keyof Item, v: string | number) => setItems(p => p.map((it, x) => x === i ? { ...it, [k]: v } : it));

  const subtotal   = items.reduce((s, i) => s + i.price * i.qty, 0);
  const expressFee = express ? Math.round(subtotal * 0.3) : 0;
  const total      = subtotal + expressFee;

  const applyAiPrices = async () => {
    setAiLoading(true); setAiTip("");
    try {
      const res  = await fetch("/api/ai-price", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
      const data = await res.json();
      setAiTip(data.result);
      setItems(p => p.map(it => ({ ...it, price: PRICE_TABLE[it.garment]?.[it.service] ?? it.price })));
      toast.success("AI prices applied!");
    } catch { toast.error("Could not fetch AI prices."); }
    setAiLoading(false);
  };

  const toggleVoice = () => {
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Use Chrome for voice input"); return; }
    const r = new SR(); r.continuous = true; r.interimResults = true; r.lang = "en-IN";
    r.onresult = (e: SpeechRecognitionEvent) => setDamageNotes(Array.from(e.results).map(x => x[0].transcript).join(" "));
    r.onend = () => setListening(false);
    r.start(); recogRef.current = r; setListening(true);
    toast("Listening… speak now", { icon: "🎙️" });
  };

  const generateReport = () => {
    if (!damageNotes.trim()) return;
    const today = new Date().toLocaleDateString("en-IN");
    setDamageReport(`Quick Dry Cleaning, Hyderabad — Damage Report
Date: ${today}  |  Customer: ${customer.name || "Walk-in"}
Items: ${items.map(i => `${i.qty}x ${i.garment}`).join(", ")}

Damage Noted: ${damageNotes}

Assessment: Damage pre-existed before drop-off. Quick Dry Cleaning is not liable.

Manager Signature: ___________________  Date: ${today}`);
    toast.success("Damage report generated");
  };

  const printInvoice = (orderId: string) => {
    const today = new Date().toLocaleDateString("en-IN");
    const win = window.open("", "_blank"); if (!win) return;
    win.document.write(`<html><head><title>Invoice ${orderId}</title>
    <style>body{font-family:Arial,sans-serif;max-width:520px;margin:30px auto;color:#111;font-size:13px}
    h2{margin:0;font-size:18px}table{width:100%;border-collapse:collapse;margin:12px 0}
    th{background:#111;color:#fff;padding:7px 10px;text-align:left;font-size:11px}
    td{padding:6px 10px;border-bottom:1px solid #eee}.tot{background:#f5f5f5;font-weight:bold}
    @media print{body{margin:0}}</style></head><body>
    <div style="display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:12px">
      <div><h2>Quick Dry Cleaning</h2><p style="margin:2px 0;color:#666;font-size:11px">Hyderabad · GST Invoice</p></div>
      <div style="text-align:right"><b style="font-size:18px">${orderId}</b><p style="color:#666;font-size:11px;margin:0">${today}</p></div>
    </div>
    <p><b>Customer:</b> ${customer.name} &nbsp;|&nbsp; <b>Phone:</b> ${customer.phone} &nbsp;|&nbsp; <b>Payment:</b> ${paymentMethod}${express?" · ⚡ Express":""}</p>
    <table><thead><tr><th>Item</th><th>Service</th><th>Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Total</th></tr></thead><tbody>
    ${items.map(i=>`<tr><td>${i.garment}</td><td>${i.service}</td><td>${i.qty}</td><td style="text-align:right">₹${i.price}</td><td style="text-align:right">₹${i.price*i.qty}</td></tr>`).join("")}
    ${express?`<tr><td colspan="4" style="text-align:right;color:#dc2626">⚡ Express (30%)</td><td style="text-align:right;color:#dc2626">₹${expressFee}</td></tr>`:""}
    <tr class="tot"><td colspan="4" style="text-align:right">TOTAL</td><td style="text-align:right">₹${total}</td></tr>
    </tbody></table>
    <p style="font-size:10px;color:#999;text-align:center;margin-top:16px">Track: localhost:3000/track/${orderId} · Thank you!</p>
    <script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  const placeOrder = async () => {
    if (!customer.name || !customer.phone) { toast.error("Name and phone required"); return; }
    if (items.some(i => !i.price)) { toast.error("Click AI Price Estimator first"); return; }
    setPlacing(true);
    try {
      const res   = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items, total, damageNotes, priority: express ? "Express" : "Normal", paymentMethod }) });
      if (!res.ok) throw new Error();
      const order = await res.json();
      setPlaced(order);
      const trackUrl = `${window.location.origin}/track/${order.orderId}`;
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackUrl)}`);
      const msg = encodeURIComponent(`Hi ${customer.name}! 🧺 Order ${order.orderId} placed.\nItems: ${items.map(i=>`${i.qty}x ${i.garment}`).join(", ")}\nTotal: ₹${total}${express?" (⚡ Express)":""}\nTrack: ${trackUrl}\n\nQuick Dry Cleaning, Hyderabad`);
      window.open(`https://wa.me/91${customer.phone}?text=${msg}`, "_blank");
      toast.success(`Order ${order.orderId} placed!`);
      setTimeout(() => { setPlaced(null); setActiveTab("orders"); }, 5000);
    } catch { toast.error("Failed. Is MongoDB running?"); }
    setPlacing(false);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <p className="text-sm text-gray-400 mt-0.5">Fill customer details, add garments, and place order</p>
      </div>

      {/* Success banner */}
      {placed && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 animate-scale-in flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-emerald-800">Order {placed.orderId} confirmed!</p>
            <p className="text-sm text-emerald-600 mt-0.5">WhatsApp sent · Redirecting in 5s...</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => printInvoice(placed.orderId)} className="flex items-center gap-1.5 text-xs bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors font-medium">
                <Printer className="w-3 h-3" /> Print Invoice
              </button>
              <a href={`/track/${placed.orderId}`} target="_blank" className="flex items-center gap-1.5 text-xs bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors font-medium">
                <QrCode className="w-3 h-3" /> Track Order
              </a>
            </div>
          </div>
          {qrUrl && <img src={qrUrl} alt="QR" className="w-16 h-16 rounded-xl border-2 border-emerald-200 shrink-0" />}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-5 gap-6">

        {/* Left — Form (3/5) */}
        <div className="col-span-3 space-y-5">

          {/* Customer Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Customer Details</p>
                <p className="text-xs text-gray-400">Who is this order for?</p>
              </div>
              {customer.name && (
                <div className="ml-auto flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{customer.name}</span>
                </div>
              )}
            </div>
            <div className="p-5 grid grid-cols-3 gap-4">
              {[
                { label: "Full Name", key: "name", placeholder: "Rahul Sharma", icon: User, type: "text" },
                { label: "Phone", key: "phone", placeholder: "9876543210", icon: Phone, type: "tel" },
                { label: "Email (optional)", key: "email", placeholder: "rahul@gmail.com", icon: Mail, type: "email" },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{f.label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                      <input type={f.type} placeholder={f.placeholder}
                        value={customer[f.key as keyof typeof customer]}
                        onChange={e => setCustomer(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Garments & Services</p>
                  <p className="text-xs text-gray-400">{items.length} item{items.length > 1 ? "s" : ""} added</p>
                </div>
              </div>
              <button onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-black px-3 py-1.5 rounded-xl hover:bg-gray-800 transition-all btn-press">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {items.map((item, i) => (
                <div key={i} className="p-4 flex items-center gap-3 group hover:bg-gray-50/50 transition-colors animate-fade-in">
                  {/* Garment emoji avatar */}
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                    {GARMENT_EMOJI[item.garment] ?? "📦"}
                  </div>

                  {/* Garment select */}
                  <div className="relative flex-1 min-w-0">
                    <select value={item.garment} onChange={e => setItem(i, "garment", e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white pr-8">
                      {GARMENTS.map(g => <option key={g}>{g}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Service select */}
                  <div className="relative flex-1 min-w-0">
                    <select value={item.service} onChange={e => setItem(i, "service", e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white pr-8">
                      {SERVICES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Qty */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setItem(i, "qty", Math.max(1, item.qty - 1))}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors font-bold text-sm">−</button>
                    <span className="w-7 text-center text-sm font-bold text-gray-900">{item.qty}</span>
                    <button onClick={() => setItem(i, "qty", item.qty + 1)}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors font-bold text-sm">+</button>
                  </div>

                  {/* Price */}
                  <div className="w-20 shrink-0">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">₹</span>
                      <input type="number" value={item.price || ""}
                        onChange={e => setItem(i, "price", parseFloat(e.target.value) || 0)}
                        className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-right" placeholder="0" />
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="w-16 text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">₹{item.price * item.qty || "—"}</p>
                    <p className="text-[10px] text-gray-400">{item.qty} pcs</p>
                  </div>

                  {/* Delete */}
                  <button onClick={() => removeItem(i)}
                    className="w-7 h-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* AI Price Button */}
            <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <button onClick={applyAiPrices} disabled={aiLoading}
                  className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all btn-press disabled:opacity-50 shadow-sm">
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {aiLoading ? "AI calculating..." : "AI Price Estimator"}
                </button>
                {aiTip && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl animate-fade-in max-w-xs truncate">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span className="truncate">{aiTip.split("\n")[0]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Damage Report */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Damage Report</p>
                  <p className="text-xs text-gray-400">Optional · Voice or type</p>
                </div>
              </div>
              <button onClick={toggleVoice}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all btn-press ${listening ? "bg-red-500 text-white animate-pulse" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {listening ? <><MicOff className="w-3.5 h-3.5" /> Stop</> : <><Mic className="w-3.5 h-3.5" /> Voice Input</>}
              </button>
            </div>
            <div className="p-5">
              <textarea rows={3} value={damageNotes} onChange={e => setDamageNotes(e.target.value)}
                placeholder="e.g. small tea stain on collar, missing button on right sleeve..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all resize-none text-gray-700 placeholder:text-gray-300" />
              {listening && (
                <div className="flex items-center gap-2 mt-2 text-xs text-red-500 font-medium animate-fade-in">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Listening… speak now
                </div>
              )}
              {damageNotes && (
                <button onClick={generateReport}
                  className="mt-3 flex items-center gap-2 border border-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-black hover:text-white hover:border-black transition-all btn-press">
                  <Sparkles className="w-3.5 h-3.5" /> Generate Official Report
                </button>
              )}
              {damageReport && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed animate-fade-in">
                  {damageReport}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — Order Summary (2/5) */}
        <div className="col-span-2">
          <div className="sticky top-20 space-y-4">

            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-sm font-bold text-gray-900">Order Summary</p>
              </div>

              {/* Items list */}
              <div className="px-5 py-3 space-y-2 max-h-52 overflow-y-auto">
                {items.filter(i => i.price > 0).map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{GARMENT_EMOJI[item.garment]}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{item.qty}× {item.garment}</p>
                        <p className="text-[10px] text-gray-400 truncate">{item.service}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-900 shrink-0">₹{item.price * item.qty}</p>
                  </div>
                ))}
                {items.every(i => !i.price) && (
                  <p className="text-xs text-gray-300 text-center py-4">Run AI Estimator to see prices</p>
                )}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 border-t border-gray-50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{subtotal}</span>
                </div>
                {express && (
                  <div className="flex justify-between text-sm animate-fade-in">
                    <span className="text-red-500 flex items-center gap-1"><Zap className="w-3 h-3" /> Express (30%)</span>
                    <span className="font-semibold text-red-500">+₹{expressFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2 mt-1">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">₹{total || "—"}</span>
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Priority</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setExpress(false)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all btn-press ${!express ? "bg-black text-white border-black shadow-sm" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  Normal
                </button>
                <button onClick={() => setExpress(true)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all btn-press flex items-center justify-center gap-1.5 ${express ? "bg-red-600 text-white border-red-600 shadow-sm" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  <Zap className="w-3.5 h-3.5" /> Express
                </button>
              </div>
              {express && <p className="text-xs text-red-500 font-medium mt-2 text-center">⚡ Ready in 12-24 hrs · +30% charge</p>}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map(pm => {
                  const Icon = pm.icon;
                  const isActive = paymentMethod === pm.value;
                  return (
                    <button key={pm.value} onClick={() => setPayment(pm.value)}
                      className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all btn-press ${isActive ? pm.active + " border-2" : "border-gray-200 text-gray-500 " + pm.color}`}>
                      <Icon className="w-3.5 h-3.5" /> {pm.value}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Place Order CTA */}
            <button onClick={placeOrder}
              disabled={!customer.name || !customer.phone || items.every(i => !i.price) || placing}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all btn-press disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
              {placing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order…</>
                : <><CheckCircle className="w-4 h-4" /> Place Order · ₹{total || "—"}</>}
            </button>

            <p className="text-center text-xs text-gray-400">WhatsApp confirmation sent automatically</p>
          </div>
        </div>
      </div>
    </div>
  );
}
