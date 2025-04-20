import { NextRequest, NextResponse } from "next/server"
import { getAuth, clerkClient } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { User } from "@clerk/nextjs/server"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req)

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { clientId } = body

    // Check if a message instance already exists for this client
    const existingInstance = await prisma.messageInstance.findUnique({
      where: { clientId },
    })

    if (existingInstance) {
      return NextResponse.json(
        { error: "Message instance already exists for this client" },
        { status: 409 }
      )
    }

    const messageInstance = await prisma.messageInstance.create({
      data: {
        clientId,
      },
    })

    return NextResponse.json(messageInstance, { status: 201 })
  } catch (error) {
    console.error("Error creating message instance:", error)
    return NextResponse.json(
      { error: "Error creating message instance" },
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
    const messageInstances = await prisma.messageInstance.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    // Fetch client information for all unique client IDs
    const clientIds = new Set<string>()
    messageInstances.forEach(instance => {
      clientIds.add(instance.clientId)
    })

    const client = await clerkClient()
    const response = await client.users.getUserList({
      userId: Array.from(clientIds),
    })

    const clientMap = new Map(response.data.map((user: User) => [user.id, user]))

    // Attach client information to instances
    const instancesWithClients = messageInstances.map(instance => ({
      ...instance,
      client: clientMap.get(instance.clientId) || null,
    }))

    return NextResponse.json(instancesWithClients)
  } catch (error) {
    console.error("Error fetching message instances:", error)
    return NextResponse.json(
      { error: "Error fetching message instances" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req)

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Message instance ID is required" },
        { status: 400 }
      )
    }

    await prisma.messageInstance.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Message instance deleted successfully" })
  } catch (error) {
    console.error("Error deleting message instance:", error)
    return NextResponse.json(
      { error: "Error deleting message instance" },
      { status: 500 }
    )
  }
} 