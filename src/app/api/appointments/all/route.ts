import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        serviceType: true,
        rating: true,
      },
    })
    return NextResponse.json(appointments)
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching appointments" },
      { status: 500 }
    )
  }
}
