"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

import { SensorReading } from "@/components/data-table"

// Unused constants removed

export function ChartAreaInteractive({ initialData = [], referenceTime }: { initialData?: SensorReading[], referenceTime?: number }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [readings, setReadings] = React.useState<SensorReading[]>(initialData)
  const supabase = createClient()

  React.useEffect(() => {
    const channel = supabase
      .channel('sensor_readings_chart')
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

  // Process data for the chart
  const processedData = React.useMemo(() => {
    type DailyData = {
      date: string
      temperature: number
      humidity: number
      soil_moisture: number
      count: number
    }
    const dailyData: Record<string, DailyData> = {}

    readings.forEach((reading) => {
      // Access timestamp safely
      const ts = reading.timestamp
      if (!ts) return

      const date = new Date(ts).toISOString().split('T')[0]

      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          temperature: 0,
          humidity: 0,
          soil_moisture: 0,
          count: 0
        }
      }

      dailyData[date].temperature += Number(reading.temperature || 0)
      dailyData[date].humidity += Number(reading.humidity || 0)
      dailyData[date].soil_moisture += Number(reading.soil_moisture || 0)
      dailyData[date].count += 1
    })

    // Calculate averages
    return Object.values(dailyData).map((day: DailyData) => ({
      date: day.date,
      temperature: day.count ? day.temperature / day.count : 0,
      humidity: day.count ? day.humidity / day.count : 0,
      soil_moisture: day.count ? day.soil_moisture / day.count : 0
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [readings])

  const filteredData = processedData.filter((item) => {
    const date = new Date(item.date)
    const now = referenceTime ? new Date(referenceTime) : new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  // Extract unique keys for chart lines
  const dataKeys = ["temperature", "humidity", "soil_moisture"]

  const dynamicChartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      temperature: { label: "Temperature", color: "var(--chart-1)" },
      humidity: { label: "Humidity", color: "var(--chart-2)" },
      soil_moisture: { label: "Soil Moisture", color: "var(--chart-3)" },
    }
    return config
  }, [])


  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Sensor History</CardTitle>
        <CardDescription>
          Daily average readings
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={dynamicChartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              {dataKeys.map((key) => (
                <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            {dataKeys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`url(#fill${key})`}
                stroke={`var(--color-${key})`}
                stackId="a"
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
