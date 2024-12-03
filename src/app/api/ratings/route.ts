import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (id) {
    try {
      const rating = await prisma.rating.findUnique({
        where: { id },
        include: { appointment: true },
      })
      if (!rating) {
        return NextResponse.json({ error: "Rating not found" }, { status: 404 })
      }
      return NextResponse.json(rating)
    } catch (error) {
      return NextResponse.json(
        { error: "Error fetching rating" },
        { status: 500 }
      )
    }
  } else {
    try {
      const ratings = await prisma.rating.findMany({
        include: { appointment: true },
      })
      return NextResponse.json(ratings)
    } catch (error) {
      return NextResponse.json(
        { error: "Error fetching ratings" },
        { status: 500 }
      )
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rating = await prisma.rating.create({
      data: {
        appointmentId: body.appointmentId,
        ratingValue: body.ratingValue,
        comment: body.comment,
      },
    })
    return NextResponse.json(rating, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating rating" },
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
        { error: "Rating ID is required" },
        { status: 400 }
      )
    }

    const updatedRating = await prisma.rating.update({
      where: { id },
      data: {
        ratingValue: body.ratingValue,
        comment: body.comment,
      },
    })

    return NextResponse.json(updatedRating)
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating rating" },
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
        { error: "Rating ID is required" },
        { status: 400 }
      )
    }

    await prisma.rating.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Rating deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting rating" },
      { status: 500 }
    )
  }
}
