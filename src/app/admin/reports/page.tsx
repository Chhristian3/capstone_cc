import { prisma } from "@/lib/prisma"
import { ReportsCharts } from "@/components/admin/ReportsCharts"

interface ChartData {
  name: string
  value: number
}

interface SentimentData {
  category: string
  count: number
  percentage: number
}

interface Stats {
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

async function getAppointmentStats(): Promise<Stats> {
  const appointments = await prisma.appointment.findMany({
    include: {
      serviceType: true,
      rating: true,
    },
    orderBy: {
      appointmentDate: 'asc'
    }
  })

  const statusCounts = appointments.reduce((acc, appointment) => {
    acc[appointment.status] = (acc[appointment.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const serviceTypeCounts = appointments.reduce((acc, appointment) => {
    acc[appointment.serviceType.name] = (acc[appointment.serviceType.name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const ratingCounts = appointments.reduce((acc, appointment) => {
    if (appointment.rating) {
      acc[appointment.rating.ratingValue] = (acc[appointment.rating.ratingValue] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Calculate sentiment statistics
  const sentimentStats = appointments.reduce((acc, appointment) => {
    if (appointment.rating?.sentimentCategory) {
      acc[appointment.rating.sentimentCategory] = (acc[appointment.rating.sentimentCategory] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const totalSentiments = Object.values(sentimentStats).reduce((a, b) => a + b, 0)
  const sentimentDistribution = Object.entries(sentimentStats).map(([category, count]) => ({
    category,
    count,
    percentage: totalSentiments > 0 ? (count / totalSentiments) * 100 : 0
  }))

  // Calculate average sentiment score
  const averageSentimentScore = appointments.reduce((acc, curr) => {
    return acc + (curr.rating?.sentimentScore || 0)
  }, 0) / (appointments.length || 1)

  // Calculate sentiment by service type
  const sentimentByService = appointments.reduce((acc, appointment) => {
    if (!appointment.rating) return acc
    
    const serviceName = appointment.serviceType.name
    if (!acc[serviceName]) {
      acc[serviceName] = {
        averageScore: 0,
        distribution: []
      }
    }
    
    acc[serviceName].averageScore += appointment.rating.sentimentScore || 0
    
    if (appointment.rating.sentimentCategory) {
      const existingCategory = acc[serviceName].distribution.find(
        d => d.category === appointment.rating?.sentimentCategory
      )
      if (existingCategory) {
        existingCategory.count++
      } else {
        acc[serviceName].distribution.push({
          category: appointment.rating.sentimentCategory,
          count: 1,
          percentage: 0
        })
      }
    }
    
    return acc
  }, {} as Record<string, { averageScore: number; distribution: SentimentData[] }>)

  // Calculate percentages for each service's sentiment distribution
  Object.keys(sentimentByService).forEach(serviceName => {
    const total = sentimentByService[serviceName].distribution.reduce((acc, curr) => acc + curr.count, 0)
    sentimentByService[serviceName].distribution.forEach(item => {
      item.percentage = (item.count / total) * 100
    })
    sentimentByService[serviceName].averageScore /= total
  })

  // Calculate sentiment trend over time
  const sentimentTrend = appointments.reduce((acc, appointment) => {
    if (!appointment.rating) return acc
    
    const date = new Date(appointment.appointmentDate).toISOString().split('T')[0]
    const existingDate = acc.find(d => d.date === date)
    
    if (existingDate) {
      existingDate.averageScore = (existingDate.averageScore + (appointment.rating.sentimentScore || 0)) / 2
    } else {
      acc.push({
        date,
        averageScore: appointment.rating.sentimentScore || 0
      })
    }
    
    return acc
  }, [] as { date: string; averageScore: number }[])

  return {
    statusCounts: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    serviceTypeCounts: Object.entries(serviceTypeCounts).map(([name, value]) => ({ name, value })),
    ratingCounts: Object.entries(ratingCounts).map(([name, value]) => ({ name, value })),
    totalAppointments: appointments.length,
    sentimentDistribution,
    averageSentimentScore,
    sentimentByService,
    sentimentTrend
  }
}

export default async function ReportsPage() {
  const stats = await getAppointmentStats()

  return <ReportsCharts {...stats} />
} 