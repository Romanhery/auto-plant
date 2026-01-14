import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("🚀 STARTING ANALYSIS...");

  try {
    // 1. CHECK API KEYS
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ ERROR: GEMINI_API_KEY is missing from .env.local");
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }
    console.log("✅ API Key loaded (Length:", apiKey.length, ")");

    // 2. CHECK SUPABASE URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is missing");
      return NextResponse.json({ error: "Missing Supabase URL" }, { status: 500 });
    }

    // 3. FETCH IMAGE
    // Fix the "Double HTTPS" issue safely
    const baseUrl = supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`;
    const imageUrl = `${baseUrl}/storage/v1/object/public/plant-images/current_plant.jpg?t=${Date.now()}`;
    
    console.log("📷 Fetching image from:", imageUrl);
    const imageResp = await fetch(imageUrl);
    
    if (!imageResp.ok) {
      console.error("❌ ERROR: Supabase returned", imageResp.status, imageResp.statusText);
      return NextResponse.json({ error: "Failed to download image" }, { status: 500 });
    }
    console.log("✅ Image downloaded successfully");

    // 4. PREPARE GEMINI
    const arrayBuffer = await imageResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // This usually bypasses the "Limit: 0" block on the main models.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-09-2025" });

    console.log("🧠 Sending to Gemini...");
    const result = await model.generateContent([
      "Analyze this plant. Return strictly JSON: {status, action_needed, explanation, confidence}",
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const text = result.response.text().replace(/```json|```/g, "").trim();
    console.log("✅ Analysis Result:", text);
    
    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("🔥 CRITICAL SERVER ERROR:", error.message);
    // Print the full error details if available
    if (error.response) console.error("Error Details:", await error.response.text());
    
    return NextResponse.json({ error: "Server crashed", details: error.message }, { status: 500 });
  }
}