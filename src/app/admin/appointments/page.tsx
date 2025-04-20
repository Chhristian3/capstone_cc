import { redirect } from "next/navigation"
import { checkRole } from "@/lib/roles"
import { AdminAppointmentList } from "@/components/admin/AdminAppointmentList"
import { Shell } from "@/components/ui/shell"

export default async function AppointmentsPage() {
  const isAdmin = await checkRole("admin")
  if (!isAdmin) {
    redirect("/")
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
          <p className="text-muted-foreground">
            Manage and view all appointments in the system.
          </p>
        </div>

        <AdminAppointmentList />
      </div>
    </Shell>
  )
} 