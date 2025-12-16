"use client"

import { useEffect, useState } from "react"
import { IconTrendingDown, IconTrendingUp, IconActivity } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
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
  const previous = readings[1]

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
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {metrics.map((metric) => {
        const key = metric.key as keyof SensorReading
        const val = latest[key] as number | null
        const prevVal = previous ? (previous[key] as number | null) : val

        let trend = 0
        let isUp = true
        if (prevVal && val) {
          trend = ((val - prevVal) / prevVal) * 100
          isUp = val >= prevVal
        }

        return (
          <Card key={metric.label} className="@container/card">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {val?.toFixed(1) ?? "-"} {metric.unit}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  {isUp ? <IconTrendingUp className="mr-1 size-3" /> : <IconTrendingDown className="mr-1 size-3" />}
                  {Math.abs(trend).toFixed(1)}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {isUp ? "Trending up" : "Trending down"} <metric.icon className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Device: {latest.device_id || "Unknown"}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
