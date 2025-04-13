import { redirect } from "next/navigation"
import { checkRole } from "@/lib/roles"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Package } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { clerkClient } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { Appointment } from "@prisma/client"

const prisma = new PrismaClient()

async function getDashboardData() {
  const [serviceTypes, appointments, usersResponse] = await Promise.all([
    prisma.serviceType.findMany({
      include: { appointments: true },
      orderBy: { name: "asc" },
    }),
    prisma.appointment.findMany({
      include: {
        serviceType: true,
        rating: true,
      },
      orderBy: { appointmentDate: "desc" },
    }),
    clerkClient().then(client => client.users.getUserList({ limit: 100 }))
  ])

  return {
    serviceTypes,
    appointments,
    users: usersResponse.data,
  }
}

export default async function AdminDashboard() {
  const isAdmin = await checkRole("admin")
  if (!isAdmin) {
    redirect("/")
  }

  const { serviceTypes, appointments, users } = await getDashboardData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your admin dashboard. Here you can manage appointments, service types, and users.
          </p>
        </div>
        <ModeToggle />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {appointments.filter((a: Appointment) => a.status === "COMPLETED").length} completed
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
      </div>
    </div>
  )
}
