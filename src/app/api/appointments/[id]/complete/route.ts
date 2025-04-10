import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        expirationDate: new Date(), // Set to current time to mark as completed
      },
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error completing appointment:", error)
    return NextResponse.json(
      { error: "Error completing appointment" },
      { status: 500 }
    )
  }
} 