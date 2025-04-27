"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { SentimentAnalytics } from "./SentimentAnalytics"
import { Button } from "@/components/ui/button"
import { Printer, Calendar } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format, subDays, subMonths, subYears, isWithinInterval } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useAppointments } from "@/contexts/AppointmentContext"

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--muted))"
]

const STATUS_COLORS = {
  PENDING: "hsl(45, 93%, 47%)",      // Yellow
  SCHEDULED: "hsl(221, 83%, 53%)",   // Blue
  COMPLETED: "hsl(142, 76%, 36%)",   // Green
  CANCELLED: "hsl(0, 84%, 60%)"      // Red
}

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
  totalAppointments: number
  sentimentByService: Record<string, {
    averageScore: number
    distribution: SentimentData[]
  }>
  sentimentTrend: {
    date: string
    averageScore: number
  }[]
}

type FilterOption = "all" | "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED"
type SentimentFilter = "all" | "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE"
type DateFilter = "all" | "weekly" | "monthly" | "yearly"

export function ReportsCharts({
  statusCounts,
  totalAppointments,
  sentimentByService,
  sentimentTrend
}: Omit<ReportsChartsProps, 'serviceTypeCounts' | 'ratingCounts' | 'sentimentDistribution' | 'averageSentimentScore'>) {
  const [statusFilter, setStatusFilter] = useState<FilterOption>("all")
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isServiceDetailsOpen, setIsServiceDetailsOpen] = useState(false)
  const { allAppointments } = useAppointments()
  const [startMonth, setStartMonth] = useState(new Date().getMonth())
  const [startYear, setStartYear] = useState(new Date().getFullYear())
  const [endMonth, setEndMonth] = useState(new Date().getMonth())
  const [endYear, setEndYear] = useState(new Date().getFullYear())

  // Filter appointments by selected month/year range
  const filteredAppointments = useMemo(() => {
    const startDate = new Date(startYear, startMonth, 1, 0, 0, 0, 0)
    const endDate = new Date(endYear, endMonth + 1, 0, 23, 59, 59, 999)
    return allAppointments.filter((appointment: any) => {
      const appointmentDate = new Date(appointment.appointmentDate)
      return appointmentDate >= startDate && appointmentDate <= endDate
    })
  }, [allAppointments, startMonth, startYear, endMonth, endYear])

  // Calculate sentiment distribution from filteredAppointments
  const sentimentDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredAppointments.forEach((appointment: any) => {
      if (appointment.rating && appointment.rating.sentimentCategory) {
        counts[appointment.rating.sentimentCategory] = (counts[appointment.rating.sentimentCategory] || 0) + 1
      }
    })
    const total = filteredAppointments.length
    return Object.entries(counts).map(([category, count]) => ({
      category,
      count,
      percentage: total ? (count / total) * 100 : 0
    }))
  }, [filteredAppointments])

  // Calculate average sentiment score from filteredAppointments
  const averageSentimentScore = useMemo(() => {
    let totalScore = 0
    let count = 0
    filteredAppointments.forEach((appointment: any) => {
      if (appointment.rating && typeof appointment.rating.sentimentScore === 'number') {
        totalScore += appointment.rating.sentimentScore
        count++
      }
    })
    return count ? totalScore / count : 0
  }, [filteredAppointments])

  const totalFilteredAppointments = useMemo(() => 
    filteredAppointments.length, 
    [filteredAppointments]
  )

  // Calculate service type counts from filteredAppointments
  const serviceTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredAppointments.forEach((appointment: any) => {
      const name = appointment.serviceType?.name || 'Unknown'
      counts[name] = (counts[name] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredAppointments])

  // Calculate rating counts from filteredAppointments
  const ratingCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredAppointments.forEach((appointment: any) => {
      if (appointment.rating && appointment.rating.ratingValue) {
        counts[appointment.rating.ratingValue] = (counts[appointment.rating.ratingValue] || 0) + 1
      }
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredAppointments])

  // Calculate status counts from filteredAppointments
  const filteredStatusCounts = useMemo(() => {
    const counts = filteredAppointments.reduce((acc: Record<string, number>, appointment: any) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredAppointments])

  // Filtered appointments for print/save report (by month range and status)
  const filteredForPrint = useMemo(() => {
    if (statusFilter === 'all') return filteredAppointments
    return filteredAppointments.filter(a => a.status === statusFilter)
  }, [filteredAppointments, statusFilter])

  const handlePrint = () => {
    window.print()
  }

  const filteredSentimentDistribution = sentimentDistribution.filter(item =>
    sentimentFilter === "all" || item.category === sentimentFilter
  )

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "hsl(var(--muted))"
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase()
  }

  const getFilteredPieData = () => {
    if (statusFilter === "all") {
      return filteredStatusCounts
    }
    const filteredStatus = filteredStatusCounts.find(item => item.name === statusFilter)
    if (!filteredStatus) return []
    return [
      filteredStatus,
      {
        name: "Other",
        value: totalFilteredAppointments - filteredStatus.value
      }
    ]
  }

  const handlePieClick = (entry: any) => {
    if (entry.name !== "Other") {
      setSelectedStatus(entry.name)
      setIsDetailsOpen(true)
    }
  }

  const getFilteredAppointments = () => {
    if (!selectedStatus) return []
    return allAppointments.filter(appointment => appointment.status === selectedStatus)
  }

  const getFilteredServiceAppointments = () => {
    if (!selectedService) return []
    
    // First filter by date range
    const dateFilteredAppointments = filteredAppointments
    
    // Then filter by service type
    return dateFilteredAppointments.filter(appointment => {
      return appointment.serviceType?.name?.toLowerCase() === selectedService.toLowerCase()
    })
  }

  const handleServiceClick = (entry: any) => {
    console.log('Service clicked:', entry)
    if (entry && entry.name) {
      setSelectedService(entry.name)
      setIsServiceDetailsOpen(true)
    }
  }

  // In all print view analytics, use filteredForPrint instead of filteredAppointments
  const totalPrintAppointments = filteredForPrint.length
  const printStatusCounts = useMemo(() => {
    const counts = filteredForPrint.reduce((acc: Record<string, number>, appointment: any) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredForPrint])
  const printServiceTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredForPrint.forEach((appointment: any) => {
      const name = appointment.serviceType?.name || 'Unknown'
      counts[name] = (counts[name] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredForPrint])
  const printRatingCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredForPrint.forEach((appointment: any) => {
      if (appointment.rating && appointment.rating.ratingValue) {
        counts[appointment.rating.ratingValue] = (counts[appointment.rating.ratingValue] || 0) + 1
      }
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredForPrint])
  const printSentimentDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredForPrint.forEach((appointment: any) => {
      if (appointment.rating && appointment.rating.sentimentCategory) {
        counts[appointment.rating.sentimentCategory] = (counts[appointment.rating.sentimentCategory] || 0) + 1
      }
    })
    const total = filteredForPrint.length
    return Object.entries(counts).map(([category, count]) => ({
      category,
      count,
      percentage: total ? (count / total) * 100 : 0
    }))
  }, [filteredForPrint])
  const printAverageSentimentScore = useMemo(() => {
    let totalScore = 0
    let count = 0
    filteredForPrint.forEach((appointment: any) => {
      if (appointment.rating && typeof appointment.rating.sentimentScore === 'number') {
        totalScore += appointment.rating.sentimentScore
        count++
      }
    })
    return count ? totalScore / count : 0
  }, [filteredForPrint])

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

      <div className="container mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              {/* Month/Year Range Picker */}
              <div className="flex items-center gap-2 bg-card p-2 rounded-md border shadow-sm">
                <select
                  value={startMonth}
                  onChange={e => setStartMonth(Number(e.target.value))}
                  className="border rounded px-2 py-1 bg-background text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
                <select
                  value={startYear}
                  onChange={e => setStartYear(Number(e.target.value))}
                  className="border rounded px-2 py-1 bg-background text-sm"
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
                <span className="mx-1 text-muted-foreground">to</span>
                <select
                  value={endMonth}
                  onChange={e => setEndMonth(Number(e.target.value))}
                  className="border rounded px-2 py-1 bg-background text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
                <select
                  value={endYear}
                  onChange={e => setEndYear(Number(e.target.value))}
                  className="border rounded px-2 py-1 bg-background text-sm"
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>

              <Select value={statusFilter} onValueChange={(value: FilterOption) => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px] bg-card border shadow-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: STATUS_COLORS.PENDING }}
                      />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="SCHEDULED">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: STATUS_COLORS.SCHEDULED }}
                      />
                      Scheduled
                    </div>
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: STATUS_COLORS.COMPLETED }}
                      />
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: STATUS_COLORS.CANCELLED }}
                      />
                      Cancelled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={sentimentFilter} onValueChange={(value: SentimentFilter) => setSentimentFilter(value)}>
                <SelectTrigger className="w-[180px] bg-card border shadow-sm">
                  <SelectValue placeholder="Filter by sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="VERY_POSITIVE">Very Positive</SelectItem>
                  <SelectItem value="POSITIVE">Positive</SelectItem>
                  <SelectItem value="NEUTRAL">Neutral</SelectItem>
                  <SelectItem value="NEGATIVE">Negative</SelectItem>
                  <SelectItem value="VERY_NEGATIVE">Very Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handlePrint}
              className="no-print bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto"
              variant="default"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print / Save Report
            </Button>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="w-full text-center py-16 text-muted-foreground text-lg bg-card rounded-lg border shadow-sm">
            No appointments found for the selected range.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFilteredAppointments}</div>
                  <div className="text-xs text-muted-foreground">
                    {startMonth === endMonth && startYear === endYear
                      ? `${new Date(startYear, startMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`
                      : `${new Date(startYear, startMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} - ${new Date(endYear, endMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart View */}
            <div className="chart-view">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="border-b pb-3">
                    <CardTitle className="text-lg font-semibold">Appointment Status</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div>
                        <ChartContainer
                          config={{
                            value: { color: "hsl(var(--primary))" }
                          }}
                        >
                          <PieChart>
                            <Pie
                              data={getFilteredPieData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="hsl(var(--primary))"
                              dataKey="value"
                              label={({ name, percent }: { name: string; percent: number }) => 
                                `${name} ${(percent * 100).toFixed(0)}%`
                              }
                              onClick={handlePieClick}
                            >
                              {getFilteredPieData().map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.name === "Other" ? "hsl(var(--muted))" : getStatusColor(entry.name)} 
                                  style={{ cursor: entry.name === "Other" ? "default" : "pointer" }}
                                />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ChartContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-4">
                        {getFilteredPieData().map((status) => (
                          <div 
                            key={status.name} 
                            className="flex items-center gap-2 cursor-pointer hover:opacity-80 bg-muted/30 px-3 py-1.5 rounded-full transition-colors"
                            onClick={() => {
                              if (status.name !== "Other") {
                                setSelectedStatus(status.name)
                                setIsDetailsOpen(true)
                              }
                            }}
                          >
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ 
                                backgroundColor: status.name === "Other" 
                                  ? "hsl(var(--muted))" 
                                  : getStatusColor(status.name)
                              }}
                            />
                            <span className="text-sm font-medium">
                              {status.name === "Other" ? "Other Statuses" : getStatusLabel(status.name)}:{" "}
                              <span className="font-bold">{status.value}</span>{" "}
                              <span className="text-muted-foreground">
                                ({(status.value / totalFilteredAppointments * 100).toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="border-b pb-3">
                    <CardTitle className="text-lg font-semibold">Service Type Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div>
                      <ChartContainer
                        config={{
                          value: { color: "hsl(var(--primary))" }
                        }}
                      >
                        <BarChart 
                          data={serviceTypeCounts}
                          onClick={handleServiceClick}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis 
                            dataKey="name" 
                            onClick={handleServiceClick}
                            style={{ cursor: "pointer" }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar 
                            dataKey="value" 
                            fill="hsl(var(--primary))"
                            onClick={handleServiceClick}
                            style={{ cursor: "pointer" }}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ChartContainer>
                    </div>
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                      {serviceTypeCounts.map((service) => (
                        <div 
                          key={service.name} 
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80 bg-muted/30 px-3 py-1.5 rounded-full transition-colors"
                          onClick={() => {
                            setSelectedService(service.name)
                            setIsServiceDetailsOpen(true)
                          }}
                        >
                          <div className="h-3 w-3 rounded-full bg-primary" />
                          <span className="text-sm font-medium">
                            {service.name}:{" "}
                            <span className="font-bold">{service.value}</span>{" "}
                            <span className="text-muted-foreground">
                              ({(service.value / totalFilteredAppointments * 100).toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="border-b pb-3">
                    <CardTitle className="text-lg font-semibold">Customer Ratings</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div>
                      <ChartContainer
                        config={{
                          value: { color: "hsl(var(--primary))" }
                        }}
                      >
                        <BarChart data={ratingCounts}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Print View */}
            <div className="print-view" style={{ fontFamily: 'Arial, sans-serif', color: '#222' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #222', paddingBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>Business Analytics Report</h1>
                <div style={{ fontSize: '0.95rem', color: '#444', marginTop: '0.25rem' }}>
                  Date Range: {startMonth === endMonth && startYear === endYear
                    ? `${new Date(startYear, startMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`
                    : `${new Date(startYear, startMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} - ${new Date(endYear, endMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.1rem' }}>Generated on {new Date().toLocaleDateString()}</div>
              </div>

              {/* Summary Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '1rem', background: '#f9fafb', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 4 }}>Total Appointments</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalPrintAppointments}</div>
                </div>
                <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '1rem', background: '#f9fafb', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 4 }}>Average Rating</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{printRatingCounts.reduce((acc, curr) => acc + (Number(curr.name) * curr.value), 0) / printRatingCounts.reduce((acc, curr) => acc + curr.value, 0) || 0}</div>
                </div>
                <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '1rem', background: '#f9fafb', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: 4 }}>Average Sentiment</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{printAverageSentimentScore.toFixed(2)}</div>
                </div>
              </div>

              {/* Appointments Table */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0', borderBottom: '1px solid #d1d5db', paddingBottom: '0.25rem', color: '#333' }}>Appointments List</h2>
                <Table style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                  <TableHeader>
                    <TableRow style={{ background: '#f3f4f6' }}>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...filteredForPrint]
                      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
                      .map((appointment) => (
                      <TableRow key={appointment.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <TableCell>{appointment.customerName}</TableCell>
                        <TableCell>{appointment.serviceType?.name || '-'}</TableCell>
                        <TableCell>{format(new Date(appointment.appointmentDate), "PPP p")}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            style={{ 
                              backgroundColor: getStatusColor(appointment.status),
                              color: "white",
                              borderColor: getStatusColor(appointment.status),
                              fontWeight: 600
                            }}
                          >
                            {getStatusLabel(appointment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div style={{ color: '#666', fontSize: '0.95rem' }}>
                            {appointment.description}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Analytics Section */}
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '1rem', background: '#fff' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#333', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' }}>Appointment Status</h3>
                  <Table style={{ fontSize: '0.98rem' }}>
                    <TableHeader>
                      <TableRow style={{ background: '#f3f4f6' }}>
                        <TableHead>Status</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead className="percentage">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {printStatusCounts.map((status) => {
                        const percentage = (status.value / totalPrintAppointments) * 100
                        return (
                          <TableRow key={status.name} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <TableCell>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div 
                                  style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: getStatusColor(status.name) }}
                                />
                                {getStatusLabel(status.name)}
                              </div>
                            </TableCell>
                            <TableCell>{status.value}</TableCell>
                            <TableCell className="percentage">{percentage.toFixed(1)}%</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '1rem', background: '#fff' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#333', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' }}>Service Distribution</h3>
                  <Table style={{ fontSize: '0.98rem' }}>
                    <TableHeader>
                      <TableRow style={{ background: '#f3f4f6' }}>
                        <TableHead>Service</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead className="percentage">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {printServiceTypeCounts.map((service) => {
                        const percentage = (service.value / totalPrintAppointments) * 100
                        return (
                          <TableRow key={service.name} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <TableCell>{service.name}</TableCell>
                            <TableCell>{service.value}</TableCell>
                            <TableCell className="percentage">{percentage.toFixed(1)}%</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Ratings & Sentiment Section */}
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '1rem', background: '#fff' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#333', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' }}>Customer Ratings</h3>
                  <Table style={{ fontSize: '0.98rem' }}>
                    <TableHeader>
                      <TableRow style={{ background: '#f3f4f6' }}>
                        <TableHead>Rating</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead className="percentage">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {printRatingCounts.map((rating) => {
                        const totalRatings = printRatingCounts.reduce((sum, r) => sum + r.value, 0)
                        const percentage = (rating.value / totalRatings) * 100
                        return (
                          <TableRow key={rating.name} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <TableCell>{rating.name} Stars</TableCell>
                            <TableCell>{rating.value}</TableCell>
                            <TableCell className="percentage">{percentage.toFixed(1)}%</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '1rem', background: '#fff' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#333', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' }}>Sentiment Analysis</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {printSentimentDistribution.map(({ category, count, percentage }) => (
                      <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', padding: '0.25rem 0' }}>
                        <span style={{ fontWeight: 500, fontSize: '0.98rem', color: '#333' }}>{category.replace('_', ' ')}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.98rem', color: '#222' }}>{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <SentimentAnalytics
              sentimentDistribution={filteredSentimentDistribution}
              averageSentimentScore={averageSentimentScore}
              sentimentByService={sentimentByService}
              sentimentTrend={sentimentTrend}
            />

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {selectedStatus && getStatusLabel(selectedStatus)} Appointments
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredAppointments().map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">{appointment.customerName}</TableCell>
                          <TableCell>{appointment.serviceType?.name || '-'}</TableCell>
                          <TableCell>
                            {format(new Date(appointment.appointmentDate), "PPP p")}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              style={{ 
                                backgroundColor: getStatusColor(appointment.status),
                                color: "white",
                                borderColor: getStatusColor(appointment.status)
                              }}
                            >
                              {getStatusLabel(appointment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {appointment.description}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isServiceDetailsOpen} onOpenChange={setIsServiceDetailsOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {selectedService} Appointments
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {getFilteredServiceAppointments().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No appointments found for this service type in the selected date range.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredServiceAppointments().map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-medium">{appointment.customerName}</TableCell>
                            <TableCell>
                              {format(new Date(appointment.appointmentDate), "PPP p")}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                style={{ 
                                  backgroundColor: getStatusColor(appointment.status),
                                  color: "white",
                                  borderColor: getStatusColor(appointment.status)
                                }}
                              >
                                {getStatusLabel(appointment.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {appointment.description}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </>
  )
} 