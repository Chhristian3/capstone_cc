import { NextRequest, NextResponse } from "next/server"
import { getAuth, clerkClient } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { User } from "@clerk/nextjs/server"

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = getAuth(req)

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const messageInstance = await prisma.messageInstance.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!messageInstance) {
      return NextResponse.json(
        { error: "Message instance not found" },
        { status: 404 }
      )
    }

    // Fetch sender information for all unique sender IDs
    const senderIds = new Set<string>()
    messageInstance.messages.forEach(message => {
      senderIds.add(message.senderId)
    })

    const client = await clerkClient()
    const response = await client.users.getUserList({
      userId: Array.from(senderIds),
    })

    const senderMap = new Map(response.data.map((user: User) => [user.id, user]))

    // Attach sender information to messages
    const messagesWithSenders = messageInstance.messages.map(message => ({
      ...message,
      sender: senderMap.get(message.senderId) || null,
    }))

    return NextResponse.json({
      ...messageInstance,
      messages: messagesWithSenders,
    })
  } catch (error) {
    console.error("Error fetching message instance:", error)
    return NextResponse.json(
      { error: "Error fetching message instance" },
      { status: 500 }
    )
  }
} 