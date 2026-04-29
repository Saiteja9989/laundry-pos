import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { connectDB } from "@/lib/mongodb";
import Order from "@/lib/models/Order";

const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY!,
});

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  await connectDB();

  // Ask AI to parse query into structured intent
  const completion = await client.chat.completions.create({
    model: "meta/llama-3.1-8b-instruct",
    messages: [
      {
        role: "user",
        content: `You are a search query parser for a laundry POS system. Parse this query and return ONLY a JSON object.

Query: "${query}"

Rules:
- If query mentions a status (pending/processing/ready/delivered), set "status" field exactly as: "Pending", "Processing", "Ready", or "Delivered"
- If query mentions a person's name, set "customerName" field with just the name
- If query mentions a service (wash/dry clean/iron/stain), set "service" field exactly as one of: "Wash & Fold", "Dry Clean", "Steam Iron", "Wash & Iron", "Stain Removal"
- Return {} if nothing matches

Examples:
"show ready orders" → {"status":"Ready"}
"pending laundry" → {"status":"Pending"}
"Rahul orders" → {"customerName":"Rahul"}
"all dry clean" → {"service":"Dry Clean"}
"delivered orders" → {"status":"Delivered"}

Return ONLY the JSON, nothing else.`,
      },
    ],
    temperature: 0,
    max_tokens: 50,
  });

  let intent: Record<string, string> = {};
  try {
    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const jsonMatch = raw.match(/\{[^}]*\}/);
    intent = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    intent = {};
  }

  // Build proper MongoDB query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mongoFilter: Record<string, any> = {};
  if (intent.status) mongoFilter.status = intent.status;
  if (intent.service) mongoFilter.primaryService = intent.service;
  if (intent.customerName) {
    mongoFilter["customer.name"] = { $regex: intent.customerName, $options: "i" };
  }

  const orders = await Order.find(mongoFilter).sort({ createdAt: -1 }).limit(50);
  return NextResponse.json({ orders, intent });
}
