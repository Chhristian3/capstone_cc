import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const dateParam = url.searchParams.get('date')
    
    if (!dateParam) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      )
    }

    const date = new Date(dateParam)
    
    // Set time to start and end of the day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Get all appointments for the specified date
    const appointments = await prisma.appointment.findMany({
      where: {
        AND: [
          {
            appointmentDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          {
            status: {
              not: "CANCELLED",
            },
          },
        ],
      },
      orderBy: {
        appointmentDate: "asc",
      },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments for date:", error)
    return NextResponse.json(
      { error: "Error fetching appointments for date" },
      { status: 500 }
    )
  }
} 