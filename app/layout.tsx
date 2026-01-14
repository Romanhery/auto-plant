import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RealtimeListener } from "@/components/realtime-listener";
import { ChatBot } from "@/components/chat-bot"; 

// 1. IMPORT SIDEBAR COMPONENTS
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/nav/app-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Simpl",
  description: "Simpl IoT Dashboard",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        {/* 2. WRAP EVERYTHING IN SIDEBAR PROVIDER */}
        <SidebarProvider defaultOpen={true}>
          
          {/* 3. ADD THE SIDEBAR ITSELF */}
          <AppSidebar />
          
          {/* 4. MAIN CONTENT AREA */}
          <main className="w-full min-h-screen bg-gray-50">
            
            {/* The Header with the Toggle Button */}
            <div className="p-4 flex items-center gap-2 border-b bg-white sticky top-0 z-10">
              <SidebarTrigger /> {/* <--- CLICKING THIS OPENS/CLOSES THE MENU */}
              <span className="font-bold text-lg">Smart Plant App</span>
            </div>

            {/* Your Actual Page Content */}
            <div className="p-4">
              <RealtimeListener />
              {children}
            </div>
          </main>

          {/* ChatBot stays floating above everything */}
          <ChatBot />
          
        </SidebarProvider>
      </body>
    </html>
  );
}