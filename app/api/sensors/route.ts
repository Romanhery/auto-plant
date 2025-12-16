import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const sensorDataSchema = z.object({
    device_id: z.string().min(1),
    temperature: z.number().nullable().optional(),
    humidity: z.number().nullable().optional(),
    soil_moisture: z.number().nullable().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // Validate input
        const validation = sensorDataSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid data format", details: validation.error.format() },
                { status: 400 }
            )
        }

        const { device_id, temperature, humidity, soil_moisture } = validation.data
        const supabase = await createClient()

        // Insert into Supabase
        // The database trigger 'trigger_auto_link_plant' will handle plant_id linking
        const { error } = await supabase.from("sensor_readings").insert({
            device_id,
            temperature: temperature ?? null,
            humidity: humidity ?? null,
            soil_moisture: soil_moisture ?? null,
        })

        if (error) {
            console.error("Supabase error:", error)
            return NextResponse.json({ error: "Database error" }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
