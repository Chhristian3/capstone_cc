"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  BarChart,
  MessageSquare,
} from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Appointments",
    href: "/admin/appointments",
    icon: Calendar,
  },
  {
    name: "Service Types",
    href: "/admin/service-types",
    icon: Package,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Messages",
    href: "/admin/messages",
    icon: MessageSquare,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: BarChart,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row justify-between gap-5 border-b border-sidebar-border py-3">
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <span className="text-lg">{user?.fullName}</span>
        </div>
        <ModeToggle />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.name}>
                <Link href={item.href} className="w-full">
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.name}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
} 