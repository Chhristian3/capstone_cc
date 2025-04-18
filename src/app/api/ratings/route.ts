import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import vader from "vader-sentiment"

const prisma = new PrismaClient()

// Map rating values to numerical scores
const RATING_SCORES = {
  VeryDissatisfied: -1.0,
  Dissatisfied: -0.5,
  Neutral: 0.0,
  Satisfied: 0.5,
  VerySatisfied: 1.0,
} as const

function analyzeSentiment(text: string | null, ratingValue: keyof typeof RATING_SCORES) {
  // Get base sentiment from rating value
  const ratingScore = RATING_SCORES[ratingValue]
  
  // If no comment, return sentiment based on rating only
  if (!text) {
    return {
      score: ratingScore,
      category: getSentimentCategory(ratingScore)
    }
  }

  // Get VADER sentiment analysis
  const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(text)
  
  // VADER provides a compound score between -1 and 1
  const textScore = sentiment.compound

  // Combine scores with weights (60% rating, 40% text)
  const combinedScore = (ratingScore * 0.6) + (textScore * 0.4)

  return {
    score: combinedScore,
    category: getSentimentCategory(combinedScore)
  }
}

function getSentimentCategory(score: number): "VERY_NEGATIVE" | "NEGATIVE" | "NEUTRAL" | "POSITIVE" | "VERY_POSITIVE" {
  if (score <= -0.6) {
    return "VERY_NEGATIVE"
  } else if (score <= -0.2) {
    return "NEGATIVE"
  } else if (score <= 0.2) {
    return "NEUTRAL"
  } else if (score <= 0.6) {
    return "POSITIVE"
  } else {
    return "VERY_POSITIVE"
  }
}

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
    
    // Always analyze sentiment using both rating and comment
    const sentimentData = analyzeSentiment(body.comment, body.ratingValue)

    const rating = await prisma.rating.create({
      data: {
        appointmentId: body.appointmentId,
        ratingValue: body.ratingValue,
        comment: body.comment,
        sentimentCategory: sentimentData.category,
        sentimentScore: sentimentData.score,
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

    // Always analyze sentiment using both rating and comment
    const sentimentData = analyzeSentiment(body.comment, body.ratingValue)

    const updatedRating = await prisma.rating.update({
      where: { id },
      data: {
        ratingValue: body.ratingValue,
        comment: body.comment,
        sentimentCategory: sentimentData.category,
        sentimentScore: sentimentData.score,
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
