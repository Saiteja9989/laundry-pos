import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { notes, customer, items } = await req.json();

    const itemsText = items
      .map((i: { garment: string; qty: number }) => `${i.qty}x ${i.garment}`)
      .join(", ");

    const completion = await client.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",
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
