"use server"
import { createClient } from "@/lib/supabase/server"

export default async function registerDevice(macAddress: string) {
    const supabase = await createClient()

    const {data: {user}, error: authError} = await supabase.auth.getUser()
        
    if (authError || !user) {
        throw new Error("You must be logged in to register a device")
    }
    
    const {error} = await supabase
        .from("devices")
        .insert({
            mac_adress: macAddress,
            user_id: user.id
        })

    if (error) {
        throw new Error("Failed to register device")
    }
}