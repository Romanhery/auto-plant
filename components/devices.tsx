import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Droplets, Thermometer, Sun, Wind, Clock } from "lucide-react";
import Link from "next/link";

export default async function Devices() {
    const supabase = await createClient();

    // 1. Fetch all data, newest first
    const { data: all_readings, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .order('created_at', { ascending: false });

    if (error) {
        return (
            <div className="p-10 text-center border-2 border-dashed border-red-200 rounded-xl">
                <p className="text-red-500 font-medium">Unable to connect to sensors.</p>
            </div>
        );
    }

    // 2. THE 10X FILTER: Only keep the newest reading for each unique device name
    const latestReadingsMap = new Map();

    all_readings?.forEach((reading) => {
        // Because we ordered by newest first, the first time we see a name, 
        // it is the most recent data for that plant.
        if (!latestReadingsMap.has(reading.device_name)) {
            latestReadingsMap.set(reading.device_name, reading);
        }
    });

    // 3. Convert that Map back into a clean list for the UI
    const unique_readings = Array.from(latestReadingsMap.values());

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <h1 className="text-3xl font-bold text-slate-800 mb-8 tracking-tight">Hydroponic Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 4. Map over the UNIQUE readings instead of ALL readings */}
                {unique_readings.map((reading) => (
                    <Link href={`/devices/${reading.device_name}`} key={reading.device_name}>
                        <Card className="overflow-hidden border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-bold flex items-center justify-between text-slate-700">
                                    {reading.device_name}
                                    <span className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl">
                                        <Droplets className="text-blue-500 h-5 w-5" />
                                        <div>
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Moisture</p>
                                            <p className="text-lg font-bold text-blue-900">{reading.moisture}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-xl">
                                        <Thermometer className="text-orange-500 h-5 w-5" />
                                        <div>
                                            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Temp</p>
                                            <p className="text-lg font-bold text-orange-900">{reading.temperature}°C</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl">
                                        <Wind className="text-indigo-500 h-5 w-5" />
                                        <div>
                                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Humidity</p>
                                            <p className="text-lg font-bold text-indigo-900">{reading.humidity}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-yellow-50/50 rounded-xl">
                                        <Sun className="text-yellow-600 h-5 w-5" />
                                        <div>
                                            <p className="text-[10px] text-yellow-700 font-bold uppercase tracking-wider">Light</p>
                                            <p className="text-lg font-bold text-yellow-900">{reading.light}%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-400 text-[10px] font-medium uppercase tracking-tight">
                                    <Clock className="h-3 w-3" />
                                    Last Sync: {new Date(reading.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}