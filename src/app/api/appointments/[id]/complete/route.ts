import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface CompleteAppointmentRequest {
  adminRemarks?: string
  userRemarks?: string
}

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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as CompleteAppointmentRequest
    const { adminRemarks, userRemarks } = body

    // Get the current appointment
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id: params.id },
    })

    if (!currentAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      )
    }

    // Check if appointment date is in the future
    const appointmentDate = new Date(currentAppointment.appointmentDate)
    const currentDate = new Date()
    
    if (appointmentDate > currentDate) {
      return NextResponse.json(
        { error: "Cannot complete an appointment that is scheduled for a future date" },
        { status: 400 }
      )
    }

    const updateData: any = {
      status: "COMPLETED",
    }

    if (adminRemarks !== undefined) {
      updateData.adminRemarks = adminRemarks
    }

    if (userRemarks !== undefined) {
      updateData.userRemarks = userRemarks
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
    })

    // Create notifications for the status change
    await createAppointmentNotification(
      params.id,
      currentAppointment.userId,
      "COMPLETED",
      currentAppointment.customerName
    )

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error completing appointment:", error)
    return NextResponse.json(
      { error: "Error completing appointment" },
      { status: 500 }
    )
  }
} 