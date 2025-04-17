import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Helper function to create notifications
async function createAppointmentNotification(
  appointmentId: string,
  userId: string,
  status: string,
  customerName: string
) {
  // Create notification for the client
  await prisma.notification.create({
    data: {
      userId,
      recipientType: "SPECIFIC_USER",
      type: "APPOINTMENT",
      title: "Appointment Status Updated",
      content: `Your appointment has been updated to ${status}`,
      referenceId: appointmentId,
    },
  })

  // Create notification for admins
  await prisma.notification.create({
    data: {
      recipientType: "ADMIN_ONLY",
      type: "APPOINTMENT",
      title: "Appointment Status Updated",
      content: `Appointment for ${customerName} has been updated to ${status}`,
      referenceId: appointmentId,
    },
  })
}

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req)

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const newAppointmentStart = new Date(body.appointmentDate)
    const newAppointmentEnd = new Date(body.appointmentEndDate)
    const currentDate = new Date()
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)

    // Validate appointment date is not in the past
    if (newAppointmentStart < currentDate) {
      return NextResponse.json(
        { error: "Cannot create appointments in the past" },
        { status: 400 }
      )
    }

    // Validate appointment date is not more than 30 days in the future
    if (newAppointmentStart > maxDate) {
      return NextResponse.json(
        { error: "Cannot create appointments more than 30 days in advance" },
        { status: 400 }
      )
    }

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
        rating: true,
      },
    })

    // Create notification for admins about the new appointment
    await prisma.notification.create({
      data: {
        recipientType: "ADMIN_ONLY",
        type: "APPOINTMENT",
        title: "New Appointment Created",
        content: `New appointment created for ${body.customerName} on ${newAppointmentStart.toLocaleDateString()}`,
        referenceId: appointment.id,
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

    // Get the current appointment to check if status is changing
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
    })

    if (!currentAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      )
    }

    const updateData: any = {
      customerName: body.customerName,
      appointmentDate: new Date(body.appointmentDate),
      expirationDate: new Date(body.expirationDate),
      status: body.status,
      ...(body.status === "CANCELLED" && { cancellationReason: body.cancellationReason }),
      serviceType: {
        connect: { id: body.serviceTypeId },
      },
    }

    // Add remarks if provided
    if (body.adminRemarks !== undefined) {
      updateData.adminRemarks = body.adminRemarks
    }
    if (body.userRemarks !== undefined) {
      updateData.userRemarks = body.userRemarks
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        serviceType: true,
        rating: true,
      },
    })

    // Create notifications if status has changed
    if (currentAppointment.status !== body.status) {
      await createAppointmentNotification(
        id,
        currentAppointment.userId,
        body.status,
        currentAppointment.customerName
      )
    }

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
