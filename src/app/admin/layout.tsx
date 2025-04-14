import { redirect } from "next/navigation"
import { checkRole } from "@/lib/roles"
import Sidebar from "@/components/admin/sidebar"
import { NotificationButton } from "@/components/buttons/notification-button"
import { AdminBreadcrumb } from "@/components/admin/breadcrumb"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAdmin = await checkRole("admin")
  if (!isAdmin) {
    redirect("/")
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 z-50">
          <AdminBreadcrumb />
          <NotificationButton />
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 