import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

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

const TIPS: Record<string, string> = {
  "Dry Clean": "💡 Suggest fabric protection spray add-on for dry cleaned items — increases order value by ₹50-100.",
  "Stain Removal": "💡 Offer a free re-clean guarantee for stain removal — builds trust and repeat customers.",
  "Wash & Iron": "💡 Bundle wash & iron with folding service for ₹20 extra — customers love convenience.",
  "Steam Iron": "💡 Steam iron customers often need dry clean too — mention the combo discount.",
  "Wash & Fold": "💡 Offer monthly subscription plans to wash & fold regulars — guaranteed recurring revenue.",
};

export async function POST(req: NextRequest) {
  const { items } = await req.json();

  let total = 0;
  const lines: string[] = [];
  const services = new Set<string>();

  for (const item of items) {
    const unitPrice = PRICE_TABLE[item.garment]?.[item.service] ?? 80;
    const itemTotal = unitPrice * item.qty;
    total += itemTotal;
    lines.push(`• ${item.qty}x ${item.garment} (${item.service}) — ₹${unitPrice}/pc = ₹${itemTotal}`);
    services.add(item.service);
  }

  const primaryService = [...services][0] ?? "Wash & Fold";
  const tip = TIPS[primaryService] ?? "💡 Ask the customer if they have more items — bulk orders get priority processing.";
  const result = lines.join("\n") + `\n\n─────────────────\nTotal: ₹${total}\n\n${tip}`;

  return NextResponse.json({ result });
}
