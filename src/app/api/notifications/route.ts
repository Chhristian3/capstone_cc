import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"
import { checkRole } from "@/lib/roles"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")
    const recipientType = searchParams.get("recipientType")
    const isRead = searchParams.get("isRead")

    // Get the current user's ID from the auth token
    const { userId: currentUserId } = await auth()
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (id) {
      const notification = await prisma.notification.findUnique({
        where: { id },
      })

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        )
      }

      // Check if user has access to this notification
      const isAdmin = await checkRole("admin")
      if (!isAdmin && notification.recipientType !== "ALL_USERS") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      return NextResponse.json(notification)
    }

    // Build the where clause based on query parameters and user role
    const where: any = {}
    const isAdmin = await checkRole("admin")

    if (!isAdmin) {
      // For non-admin users, they can only see:
      // 1. Notifications specifically for them
      // 2. Notifications for ALL users
      where.OR = [
        { userId: currentUserId },
        { recipientType: "ALL_USERS"},
        { recipientType: "CLIENT_ONLY"}
      ]
    } else {
      // Admins can only see ADMIN_ONLY and ALL_USERS notifications
      where.OR = [
        { recipientType: "ADMIN_ONLY" },
        { recipientType: "ALL_USERS" }
      ]
    }

    if (isRead !== null) where.isRead = isRead === "true"

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error in GET /api/notifications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.type || !body.title || !body.content || !body.recipientType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate recipientType
    if (body.recipientType === "SPECIFIC_USER" && !body.userId) {
      return NextResponse.json(
        { error: "userId is required for SPECIFIC_USER recipient type" },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        userId: body.userId,
        recipientType: body.recipientType,
        type: body.type,
        title: body.title,
        content: body.content,
        referenceId: body.referenceId,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/notifications:", error)
    return NextResponse.json(
      { error: "Error creating notification" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const body = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      )
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        userId: body.userId,
        recipientType: body.recipientType,
        type: body.type,
        title: body.title,
        content: body.content,
        referenceId: body.referenceId,
        isRead: body.isRead,
      },
    })

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error("Error in PUT /api/notifications:", error)
    return NextResponse.json(
      { error: "Error updating notification" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      )
    }

    await prisma.notification.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Notification deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/notifications:", error)
    return NextResponse.json(
      { error: "Error deleting notification" },
      { status: 500 }
    )
  }
} 