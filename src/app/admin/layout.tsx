import { redirect } from "next/navigation"
import { checkRole } from "@/lib/roles"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Shell } from "@/components/ui/shell"
import AdminSidebar from "@/components/admin/sidebar"
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
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="sticky top-0 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 z-50">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <NotificationButton />
        </header>
        <main className="flex-1 overflow-y-auto">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
} 