import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import HydroChart from "@/components/HydroChart"; // Using your new simpler chart
import { ChevronLeft, Thermometer, Droplets, Lightbulb, Wind } from "lucide-react";

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;
    const decodedName = decodeURIComponent(id);

    // 1. Fetch latest data for the big stat cards
    const { data: latestReading, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .eq("device_name", decodedName)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (error || !latestReading) {
        return (
            <div className="p-20 text-center">
                <p className="text-red-500 font-bold text-xl">Plant not found.</p>
                <Link href="/dashboard" className="text-green-600 underline mt-4 block">Return to Dashboard</Link>
            </div>
        );
    }

    // 2. Fetch history for the charts
    const { data: history } = await supabase
        .from("sensor_readings")
        .select("*")
        .eq("device_name", decodedName)
        .order("created_at", { ascending: false })
        .limit(50);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 bg-slate-50 min-h-screen">
            <Link href="/dashboard" className="flex items-center text-green-600 hover:text-green-700 font-bold transition-all">
                <ChevronLeft className="w-5 h-5" /> Back to Dashboard
            </Link>

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">{latestReading.device_name}</h1>
                    <p className="text-slate-500 font-medium italic">Plant Health: <span className="text-green-600 font-bold">Healthy</span></p>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Droplets className="text-blue-500" />} label="Moisture" value={`${latestReading.moisture}%`} color="bg-blue-50" />
                <StatCard icon={<Thermometer className="text-orange-500" />} label="Temp" value={`${latestReading.temperature}°C`} color="bg-orange-50" />
                <StatCard icon={<Wind className="text-indigo-500" />} label="Humidity" value={`${latestReading.humidity}%`} color="bg-indigo-50" />
                <StatCard icon={<Lightbulb className="text-yellow-600" />} label="Light" value={`${latestReading.light}%`} color="bg-yellow-50" />
            </div>

            {/* 10X FEATURE: Tabbed Analytics to avoid clutter */}
            <Tabs defaultValue="moisture" className="w-full">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-slate-800">Historical Trends</h2>
                    <TabsList className="bg-white border rounded-2xl p-1 shadow-sm">
                        <TabsTrigger value="moisture" className="rounded-xl px-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Moisture</TabsTrigger>
                        <TabsTrigger value="climate" className="rounded-xl px-4 data-[state=active]:bg-orange-500 data-[state=active]:text-white">Climate</TabsTrigger>
                        <TabsTrigger value="light" className="rounded-xl px-4 data-[state=active]:bg-yellow-500 data-[state=active]:text-white">Light</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="moisture">
                    <ChartCard title="Moisture Levels (%)" history={history || []} metric="moisture" color="#3b82f6" />
                </TabsContent>

                <TabsContent value="climate">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ChartCard title="Temperature (°C)" history={history || []} metric="temperature" color="#f97316" />
                        <ChartCard title="Humidity (%)" history={history || []} metric="humidity" color="#6366f1" />
                    </div>
                </TabsContent>

                <TabsContent value="light">
                    <ChartCard title="Lumen Exposure (%)" history={history || []} metric="light" color="#eab308" />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Sub-component for individual chart cards
function ChartCard({ title, history, metric, color }: { title: string, history: any[], metric: any, color: string }) {
    return (
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <HydroChart data={history} metric={metric} color={color} />
            </CardContent>
        </Card>
    );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
    return (
        <div className={`${color} p-5 rounded-3xl flex items-center gap-4 border border-white shadow-sm`}>
            <div className="bg-white p-3 rounded-2xl shadow-sm">{icon}</div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black text-slate-900">{value}</p>
            </div>
        </div>
    );
}   