import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { checkRole } from "@/lib/roles"

export async function POST(req: NextRequest) {
  // Check if the user is an admin
  if (!(await checkRole("admin"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user's role based on the action
    const updatedUser = await client.users.updateUser(userId, {
      publicMetadata: {
        role: action === "makeAdmin" ? "admin" : null,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    )
  }
} 