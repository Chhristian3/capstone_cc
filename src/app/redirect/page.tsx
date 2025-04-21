import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { checkRole } from "@/lib/roles"

export default async function RedirectPage() {
  const { userId } = await auth()
  
  // If not authenticated, redirect to home
  if (!userId) {
    redirect("/")
  }

  // Check if user is admin
  const isAdmin = await checkRole("admin")
  
  // Redirect based on role
  if (isAdmin) {
    redirect("/admin")
  } else {
    redirect("/client/dashboard")
  }
} 