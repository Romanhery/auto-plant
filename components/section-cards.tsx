"use client"

import { useEffect, useState } from "react"
import { IconActivity } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { SensorReading } from "@/components/data-table"

export function SectionCards({ initialData = [] }: { initialData?: SensorReading[] }) {
  const [readings, setReadings] = useState<SensorReading[]>(initialData)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('sensor_readings_cards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sensor_readings',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReadings((prev) => [payload.new as SensorReading, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setReadings((prev) =>
              prev.map((item) => (item.id === payload.new.id ? payload.new as SensorReading : item))
            )
          } else if (payload.eventType === 'DELETE') {
            setReadings((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const latest = readings[0]

  if (!latest) {
    return (
      <div className="col-span-full text-center p-4 text-muted-foreground">
        No sensor data available.
      </div>
    )
  }

  const metrics = [
    { label: "Temperature", key: "temperature", unit: "°C", icon: IconActivity },
    { label: "Humidity", key: "humidity", unit: "%", icon: IconActivity },
    { label: "Soil Moisture", key: "soil_moisture", unit: "%", icon: IconActivity },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {metrics.map((metric) => {
        const key = metric.key as keyof SensorReading
        const val = latest[key] as number | null

        return (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {val?.toFixed(1) ?? "-"} {metric.unit}
              </CardTitle>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
