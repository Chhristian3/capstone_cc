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

    return {
      serviceTypes: serviceTypes || [],
      appointments: appointments || [],
      users: usersResponse?.data || [],
      recentAppointments,
      averageRating,
      completedAppointments,
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
    }
  }
}

export default async function AdminDashboard() {
  try {
    const isAdmin = await checkRole("admin")
    if (!isAdmin) {
      redirect("/")
    }

    const { serviceTypes, appointments, users, recentAppointments, averageRating, completedAppointments } = await getDashboardData()

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome to your admin dashboard. Here you can manage appointments, service types, and users.
            </p>
          </div>
          <ModeToggle />
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
