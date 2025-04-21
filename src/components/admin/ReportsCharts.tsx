"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { SentimentAnalytics } from "./SentimentAnalytics"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 9pt;
            line-height: 1.1;
            color: #000 !important;
            background: #fff !important;
          }
          
          * {
            color: #000 !important;
            background: #fff !important;
            border-color: #e5e7eb !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          
          .grid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          .card {
            break-inside: avoid;
            page-break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
            margin-bottom: 0.25rem !important;
            background: #fff !important;
          }

          .card-header {
            padding: 0.25rem !important;
            background: #f8f9fa !important;
            border-bottom: 1px solid #e5e7eb !important;
          }

          .card-title {
            font-size: 10pt !important;
            font-weight: 600 !important;
            margin: 0 !important;
            color: #000 !important;
          }

          .card-content {
            padding: 0.25rem !important;
            background: #fff !important;
          }

          .chart-view {
            display: none !important;
          }

          .print-view {
            display: block !important;
          }

          .print-header {
            text-align: center;
            margin-bottom: 0.5rem;
            padding-bottom: 0.25rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .print-header h1 {
            font-size: 12pt;
            margin: 0;
            color: #000 !important;
          }

          .print-header p {
            font-size: 8pt;
            color: #666 !important;
            margin: 0;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.25rem;
            margin-bottom: 0.5rem;
          }

          .summary-card {
            border: 1px solid #e5e7eb;
            padding: 0.25rem;
            text-align: center;
            background: #fff !important;
          }

          .summary-card h3 {
            font-size: 8pt;
            color: #666 !important;
            margin: 0 0 0.125rem 0;
          }

          .summary-card p {
            font-size: 10pt;
            font-weight: 600;
            margin: 0;
            color: #000 !important;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0.25rem;
            font-size: 8pt;
            background: #fff !important;
          }

          th, td {
            border: 1px solid #e5e7eb;
            padding: 0.125rem 0.25rem;
            text-align: left;
            color: #000 !important;
            background: #fff !important;
          }

          th {
            background: #f8f9fa !important;
            font-weight: 600;
            white-space: nowrap;
          }

          .percentage {
            text-align: right;
            font-family: monospace;
            width: 3rem;
          }

          .sentiment-summary {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.25rem;
            margin-top: 0.25rem;
          }

          .sentiment-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.125rem 0;
            border-bottom: 1px solid #f3f4f6;
          }

          .sentiment-label {
            font-weight: 500;
            font-size: 8pt;
            color: #000 !important;
          }

          .sentiment-value {
            font-family: monospace;
            font-size: 8pt;
            color: #000 !important;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.25rem;
            margin-top: 0.25rem;
          }

          .stats-card {
            border: 1px solid #e5e7eb;
            padding: 0.25rem;
            background: #fff !important;
          }

          .stats-card h4 {
            font-size: 8pt;
            margin: 0 0 0.125rem 0;
            color: #666 !important;
          }

          .stats-card p {
            font-size: 8pt;
            margin: 0;
            color: #000 !important;
          }

          /* Ensure all text is black and readable */
          h1, h2, h3, h4, h5, h6, p, span, div {
            color: #000 !important;
          }

          /* Ensure all backgrounds are white */
          div, section, article, main, header, footer {
            background: #fff !important;
          }
        }

        @media screen {
          .print-view {
            display: none !important;
          }
        }
      `}</style>

      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <Button 
            onClick={handlePrint}
            className="no-print"
            variant="outline"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
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

        {/* Chart View */}
        <div className="chart-view">
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
        </div>

        {/* Print View */}
        <div className="print-view">
          <div className="print-header">
            <h1>Business Analytics Report</h1>
            <p>Generated on {new Date().toLocaleDateString()}</p>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <h3>Total Appointments</h3>
              <p>{totalAppointments}</p>
            </div>
            <div className="summary-card">
              <h3>Average Rating</h3>
              <p>{ratingCounts.reduce((acc, curr) => acc + (Number(curr.name) * curr.value), 0) / ratingCounts.reduce((acc, curr) => acc + curr.value, 0) || 0}</p>
            </div>
            <div className="summary-card">
              <h3>Average Sentiment</h3>
              <p>{averageSentimentScore.toFixed(2)}</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stats-card">
              <h4>Appointment Status</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead className="percentage">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusCounts.map((status) => {
                    const percentage = (status.value / totalAppointments) * 100
                    return (
                      <TableRow key={status.name}>
                        <TableCell>{status.name}</TableCell>
                        <TableCell>{status.value}</TableCell>
                        <TableCell className="percentage">{percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="stats-card">
              <h4>Service Distribution</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead className="percentage">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceTypeCounts.map((service) => {
                    const percentage = (service.value / totalAppointments) * 100
                    return (
                      <TableRow key={service.name}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{service.value}</TableCell>
                        <TableCell className="percentage">{percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="stats-card">
              <h4>Customer Ratings</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rating</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead className="percentage">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratingCounts.map((rating) => {
                    const totalRatings = ratingCounts.reduce((sum, r) => sum + r.value, 0)
                    const percentage = (rating.value / totalRatings) * 100
                    return (
                      <TableRow key={rating.name}>
                        <TableCell>{rating.name} Stars</TableCell>
                        <TableCell>{rating.value}</TableCell>
                        <TableCell className="percentage">{percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="stats-card">
              <h4>Sentiment Analysis</h4>
              <div className="sentiment-summary">
                {sentimentDistribution.map(({ category, count, percentage }) => (
                  <div key={category} className="sentiment-item">
                    <span className="sentiment-label">{category.replace('_', ' ')}</span>
                    <span className="sentiment-value">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SentimentAnalytics
          sentimentDistribution={sentimentDistribution}
          averageSentimentScore={averageSentimentScore}
          sentimentByService={sentimentByService}
          sentimentTrend={sentimentTrend}
        />
      </div>
    </>
  )
} 