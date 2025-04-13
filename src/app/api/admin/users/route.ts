import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { checkRole } from "@/lib/roles"

export async function GET(req: NextRequest) {
  // Check if the user is an admin
  if (!(await checkRole("admin"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const searchQuery = searchParams.get("search") || ""

    // Get all users from Clerk
    const client = await clerkClient()
    const response = await client.users.getUserList({
      limit: 100,
      query: searchQuery,
    })

    // Return the data array from the paginated response
    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
} 