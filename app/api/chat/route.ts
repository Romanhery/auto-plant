import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // UPDATED: Using "gemini-2.5-flash" as 1.5 is retired.
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    // FIX: Sanitize History
    // Gemini history MUST start with a 'user' message.
    // We separate the history (previous turns) from the current prompt (last message).
    const rawHistory = messages.slice(0, -1);
    
    // If the conversation starts with an Assistant greeting, we must remove it.
    const cleanHistory = (rawHistory.length > 0 && rawHistory[0].role === 'assistant')
      ? rawHistory.slice(1) 
      : rawHistory;

    const chat = model.startChat({
      history: cleanHistory.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}