import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import Customer from "@/lib/models/Customer";

export async function GET() {
  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { customer, items, total, damageNotes, priority } = body;

  // Generate order ID
  const count = await Order.countDocuments();
  const orderId = `ORD-${String(count + 1).padStart(3, "0")}`;

  const itemsSummary = items
    .map((i: { qty: number; garment: string }) => `${i.qty}x ${i.garment}`)
    .join(", ");

  const primaryService = items[0]?.service ?? "Wash & Fold";

  const order = await Order.create({
    orderId,
    customer,
    items,
    itemsSummary,
    primaryService,
    total,
    status: "Pending",
    priority: priority ?? "Normal",
    damageNotes,
  });

  // Upsert customer
  const today = new Date().toISOString().split("T")[0];
  const existing = await Customer.findOne({ phone: customer.phone });

  if (existing) {
    const services: string[] = [...(existing.favoriteService ? [existing.favoriteService] : []), primaryService];
    const favoriteService = services
      .sort((a, b) => services.filter((s) => s === b).length - services.filter((s) => s === a).length)[0];

    await Customer.findOneAndUpdate(
      { phone: customer.phone },
      {
        $inc: { totalOrders: 1, totalSpent: total, loyaltyPoints: Math.floor(total / 10) },
        $set: { lastVisit: today, favoriteService, email: customer.email || existing.email },
      }
    );
  } else {
    await Customer.create({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      totalOrders: 1,
      totalSpent: total,
      lastVisit: today,
      favoriteService: primaryService,
      loyaltyPoints: Math.floor(total / 10),
    });
  }

  return NextResponse.json(order, { status: 201 });
}
