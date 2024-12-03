import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: {
        serviceType: true,
        rating: true,
      },
      orderBy: { appointmentDate: "asc" },
    })
    return NextResponse.json(appointments)
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching appointments" },
      { status: 500 }
    )
  }
}
