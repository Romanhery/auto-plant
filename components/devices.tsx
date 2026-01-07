import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Droplets, Thermometer, Sun, Wind, Clock } from "lucide-react";
import Link from "next/link";

export default async function Devices() {
    const supabase = await createClient();

    // 1. Fetch all devices
    const { data: devices, error: devicesError } = await supabase
        .from("devices")
        .select("*");

    // 2. Fetch all data, newest first
    const { data: all_readings, error: readingsError } = await supabase
        .from("sensor_readings")
        .select("*")
        .order('created_at', { ascending: false });

    if (devicesError) {
        return (
            <div className="p-10 text-center border-2 border-dashed border-red-200 rounded-xl">
                <p className="text-red-500 font-medium">Unable to connect to devices.</p>
                <p className="text-sm text-red-400 mt-2">{devicesError.message}</p>
            </div>
        );
    }

    if (readingsError) {
        console.error("Error fetching readings:", readingsError);
        // We continue even if readings fail, to show the devices at least
    }

    // 3. Create a map of latest readings for each device
    const latestReadingsMap = new Map();
    all_readings?.forEach((reading) => {
        if (!latestReadingsMap.has(reading.device_name)) {
            latestReadingsMap.set(reading.device_name, reading);
        }
    });

    // 4. Merge devices with their latest readings
    const deviceDisplayList = devices?.map((device) => {
        const reading = latestReadingsMap.get(device.device_name);
        return {
            ...device,
            // If we have a reading, use its values. Otherwise, use null/defaults.
            moisture: reading?.moisture ?? null,
            temperature: reading?.temperature ?? null,
            humidity: reading?.humidity ?? null,
            light: reading?.light ?? null,
            last_reading_at: reading?.created_at ?? null,
        };
    }) || [];

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <h1 className="text-3xl font-bold text-slate-800 mb-8 tracking-tight"> Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deviceDisplayList.map((device) => (
                    <Link href={`/devices/${device.device_name}`} key={device.id}>
                        <Card className="overflow-hidden border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-bold flex items-center justify-between text-slate-700">
                                    {device.device_name}
                                    <span className={`h-3 w-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)] ${device.last_reading_at ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-300'}`} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl">
                                        <Droplets className="text-blue-500 h-5 w-5" />
                                        <div>
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Moisture</p>
                                            <p className="text-lg font-bold text-blue-900">{device.moisture !== null ? `${device.moisture}%` : "--"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-xl">
                                        <Thermometer className="text-orange-500 h-5 w-5" />
                                        <div>
                                            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Temp</p>
                                            <p className="text-lg font-bold text-orange-900">{device.temperature !== null ? `${device.temperature}°C` : "--"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl">
                                        <Wind className="text-indigo-500 h-5 w-5" />
                                        <div>
                                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Humidity</p>
                                            <p className="text-lg font-bold text-indigo-900">{device.humidity !== null ? `${device.humidity}%` : "--"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-yellow-50/50 rounded-xl">
                                        <Sun className="text-yellow-600 h-5 w-5" />
                                        <div>
                                            <p className="text-[10px] text-yellow-700 font-bold uppercase tracking-wider">Light</p>
                                            <p className="text-lg font-bold text-yellow-900">{device.light !== null ? `${device.light}%` : "--"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-400 text-[10px] font-medium uppercase tracking-tight">
                                    <Clock className="h-3 w-3" />
                                    Last Sync: {device.last_reading_at ? new Date(device.last_reading_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never"}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}