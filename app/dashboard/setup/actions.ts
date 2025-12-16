"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function registerDevice(deviceId: string) {
    const supabase = await createClient()

    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error("User not authenticated")
    }

    // 2. Check if device is already registered
    const { data: existingPlant } = await supabase
        .from("plants")
        .select("id, user_id")
        .eq("device_id", deviceId)
        .single()

    if (existingPlant) {
        if (existingPlant.user_id === user.id) {
            // Already registered to this user, treat as success
            return { success: true, plantId: existingPlant.id }
        } else {
            // Registered to someone else
            throw new Error("This device is already registered to another account")
        }
    }

    // 3. Register the device (create a new plant)
    const { data: newPlant, error: insertError } = await supabase
        .from("plants")
        .insert({
            device_id: deviceId,
            user_id: user.id,
            name: `Sage Garden ${deviceId.slice(-4)}`, // Default name with last 4 chars of MAC
            plant_type: "Unknown", // User can update this later
            location: "Default",
        })
        .select("id")
        .single()

    if (insertError) {
        console.error("Error registering device:", insertError)
        throw new Error("Failed to register device: " + insertError.message)
    }

    revalidatePath("/dashboard")
    return { success: true, plantId: newPlant?.id || null }
}
