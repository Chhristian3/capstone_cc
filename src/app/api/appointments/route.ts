import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (id) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          serviceType: true,
          rating: true,
        },
      })
      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        )
      }
      return NextResponse.json(appointment)
    } catch (error) {
      return NextResponse.json(
        { error: "Error fetching appointment" },
        { status: 500 }
      )
    }
  } else {
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
}

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req)

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const appointment = await prisma.appointment.create({
      data: {
        userId,
        title: body.title,
        customerName: body.customerName,
        appointmentDate: new Date(body.appointmentDate),
        expirationDate: new Date(body.expirationDate),
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
    return NextResponse.json({ error: error }, { status: 500 })
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
