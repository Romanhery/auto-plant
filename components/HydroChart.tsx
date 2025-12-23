"use client";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
} from 'recharts';

interface HydroChartProps {
  data: any[];
  metric: "moisture" | "temperature" | "humidity" | "light";
  color: string;
}

export default function HydroChart({ data, metric, color }: HydroChartProps) {
  // We format the data here so the chart understands it
  const chartData = data.map(d => ({
    time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: d[metric]
  })).reverse(); // .reverse() makes the newest data appear on the right!

  return (
    <div className="h-[300px] w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="time" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            stroke="#94a3b8" 
          />
          <YAxis 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            stroke="#94a3b8" 
            unit="%" 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={3} 
            dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}