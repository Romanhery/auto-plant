"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

interface HydroChartProps {
  data: any[];          // Array of sensor readings
  metric: string;       // e.g., "moisture", "temperature", "humidity", "light"
  color: string;        // Line color
}

export default function HydroChart({ data, metric, color }: HydroChartProps) {
  // Prepare the chart data
  const labels = data
    .slice()
    .reverse()
    .map((d) => new Date(d.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

  const chartData = {
    labels,
    datasets: [
      {
        label: metric,
        data: data.slice().reverse().map((d) => d[metric]),
        fill: true,
        backgroundColor: `${color}33`, // transparent fill
        borderColor: color,
        tension: 0.4, // smooth curve
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b7280", font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#6b7280", font: { size: 10 } },
        grid: { drawBorder: false, color: "#e5e7eb" },
      },
    },
  };

  return (
    <div className="w-full h-64 md:h-80">
      <Line data={chartData} options={options} />
    </div>
  );
}
