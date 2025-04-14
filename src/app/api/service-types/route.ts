import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface ServiceType {
  id: string
  name: string
  description: string
  appointments: any[] // You might want to type this more specifically
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (id) {
      const serviceType = await prisma.serviceType.findUnique({
        where: { id },
        include: { appointments: true },
      })

      if (!serviceType) {
        return NextResponse.json(
          { error: "Service type not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(serviceType)
    }

    const serviceTypes = await prisma.serviceType.findMany({
      include: { 
        appointments: {
          include: {
            rating: true
          }
        }
      },
      orderBy: { name: "asc" },
    })

    // Calculate average rating for each service type
    const serviceTypesWithRatings = serviceTypes.map(serviceType => {
      const completedAppointments = serviceType.appointments.filter(a => a.status === "COMPLETED")
      const totalRating = completedAppointments.reduce((acc, curr) => {
        if (!curr.rating) return acc
        return acc + (curr.rating.ratingValue === "VerySatisfied" ? 5 :
                     curr.rating.ratingValue === "Satisfied" ? 4 :
                     curr.rating.ratingValue === "Neutral" ? 3 :
                     curr.rating.ratingValue === "Dissatisfied" ? 2 : 1)
      }, 0)
      
      const averageRating = completedAppointments.length > 0 
        ? totalRating / completedAppointments.length 
        : 0

      return {
        ...serviceType,
        averageRating,
        totalAppointments: serviceType.appointments.length,
        completedAppointments: completedAppointments.length
      }
    })

    return NextResponse.json(serviceTypesWithRatings)
  } catch (error) {
    console.error("Error in GET /api/service-types:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const serviceType = await prisma.serviceType.create({
      data: {
        name: body.name,
        description: body.description,
      },
    })
    return NextResponse.json(serviceType, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating service type" },
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
        { error: "Service type ID is required" },
        { status: 400 }
      )
    }

    const updatedServiceType = await prisma.serviceType.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
      },
    })

    return NextResponse.json(updatedServiceType)
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating service type" },
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
        { error: "Service type ID is required" },
        { status: 400 }
      )
    }

    await prisma.serviceType.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Service type deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting service type" },
      { status: 500 }
    )
  }
}
