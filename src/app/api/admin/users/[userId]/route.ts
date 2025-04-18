import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { checkRole } from "@/lib/roles"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Check if the user is an admin
  if (!(await checkRole("admin"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user details from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(params.userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's appointments with service types and ratings
    const appointments = await prisma.appointment.findMany({
      where: { userId: params.userId },
      include: {
        serviceType: true,
        rating: true,
      },
      orderBy: { appointmentDate: "desc" },
    })

    // Calculate most used service type
    const serviceTypeCounts = appointments.reduce((acc, appointment) => {
      const serviceTypeId = appointment.serviceTypeId
      acc[serviceTypeId] = (acc[serviceTypeId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostUsedServiceTypeId = Object.entries(serviceTypeCounts).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ["", 0]
    )[0]

    const mostUsedServiceType = mostUsedServiceTypeId
      ? await prisma.serviceType.findUnique({
          where: { id: mostUsedServiceTypeId },
        })
      : null

    // Calculate average rating
    const completedAppointments = appointments.filter(
      (a) => a.status === "COMPLETED" && a.rating
    )
    const totalRating = completedAppointments.reduce((acc, curr) => {
      if (!curr.rating) return acc
      return (
        acc +
        (curr.rating.ratingValue === "VerySatisfied"
          ? 5
          : curr.rating.ratingValue === "Satisfied"
          ? 4
          : curr.rating.ratingValue === "Neutral"
          ? 3
          : curr.rating.ratingValue === "Dissatisfied"
          ? 2
          : 1)
      )
    }, 0)

    const averageRating =
      completedAppointments.length > 0
        ? totalRating / completedAppointments.length
        : 0

    return NextResponse.json({
      user,
      appointments,
      mostUsedServiceType,
      averageRating,
      totalAppointments: appointments.length,
      completedAppointments: completedAppointments.length,
    })
  } catch (error) {
    console.error("Error fetching user details:", error)
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    )
  }
} 