import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")
    const recipientType = searchParams.get("recipientType")
    const isRead = searchParams.get("isRead")

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

      return NextResponse.json(notification)
    }

    // Build the where clause based on query parameters
    const where: any = {}
    if (userId) where.userId = userId
    if (recipientType) where.recipientType = recipientType
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