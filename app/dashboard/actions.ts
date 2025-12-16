"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function simulateSensorData() {
    const supabase = await createClient()

    // 1. Get a device_id from an existing plant to make it realistic
    // If no plants, use a default test ID
    const { data: plant } = await supabase
        .from("plants")
        .select("device_id")
        .limit(1)
        .single()

    const deviceId = plant?.device_id || "test-device-01"

    // 2. Insert a random reading
    const reading = {
        device_id: deviceId,
        temperature: (20 + Math.random() * 10).toFixed(1),
        humidity: (40 + Math.random() * 20).toFixed(1),
        soil_moisture: (30 + Math.random() * 50).toFixed(1),
    }

    const { error } = await supabase.from("sensor_readings").insert(reading)

    if (error) {
        console.error("Simulation error:", error)
        throw new Error(error.message)
    }

    revalidatePath("/dashboard")
    return { success: true }
}
