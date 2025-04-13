import { redirect } from "next/navigation"
import { checkRole } from "@/lib/roles"
import Sidebar from "@/components/admin/sidebar"

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
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
} 