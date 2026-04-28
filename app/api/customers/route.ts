import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/lib/models/Customer";

export async function GET() {
  await connectDB();
  const customers = await Customer.find().sort({ totalSpent: -1 });
  return NextResponse.json(customers);
}
