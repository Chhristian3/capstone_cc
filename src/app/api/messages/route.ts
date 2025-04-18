import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req)

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { messageInstanceId, content } = body

    // Verify the message instance exists
    const messageInstance = await prisma.messageInstance.findUnique({
      where: { id: messageInstanceId },
    })

    if (!messageInstance) {
      return NextResponse.json(
        { error: "Message instance not found" },
        { status: 404 }
      )
    }

    const message = await prisma.message.create({
      data: {
        messageInstanceId,
        senderId: userId,
        content,
      },
    })

    // Update the message instance's updatedAt timestamp
    await prisma.messageInstance.update({
      where: { id: messageInstanceId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json(
      { error: "Error creating message" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req)

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const messageInstanceId = searchParams.get("messageInstanceId")

    if (!messageInstanceId) {
      return NextResponse.json(
        { error: "Message instance ID is required" },
        { status: 400 }
      )
    }

    const messages = await prisma.message.findMany({
      where: { messageInstanceId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Error fetching messages" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const { userId } = getAuth(req)

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      )
    }

    // Mark message as read
    const message = await prisma.message.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error updating message:", error)
    return NextResponse.json(
      { error: "Error updating message" },
      { status: 500 }
    )
  }
} 