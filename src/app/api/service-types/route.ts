import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (id) {
    try {
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
    } catch (error) {
      return NextResponse.json(
        { error: "Error fetching service type" },
        { status: 500 }
      )
    }
  } else {
    try {
      const serviceTypes = await prisma.serviceType.findMany({
        include: { appointments: true },
      })
      return NextResponse.json(serviceTypes)
    } catch (error) {
      return NextResponse.json(
        { error: "Error fetching service types" },
        { status: 500 }
      )
    }
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
