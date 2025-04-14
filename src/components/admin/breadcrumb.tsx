"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"

function getPageTitle(pathname: string): string {
  if (!pathname) return 'Dashboard'
  const path = pathname.split('/').pop() || ''
  switch (path) {
    case 'dashboard':
      return 'Dashboard'
    case 'appointments':
      return 'Appointments'
    case 'users':
      return 'Users'
    case 'service-types':
      return 'Service Types'
    default:
      return 'Dashboard'
  }
}

export function AdminBreadcrumb() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <div className="flex items-center gap-2">
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
} 