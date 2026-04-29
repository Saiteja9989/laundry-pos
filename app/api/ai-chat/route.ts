import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { connectDB } from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import Customer from "@/lib/models/Customer";

const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY!,
});

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  await connectDB();

  // Gather live data from DB
  const allOrders = await Order.find().sort({ createdAt: -1 }).limit(100);
  const allCustomers = await Customer.find();

  const today = new Date().toISOString().split("T")[0];
  const todayOrders = allOrders.filter((o) => new Date(o.createdAt).toISOString().startsWith(today));
  const pending = allOrders.filter((o) => o.status === "Pending");
  const ready = allOrders.filter((o) => o.status === "Ready");
  const processing = allOrders.filter((o) => o.status === "Processing");
  const totalRevenue = allOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total ?? 0), 0);

  const topCustomers = [...allCustomers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3);
  const readyNames = ready.map((o) => `${o.customer?.name} (${o.orderId})`).join(", ");
  const pendingNames = pending.map((o) => `${o.customer?.name} (${o.orderId})`).join(", ");

  const context = `
You are an AI assistant for Quick Dry Cleaning POS in Hyderabad. Answer staff questions about the business using this live data:

TODAY (${today}):
- Today's orders: ${todayOrders.length}
- Today's revenue: ₹${todayRevenue}

ALL TIME STATS:
- Total orders: ${allOrders.length}
- Total revenue: ₹${totalRevenue}
- Total customers: ${allCustomers.length}

CURRENT STATUS:
- Pending orders (${pending.length}): ${pendingNames || "none"}
- Processing orders (${processing.length})
- Ready for pickup (${ready.length}): ${readyNames || "none"}

TOP CUSTOMERS:
${topCustomers.map((c) => `- ${c.name}: ₹${c.totalSpent} spent, ${c.totalOrders} orders`).join("\n")}

RECENT ORDERS (last 5):
${allOrders.slice(0, 5).map((o) => `- ${o.orderId}: ${o.customer?.name}, ${o.itemsSummary}, ₹${o.total}, ${o.status}`).join("\n")}

Answer in 1-3 short sentences. Be specific with numbers. If asked about WhatsApp, suggest going to Orders tab. If asked to do something outside your scope, say "Go to the [tab name] tab for that."
`.trim();

  const completion = await client.chat.completions.create({
    model: "meta/llama-3.1-8b-instruct",
    messages: [
      { role: "system", content: context },
      { role: "user", content: message },
    ],
    temperature: 0.2,
    max_tokens: 150,
  });

  const reply = completion.choices[0]?.message?.content?.trim() ?? "I couldn't process that. Try asking about orders, revenue, or customers.";
  return NextResponse.json({ reply });
}
