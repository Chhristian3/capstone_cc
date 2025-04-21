import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"
import { checkRole } from "@/lib/roles"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const limit = searchParams.get("limit")

    // Get the current user's ID from the auth token
    const { userId: currentUserId } = await auth()
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (id) {
      const announcement = await prisma.notification.findUnique({
        where: { 
          id,
          type: "CLIENT_ANNOUNCEMENT",
          recipientType: "CLIENT_ONLY"
        },
      })

      if (!announcement) {
        return NextResponse.json(
          { error: "Announcement not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(announcement)
    }

    // Get all client announcements with optional limit
    const announcements = await prisma.notification.findMany({
      where: {
        type: "CLIENT_ANNOUNCEMENT",
        recipientType: "CLIENT_ONLY"
      },
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit) : undefined,
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error("Error in GET /api/announcements:", error)
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
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const announcement = await prisma.notification.create({
      data: {
        title: body.title,
        content: body.content,
        type: "CLIENT_ANNOUNCEMENT",
        recipientType: "CLIENT_ONLY",
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/announcements:", error)
    return NextResponse.json(
      { error: "Error creating announcement" },
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
        { error: "Announcement ID is required" },
        { status: 400 }
      )
    }

    const updatedAnnouncement = await prisma.notification.update({
      where: { 
        id,
        type: "CLIENT_ANNOUNCEMENT",
        recipientType: "CLIENT_ONLY"
      },
      data: {
        title: body.title,
        content: body.content,
      },
    })

    return NextResponse.json(updatedAnnouncement)
  } catch (error) {
    console.error("Error in PUT /api/announcements:", error)
    return NextResponse.json(
      { error: "Error updating announcement" },
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
        { error: "Announcement ID is required" },
        { status: 400 }
      )
    }

    await prisma.notification.delete({
      where: { 
        id,
        type: "CLIENT_ANNOUNCEMENT",
        recipientType: "CLIENT_ONLY"
      },
    })

    return NextResponse.json({ message: "Announcement deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/announcements:", error)
    return NextResponse.json(
      { error: "Error deleting announcement" },
      { status: 500 }
    )
  }
} 