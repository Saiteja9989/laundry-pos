import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import Customer from "@/lib/models/Customer";

export async function GET() {
  await connectDB();

  const today = new Date().toISOString().split("T")[0];
  const allOrders = await Order.find();

  const todayOrders = allOrders.filter((o) =>
    new Date(o.createdAt).toISOString().startsWith(today)
  );

  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const totalOrders = allOrders.length;
  const pending = allOrders.filter((o) => o.status === "Pending").length;
  const ready = allOrders.filter((o) => o.status === "Ready").length;

  // Last 7 days revenue by day
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayOrders = allOrders.filter((o) =>
      new Date(o.createdAt).toISOString().startsWith(dateStr)
    );
    return {
      day: days[d.getDay()],
      revenue: dayOrders.reduce((s, o) => s + (o.total ?? 0), 0),
      orders: dayOrders.length,
    };
  });

  const recentOrders = allOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((o) => ({
      id: o.orderId,
      customer: o.customer?.name,
      items: o.itemsSummary,
      status: o.status,
      amount: `₹${o.total}`,
      time: timeSince(new Date(o.createdAt)),
    }));

  const totalRevenue = allOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const totalCustomers = await Customer.countDocuments();

  return NextResponse.json({ todayRevenue, totalOrders, pending, ready, weekData, recentOrders, totalRevenue, totalCustomers });
}

function timeSince(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
