import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY!,
});

const PRICE_TABLE: Record<string, Record<string, number>> = {
  "Shirt":    { "Wash & Fold": 50,  "Wash & Iron": 70,  "Dry Clean": 120, "Steam Iron": 40,  "Stain Removal": 100 },
  "Trouser":  { "Wash & Fold": 60,  "Wash & Iron": 80,  "Dry Clean": 130, "Steam Iron": 50,  "Stain Removal": 110 },
  "Saree":    { "Wash & Fold": 150, "Wash & Iron": 180, "Dry Clean": 250, "Steam Iron": 120, "Stain Removal": 200 },
  "Suit":     { "Wash & Fold": 200, "Wash & Iron": 250, "Dry Clean": 400, "Steam Iron": 180, "Stain Removal": 300 },
  "Kurta":    { "Wash & Fold": 60,  "Wash & Iron": 80,  "Dry Clean": 130, "Steam Iron": 50,  "Stain Removal": 100 },
  "Lehenga":  { "Wash & Fold": 200, "Wash & Iron": 250, "Dry Clean": 450, "Steam Iron": 180, "Stain Removal": 350 },
  "Jacket":   { "Wash & Fold": 150, "Wash & Iron": 180, "Dry Clean": 350, "Steam Iron": 140, "Stain Removal": 250 },
  "Bedsheet": { "Wash & Fold": 100, "Wash & Iron": 130, "Dry Clean": 200, "Steam Iron": 80,  "Stain Removal": 150 },
  "Curtain":  { "Wash & Fold": 120, "Wash & Iron": 150, "Dry Clean": 220, "Steam Iron": 100, "Stain Removal": 180 },
  "Other":    { "Wash & Fold": 80,  "Wash & Iron": 100, "Dry Clean": 180, "Steam Iron": 70,  "Stain Removal": 150 },
};

export async function POST(req: NextRequest) {
  const { items } = await req.json();

  let lines: string[] = [];
  let total = 0;
  const orderSummary: string[] = [];

  for (const item of items) {
    const garment = item.garment as string;
    const service = item.service as string;
    const qty = item.qty as number;
    const unitPrice = PRICE_TABLE[garment]?.[service] ?? 100;
    const itemTotal = unitPrice * qty;
    total += itemTotal;
    lines.push(`• ${qty}x ${garment} (${service}) — ₹${unitPrice}/piece = ₹${itemTotal}`);
    orderSummary.push(`${qty}x ${garment} for ${service}`);
  }

  const breakdown = lines.join("\n") + `\n\n─────────────────\nTotal: ₹${total}`;

  // AI tip based on order
  try {
    const completion = await client.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",
      messages: [
        {
          role: "user",
          content: `A laundry shop received this order: ${orderSummary.join(", ")}. Total: ₹${total}.
Give ONE short smart tip (1-2 sentences) to upsell or improve service quality for this specific order. Be practical and specific. No greetings, just the tip.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 80,
    });
    const tip = completion.choices[0]?.message?.content?.trim() ?? "";
    const result = breakdown + (tip ? `\n\n💡 AI Tip: ${tip}` : "");
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ result: breakdown });
  }
}
