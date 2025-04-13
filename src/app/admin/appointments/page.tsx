import { redirect } from "next/navigation"
import { checkRole } from "@/lib/roles"
import { AdminAppointmentList } from "@/components/admin/AdminAppointmentList"

export default async function AppointmentsPage() {
  const isAdmin = await checkRole("admin")
  if (!isAdmin) {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
        <p className="text-muted-foreground">
          Manage and view all appointments in the system.
        </p>
      </div>

      <AdminAppointmentList />
    </div>
  )
} 