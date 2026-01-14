"use client";

import { useState, useEffect } from "react";
import AnalyzeButton from "@/components/analyze-button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function AnalyzePage() {
  const [data, setData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    // 1. Build the Supabase URL safely
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const baseUrl = supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`;
    
    // 2. Add timestamp to show the NEWEST image
    const url = `${baseUrl}/storage/v1/object/public/plant-images/current_plant.jpg?t=${Date.now()}`;
    setImageUrl(url);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto space-y-10">
        
        <Link href="/dashboard" className="absolute top-4 left-4 flex items-center text-green-600 hover:text-green-700 font-bold transition-all">
                <ChevronLeft className="w-5 h-5" />
                Back to Dashboard
            </Link>
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">🌱 Plant Analysis</h1>
          <p className="text-gray-500">Powered by AI</p>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 grid md:grid-cols-2">
            
            {/* LEFT: IMAGE */}
            <div className="relative bg-gray-900 h-96 md:h-auto flex items-center justify-center group">
               {imageUrl ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img 
                   src={imageUrl} 
                   alt="Live Plant Feed" 
                   className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                 />
               ) : (
                 <div className="text-gray-500">Loading Camera...</div>
               )}
            </div>

            {/* RIGHT: DATA */}
            <div className="p-8 flex flex-col justify-center bg-white">
              {!data ? (
                <div className="text-center space-y-6">
                   <h2 className="text-2xl font-bold">System Online</h2>
                   <div className="flex justify-center">
                      <AnalyzeButton onAnalysisComplete={setData} />
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-3xl font-black uppercase text-green-600">
                    {data.status}
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                    "{data.explanation}"
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-400 font-bold uppercase">Action</p>
                    <p className="text-blue-900 font-bold text-lg">{data.action_needed}</p>
                  </div>
                  <button onClick={() => setData(null)} className="text-sm underline text-gray-400">Reset</button>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}