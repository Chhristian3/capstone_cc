import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    const where: { isRead: boolean; userId?: string } = { isRead: false }
    if (userId) where.userId = userId

    await prisma.notification.updateMany({
      where,
      data: { isRead: true },
    })

    return NextResponse.json({ message: "All notifications marked as read" })
  } catch (error) {
    console.error("Error in PUT /api/notifications/mark-all-read:", error)
    return NextResponse.json(
      { error: "Error marking notifications as read" },
      { status: 500 }
    )
  }
} 