"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { SentimentAnalytics } from "./SentimentAnalytics"

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--muted))"
]

interface ChartData {
  name: string
  value: number
}

interface SentimentData {
  category: string
  count: number
  percentage: number
}

interface ReportsChartsProps {
  statusCounts: ChartData[]
  serviceTypeCounts: ChartData[]
  ratingCounts: ChartData[]
  totalAppointments: number
  sentimentDistribution: SentimentData[]
  averageSentimentScore: number
  sentimentByService: Record<string, {
    averageScore: number
    distribution: SentimentData[]
  }>
  sentimentTrend: {
    date: string
    averageScore: number
  }[]
}

export function ReportsCharts({
  statusCounts,
  serviceTypeCounts,
  ratingCounts,
  totalAppointments,
  sentimentDistribution,
  averageSentimentScore,
  sentimentByService,
  sentimentTrend
}: ReportsChartsProps) {
  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <ChartContainer
                config={{
                  value: { color: "hsl(var(--primary))" }
                }}
              >
                <PieChart>
                  <Pie
                    data={statusCounts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {statusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <ChartContainer
                config={{
                  value: { color: "hsl(var(--primary))" }
                }}
              >
                <BarChart data={serviceTypeCounts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <ChartContainer
                config={{
                  value: { color: "hsl(var(--primary))" }
                }}
              >
                <BarChart data={ratingCounts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <SentimentAnalytics
        sentimentDistribution={sentimentDistribution}
        averageSentimentScore={averageSentimentScore}
        sentimentByService={sentimentByService}
        sentimentTrend={sentimentTrend}
      />
    </div>
  )
} 