"use client";
import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Sparkles, Bot } from "lucide-react";

interface Message { role: "user" | "ai"; text: string; time: string; }

const SUGGESTIONS = [
  "How many orders are pending?",
  "What's today's revenue?",
  "Who are my top customers?",
  "How many orders are ready for pickup?",
];

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hi! I'm your AI business assistant. Ask me anything about your orders, revenue, or customers.", time: now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function now() {
    return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg, time: now() }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply, time: now() }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Connection error. Make sure the server is running.", time: now() }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${open ? "bg-gray-800 rotate-90" : "bg-black hover:scale-110"}`}
      >
        {open ? <X className="w-5 h-5 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: "460px" }}>
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Business Assistant</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">Live data · Quick Dry Cleaning</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.role === "user" ? "order-2" : "order-1"}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-black text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                    {msg.text}
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only when no user messages yet) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-colors text-left">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 px-3 py-3 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask about orders, revenue..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              disabled={loading}
            />
            <button onClick={() => send(input)} disabled={!input.trim() || loading}
              className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 disabled:opacity-40 transition-colors shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
