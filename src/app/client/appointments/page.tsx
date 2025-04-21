import { Suspense } from "react"
import { AppointmentProvider } from "@/contexts/AppointmentContext"
import { ChatBubble } from "@/components/messages/chat-bubble"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "@/components/app-sidebar"
import { AppointmentList } from "@/components/appointment-list"
import { NotificationButton } from "@/components/buttons/notification-button"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 z-50">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Appointments</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <NotificationButton />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Suspense fallback={<AppointmentListSkeleton />}>
            <AppointmentList />
          </Suspense>
        </div>
        <ChatBubble />
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppointmentListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  )
} 