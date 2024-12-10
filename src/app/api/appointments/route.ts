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
    const newAppointmentStart = new Date(body.appointmentDate)
    const newAppointmentEnd = new Date(body.appointmentEndDate)

    // Check for conflicting appointments
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        AND: [
          {
            OR: [
              {
                appointmentDate: {
                  lte: newAppointmentEnd,
                },
                appointmentEndDate: {
                  gte: newAppointmentStart,
                },
              },
              {
                appointmentDate: {
                  gte: newAppointmentStart,
                  lte: newAppointmentEnd,
                },
              },
              {
                appointmentEndDate: {
                  gte: newAppointmentStart,
                  lte: newAppointmentEnd,
                },
              },
            ],
          },
          {
            NOT: {
              id: body.id, // Exclude the current appointment if it's an update
            },
          },
        ],
      },
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: "This time slot conflicts with an existing appointment" },
        { status: 409 }
      )
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        title: body.title,
        customerName: body.customerName,
        appointmentDate: newAppointmentStart,
        appointmentEndDate: newAppointmentEnd,
        expirationDate: new Date(newAppointmentEnd.getTime() + 60 * 60 * 1000),
        description: body.description,
        serviceType: {
          connect: { id: body.serviceTypeId },
        },
      },
      include: {
        serviceType: true,
      },
    })
    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json(
      { error: "Error creating appointment" },
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
    const appointments = await prisma.appointment.findMany({
      include: {
        serviceType: true,
        rating: true,
      },
      orderBy: { appointmentDate: "desc" },
    })
    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      { error: "Error fetching appointments" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const body = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      )
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        customerName: body.customerName,
        appointmentDate: new Date(body.appointmentDate),
        expirationDate: new Date(body.expirationDate),
        serviceType: {
          connect: { id: body.serviceTypeId },
        },
      },
      include: {
        serviceType: true,
        rating: true,
      },
    })

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating appointment" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      )
    }

    await prisma.appointment.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Appointment deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting appointment" },
      { status: 500 }
    )
  }
}
