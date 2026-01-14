"use client";

import { useState } from "react";

// Props: We pass a function so the parent page knows when data arrives
interface AnalyzeButtonProps {
  onAnalysisComplete: (data: any) => void;
}

export default function AnalyzeButton({ onAnalysisComplete }: AnalyzeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // Call the Next.js API route we created
      const res = await fetch("/api/analyze", { method: "POST" });
      
      if (!res.ok) throw new Error("API Error");
      
      const data = await res.json();
      
      // Send the data back up to the page
      onAnalysisComplete(data);
      
    } catch (error) {
      console.error("Analysis failed", error);
      alert("⚠️ Could not connect to the Brain. Check API Keys.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAnalyze}
      disabled={loading}
      className={`
        group relative w-full sm:w-auto flex items-center justify-center gap-3 
        px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all
        ${loading 
          ? "bg-gray-400 cursor-not-allowed" 
          : "bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white hover:shadow-xl hover:scale-[1.02]"
        }
      `}
    >
      {loading ? (
        <>
          {/* Simple CSS Spinner */}
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Analyzing...</span>
        </>
      ) : (
        <>
          <span>✨ Analyze Plant Status</span>
        </>
      )}
    </button>
  );
}