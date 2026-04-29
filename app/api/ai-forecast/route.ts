import OpenAI from "openai";
import { NextResponse } from "next/server";

export const maxDuration = 60;
import { connectDB } from "@/lib/mongodb";
import Order from "@/lib/models/Order";

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY!,
});

export async function GET() {
  await connectDB();

  // Get last 7 days revenue
  const days: { day: string; revenue: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date(); start.setDate(start.getDate() - i); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setDate(end.getDate() - i); end.setHours(23, 59, 59, 999);
    const orders = await Order.find({ createdAt: { $gte: start, $lte: end } });
    const revenue = orders.reduce((s: number, o: { total: number }) => s + o.total, 0);
    days.push({ day: start.toLocaleDateString("en-IN", { weekday: "short" }), revenue, orders: orders.length });
  }

  const revenueList = days.map(d => `${d.day}: ₹${d.revenue} (${d.orders} orders)`).join(", ");
  const totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
  const avgDaily = Math.round(totalRevenue / 7);

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{
        role: "user",
        content: `You are a business analyst for a laundry shop in Hyderabad, India called Quick Dry Cleaning.

Last 7 days revenue data: ${revenueList}
Total: ₹${totalRevenue}, Avg daily: ₹${avgDaily}

Provide a SHORT response with exactly 3 things:
1. Predicted revenue for tomorrow (just the number like ₹1200)
2. One business insight (1 sentence, specific to the data)
3. One action recommendation (1 sentence)

Format:
FORECAST: ₹[amount]
INSIGHT: [sentence]
ACTION: [sentence]`
      }],
      temperature: 0.3,
      max_tokens: 120,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const forecast = text.match(/FORECAST:\s*(₹[\d,]+)/)?.[1] ?? `₹${avgDaily}`;
    const insight = text.match(/INSIGHT:\s*(.+)/)?.[1]?.trim() ?? "Revenue is stable. Keep maintaining service quality.";
    const action = text.match(/ACTION:\s*(.+)/)?.[1]?.trim() ?? "Send WhatsApp reminders to customers with pending pickups.";

    return NextResponse.json({ forecast, insight, action, weekData: days });
  } catch {
    return NextResponse.json({
      forecast: `₹${avgDaily}`,
      insight: "Based on recent trends, revenue is consistent.",
      action: "Focus on express orders to boost same-day revenue.",
      weekData: days,
    });
  }
}
