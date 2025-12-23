import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
// Hint: If you have lucide-react installed, these icons look great!
import { Droplets, Thermometer, Sun, Wind, Clock } from "lucide-react";

export default async function Devices() {
    const supabase = await createClient();

    // We fetch the data and order by newest first so the user sees the latest info
    const { data: sensor_readings, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .order('created_at', { ascending: false });

    if (error) {
        return (
            <div className="p-10 text-center border-2 border-dashed border-red-200 rounded-xl">
                <p className="text-red-500 font-medium">Unable to connect to sensors. Check database connection.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Hydroponic Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sensor_readings?.map((reading) => (
                    <Card key={reading.id} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-bold flex items-center justify-between">
                                {reading.device_name}
                                <span className="h-5 w-5 rounded-full bg-green-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                    <Droplets className="text-blue-500 h-5 w-5" />
                                    <div>
                                        <p className="text-xs text-blue-600 font-semibold uppercase">Moisture</p>
                                        <p className="text-lg font-bold">{reading.moisture}%</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                                    <Thermometer className="text-orange-500 h-5 w-5" />
                                    <div>
                                        <p className="text-xs text-orange-600 font-semibold uppercase">Temp</p>
                                        <p className="text-lg font-bold">{reading.temperature}°C</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                                    <Wind className="text-indigo-500 h-5 w-5" />
                                    <div>
                                        <p className="text-xs text-indigo-600 font-semibold uppercase">Humidity</p>
                                        <p className="text-lg font-bold">{reading.humidity}%</p>
                                    </div>
                                </div>

                                {/* Light Section */}
                                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                                    <Sun className="text-yellow-600 h-5 w-5" />
                                    <div>
                                        <p className="text-xs text-yellow-700 font-semibold uppercase">Light</p>
                                        <p className="text-lg font-bold">{reading.light}%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t flex items-center gap-2 text-slate-400 text-xs italic">
                                <Clock className="h-3 w-3" />
                                Last sync: {new Date(reading.created_at).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}