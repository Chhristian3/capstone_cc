"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

interface ChartData {
  name: string
  value: number
}

interface ReportsChartsProps {
  statusCounts: ChartData[]
  serviceTypeCounts: ChartData[]
  ratingCounts: ChartData[]
  totalAppointments: number
}

export function ReportsCharts({ statusCounts, serviceTypeCounts, ratingCounts, totalAppointments }: ReportsChartsProps) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Total Appointments</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-4xl font-bold">{totalAppointments}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Appointments by Status</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCounts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {statusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Appointments by Service Type</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceTypeCounts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Customer Ratings</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingCounts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 