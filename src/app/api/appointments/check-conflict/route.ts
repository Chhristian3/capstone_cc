import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { startTime, endTime } = body

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Start time and end time are required" },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    // Check for overlapping appointments
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        OR: [
          // Case 1: New appointment starts during an existing appointment
          {
            appointmentDate: {
              lte: start,
            },
            appointmentEndDate: {
              gt: start,
            },
          },
          // Case 2: New appointment ends during an existing appointment
          {
            appointmentDate: {
              lt: end,
            },
            appointmentEndDate: {
              gte: end,
            },
          },
          // Case 3: New appointment completely contains an existing appointment
          {
            appointmentDate: {
              gte: start,
            },
            appointmentEndDate: {
              lte: end,
            },
          },
        ],
        status: {
          not: "CANCELLED",
        },
      },
    })

    return NextResponse.json({
      hasConflict: conflictingAppointments.length > 0,
      conflictingAppointments: conflictingAppointments.map((app) => ({
        id: app.id,
        start: app.appointmentDate,
        end: app.appointmentEndDate,
      })),
    })
  } catch (error) {
    console.error("Error checking time conflict:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred while checking time conflict" },
      { status: 500 }
    )
  }
} 