import { prisma } from "@/lib/prisma"
import { ReportsCharts } from "@/components/admin/ReportsCharts"

interface ChartData {
  name: string
  value: number
}

interface Stats {
  statusCounts: ChartData[]
  serviceTypeCounts: ChartData[]
  ratingCounts: ChartData[]
  totalAppointments: number
}

async function getAppointmentStats(): Promise<Stats> {
  const appointments = await prisma.appointment.findMany({
    include: {
      serviceType: true,
      rating: true,
    },
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

  return {
    statusCounts: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    serviceTypeCounts: Object.entries(serviceTypeCounts).map(([name, value]) => ({ name, value })),
    ratingCounts: Object.entries(ratingCounts).map(([name, value]) => ({ name, value })),
    totalAppointments: appointments.length,
  }
}

export default async function ReportsPage() {
  const stats = await getAppointmentStats()

  return <ReportsCharts {...stats} />
} 