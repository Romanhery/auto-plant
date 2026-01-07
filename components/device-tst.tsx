import { createClient } from "@/lib/supabase/server";

export async function DevicesTst(){
    const supabase = await createClient();
    const {data : devices , error : devicesError} = await supabase.from("devices").select("*");

    if(devicesError){
        console.error("Error fetching devices:", devicesError);
        return null;
    }

    return devices;
}