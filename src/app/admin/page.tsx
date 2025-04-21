import { redirect } from "next/navigation"
import { checkRole } from "@/lib/roles"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Package, Clock, TrendingUp, Star } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { clerkClient } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { Appointment } from "@prisma/client"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const prisma = new PrismaClient()

async function getDashboardData() {
  try {
    const [serviceTypes, appointments, usersResponse] = await Promise.all([
      prisma.serviceType.findMany({
        include: { appointments: true },
        orderBy: { name: "asc" },
      }).catch(() => []),
      prisma.appointment.findMany({
        include: {
          serviceType: true,
          rating: true,
        },
        orderBy: { appointmentDate: "desc" },
      }).catch(() => []),
      clerkClient().then(client => client.users.getUserList({ limit: 100 })).catch(() => ({ data: [] }))
    ])

    const recentAppointments = appointments?.slice(0, 5) || []
    const completedAppointments = appointments?.filter(a => a.status === "COMPLETED") || []
    const averageRating = completedAppointments.reduce((acc, curr) => {
      return acc + (curr.rating?.ratingValue ? 
        (curr.rating.ratingValue === "VerySatisfied" ? 5 :
         curr.rating.ratingValue === "Satisfied" ? 4 :
         curr.rating.ratingValue === "Neutral" ? 3 :
         curr.rating.ratingValue === "Dissatisfied" ? 2 : 1) : 0)
    }, 0) / (completedAppointments.length || 1)

    // Calculate sentiment statistics
    const sentimentStats = completedAppointments.reduce((acc, curr) => {
      if (curr.rating?.sentimentCategory) {
        acc[curr.rating.sentimentCategory] = (acc[curr.rating.sentimentCategory] || 0) + 1
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
    const averageSentimentScore = completedAppointments.reduce((acc, curr) => {
      return acc + (curr.rating?.sentimentScore || 0)
    }, 0) / (completedAppointments.length || 1)

    // Calculate overall sentiment status
    const positiveSentiments = (sentimentStats["VERY_POSITIVE"] || 0) + (sentimentStats["POSITIVE"] || 0)
    const negativeSentiments = (sentimentStats["VERY_NEGATIVE"] || 0) + (sentimentStats["NEGATIVE"] || 0)
    const neutralSentiments = sentimentStats["NEUTRAL"] || 0

    const sentimentStatus = totalSentiments > 0
      ? positiveSentiments / totalSentiments >= 0.7
        ? "EXCELLENT"
        : positiveSentiments / totalSentiments >= 0.5
          ? "GOOD"
          : negativeSentiments / totalSentiments >= 0.3
            ? "NEEDS_ATTENTION"
            : "NEUTRAL"
      : "NO_DATA"

    return {
      serviceTypes: serviceTypes || [],
      appointments: appointments || [],
      users: usersResponse?.data || [],
      recentAppointments,
      averageRating,
      completedAppointments,
      sentimentDistribution,
      averageSentimentScore,
      totalSentiments,
      sentimentStatus
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return {
      serviceTypes: [],
      appointments: [],
      users: [],
      recentAppointments: [],
      averageRating: 0,
      completedAppointments: [],
      sentimentDistribution: [],
      averageSentimentScore: 0,
      totalSentiments: 0,
      sentimentStatus: "NO_DATA"
    }
  }
}

export default async function AdminDashboard() {
  try {
    const isAdmin = await checkRole("admin")
    if (!isAdmin) {
      redirect("/client/dashboard")
    }

    const { serviceTypes, appointments, users, recentAppointments, averageRating, completedAppointments, sentimentDistribution, averageSentimentScore, totalSentiments, sentimentStatus } = await getDashboardData()

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome to your admin dashboard. Here you can manage appointments, service types, and users.
            </p>
          </div>
        </div>

        {(!serviceTypes.length && !appointments.length && !users.length) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Unable to fetch dashboard data. Please check your database connection and try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">
                {completedAppointments.length} completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Active users in the system
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Types</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceTypes.length}</div>
              <p className="text-xs text-muted-foreground">
                Active service types
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Based on {completedAppointments.length} reviews
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sentiment Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sentimentStatus === "EXCELLENT" ? (
                  <span className="text-green-600">Excellent</span>
                ) : sentimentStatus === "GOOD" ? (
                  <span className="text-green-500">Good</span>
                ) : sentimentStatus === "NEUTRAL" ? (
                  <span className="text-gray-500">Neutral</span>
                ) : sentimentStatus === "NEEDS_ATTENTION" ? (
                  <span className="text-yellow-500">Needs Attention</span>
                ) : (
                  <span className="text-gray-400">No Data</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {sentimentStatus === "EXCELLENT" ? "Over 70% positive sentiment" :
                 sentimentStatus === "GOOD" ? "Over 50% positive sentiment" :
                 sentimentStatus === "NEUTRAL" ? "Mixed sentiment distribution" :
                 sentimentStatus === "NEEDS_ATTENTION" ? "High negative sentiment detected" :
                 "No sentiment data available"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{format(new Date(appointment.appointmentDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{appointment.serviceType?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant={appointment.status === "COMPLETED" ? "default" : "secondary"}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Type Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Appointments</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceTypes.map((service) => {
                    const serviceAppointments = appointments.filter(a => a.serviceTypeId === service.id)
                    const completedServiceAppointments = serviceAppointments.filter(a => a.status === "COMPLETED")
                    const serviceRating = completedServiceAppointments.reduce((acc, curr) => {
                      return acc + (curr.rating?.ratingValue ? 
                        (curr.rating.ratingValue === "VerySatisfied" ? 5 :
                         curr.rating.ratingValue === "Satisfied" ? 4 :
                         curr.rating.ratingValue === "Neutral" ? 3 :
                         curr.rating.ratingValue === "Dissatisfied" ? 2 : 1) : 0)
                    }, 0) / (completedServiceAppointments.length || 1)

                    return (
                      <TableRow key={service.id}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{serviceAppointments.length}</TableCell>
                        <TableCell>
                          {completedServiceAppointments.length > 0 ? serviceRating.toFixed(1) : "N/A"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Average Sentiment Score</div>
                  <div className="text-2xl font-bold">
                    {averageSentimentScore.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2">
                  {sentimentDistribution.map(({ category, count, percentage }) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full" style={{
                          backgroundColor: 
                            category === "VERY_POSITIVE" ? "#22c55e" :
                            category === "POSITIVE" ? "#4ade80" :
                            category === "NEUTRAL" ? "#94a3b8" :
                            category === "NEGATIVE" ? "#f87171" :
                            "#ef4444"
                        }} />
                        <span className="text-sm capitalize">
                          {category.toLowerCase().replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Based on {totalSentiments} analyzed reviews
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in AdminDashboard:", error)
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            An unexpected error occurred. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}
