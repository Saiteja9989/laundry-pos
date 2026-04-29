import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { notes, customer, items } = await req.json();

    const itemsText = items
      .map((i: { garment: string; qty: number }) => `${i.qty}x ${i.garment}`)
      .join(", ");

    const client = new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY!,
    });

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `Generate a formal pre-existing damage report for Quick Dry Cleaning, Hyderabad.
Customer: ${customer} | Items: ${itemsText} | Date: ${new Date().toLocaleDateString("en-IN")}
Damage noted: ${notes}
Write 5-6 lines: acknowledge items received, document damage, state shop is not responsible, sign off professionally.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 300,
    });

    const result = completion.choices[0]?.message?.content ?? "Could not generate report.";
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Damage report error:", error);
    return NextResponse.json({ result: "Report generation failed. Please try again." });
  }
}
