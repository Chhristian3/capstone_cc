import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

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

    return NextResponse.json(messageInstance)
  } catch (error) {
    console.error("Error fetching message instance:", error)
    return NextResponse.json(
      { error: "Error fetching message instance" },
      { status: 500 }
    )
  }
} 