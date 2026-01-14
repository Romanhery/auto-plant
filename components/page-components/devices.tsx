// all the libraries needed or depencies
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Droplets, Thermometer, Sun, Wind, Clock } from "lucide-react";
import Link from "next/link";

// export the function use async because we are waiting for something
export default async function Devices() {
    // create a supabase client
    const supabase = await createClient();

    // assing the variable data as devices and error as devicesError then fetch from supabase all the devices
    const { data: devices, error: devicesError } = await supabase
        // fetch from devices table
        .from("devices")
        // select all the data
        .select("*");

    // assign the variable data as all_readings and error as readingsError then fetch from supabase all the sensor readings
    const { data: all_readings, error: readingsError } = await supabase
        // fetch from sensor_readings table
        .from("sensor_readings")
        // select all the data
        .select("*")
        // order the data by created_at in descending order
        .order('created_at', { ascending: false });

    // if there is an error while fetching the devices
    if (devicesError) {
        // return or show
        return (
            // this is an html element a div like a page its a page

            <div
                // styling for it shows red so it alerts the person
                className="p-10 text-center border-2 border-dashed border-red-200 rounded-xl"
            >
                {/* shows a paragraph tag displays that it wasnt able to connect to the devices */}
                <p className="text-red-500 font-medium">Unable to connect to devices.</p>
                {/* shows the message */}
                <p className="text-sm text-red-400 mt-2">{devicesError.message}</p>
            </div>
        );
    }

    // if there was an error while fetching the sensor readings
    if (readingsError) {
        // in the console log the error
        console.error("Error fetching readings:", readingsError);
    }

    // create a map of the latest readings
    const latestReadingsMap = new Map();
    // the loop through each of the readings
    all_readings?.forEach((reading) => {
        // if the map does not have the device name
        if (!latestReadingsMap.has(reading.device_name)) {
            // add the reading to the map
            latestReadingsMap.set(reading.device_name, reading);
        }
    });

    // create a varaibel that creates a map of devices
    const deviceDisplayList = devices?.map((device) => {
        // and their latest readings using get device_name
        const reading = latestReadingsMap.get(device.device_name);
        // return the device and its latest reading
        return {
            ...device,
            // there is no reading for the device
            moisture: reading?.moisture ?? null,
            temperature: reading?.temperature ?? null,
            humidity: reading?.humidity ?? null,
            light: reading?.light ?? null,
            last_reading_at: reading?.created_at ?? null,
        };
    }) || [];

    // return the page or display it 
    return (
        //creates a division
        <div className="p-6 bg-slate-50 min-h-screen">
            {/* shows the title dashboard*/}
            <h1 className="text-3xl font-bold text-slate-800 mb-8 tracking-tight"> Dashboard</h1>

            {/* creates a grid for the devices */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* this loops through each device and creates a card for it */}
                {deviceDisplayList.map((device) => (
                    //then this creates a link to the device page but it loops through it using the device id as the key but puts the device name in the url
                    <Link href={`/devices/${device.device_name}`} key={device.id}>
                        {/* this is the card for the device */}
                        <Card className="overflow-hidden border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white">
                            {/* this is the header for the card */}
                            <CardHeader className="pb-2">
                                {/* this is the title for the card */}
                                <CardTitle className="text-xl font-bold flex items-center justify-between text-slate-700">
                                    {device.device_name}
                                    {/* this is the indicator for the card */}
                                    <span className={`h-3 w-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)] ${device.last_reading_at ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-300'}`} />
                                </CardTitle>
                            </CardHeader>
                            {/* this is the content for the card */}
                            <CardContent>
                                {/* this is the division for the card stuff */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* this displays the moisture in on the card */}
                                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl">
                                        {/* this is a water droplet icon that is blue for the moisture */}
                                        <Droplets className="text-blue-500 h-5 w-5" />
                                        <div>
                                            {/* this is the moisture title */}
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Moisture</p>
                                            {/* this is the moisture value from the database that we fetched up there*/}
                                            <p className="text-lg font-bold text-blue-900">{device.moisture !== null ? `${device.moisture}%` : "--"}</p>
                                        </div>
                                    </div>
                                    {/* this displays the temperature in on the card */}
                                    <div className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-xl">
                                        {/* thermometor icon for the temperature part of the card */}
                                        <Thermometer className="text-orange-500 h-5 w-5" />
                                        <div>
                                            {/* this is the temperature title */}
                                            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Temp</p>
                                            {/* this is the temperature value from the database that we fetched up there*/}
                                            <p className="text-lg font-bold text-orange-900">{device.temperature !== null ? `${device.temperature}°C` : "--"}</p>
                                        </div>
                                    </div>
                                    {/* this displays the humidity in on the card */}
                                    <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl">
                                        {/* this is the humidity icon for the humidity part of the card */}
                                        <Wind className="text-indigo-500 h-5 w-5" />
                                        <div>
                                            {/* this is the humidity title */}
                                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Humidity</p>
                                            <p className="text-lg font-bold text-indigo-900">{device.humidity !== null ? `${device.humidity}%` : "--"}</p>
                                        </div>
                                    </div>
                                    {/* this displays the light in on the card */}
                                    <div className="flex items-center gap-3 p-3 bg-yellow-50/50 rounded-xl">
                                        {/* this is the light icon for the light part of the card */}
                                        <Sun className="text-yellow-600 h-5 w-5" />
                                        <div>
                                            {/* this is the light title */}
                                            <p className="text-[10px] text-yellow-700 font-bold uppercase tracking-wider">Light</p>
                                            {/* this is the light value from the database that we fetched up there*/}
                                            <p className="text-lg font-bold text-yellow-900">{device.light !== null ? `${device.light}%` : "--"}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* this displays the last it fetched the data from the database */}
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-400 text-[10px] font-medium uppercase tracking-tight">
                                    {/* this is the clock icon for the last sync time */}
                                    <Clock className="h-3 w-3" />
                                    {/* this is the last sync time */}
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