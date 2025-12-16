"use client"

import { Button } from "@/components/ui/button"
import { IconFlask } from "@tabler/icons-react"
import { toast } from "sonner"
import { simulateSensorData } from "@/app/dashboard/actions"
import { useState } from "react"

export function SimulateDataButton() {
    const [loading, setLoading] = useState(false)

    const handleSimulate = async () => {
        try {
            setLoading(true)
            await simulateSensorData()
            toast.success("Test data injected!")
        } catch (error) {
            toast.error("Failed to simulate data")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleSimulate} disabled={loading}>
            <IconFlask className="mr-2 size-4" />
            {loading ? "Simulating..." : "Simulate Data"}
        </Button>
    )
}
