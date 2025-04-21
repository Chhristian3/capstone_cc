import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DateStatus } from "@prisma/client";

// GET all selected dates
export async function GET() {
  try {
    const selectedDates = await prisma.selectedDate.findMany({
      orderBy: {
        date: 'asc'
      }
    });
    return NextResponse.json(selectedDates);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch selected dates" },
      { status: 500 }
    );
  }
}

// POST new selected date
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, status, startTime, endTime, reason } = body;

    // Validate required fields
    if (!date || !status) {
      return NextResponse.json(
        { error: "Date and status are required" },
        { status: 400 }
      );
    }

    // Convert string dates to Date objects
    const parsedDate = new Date(date);
    const parsedStartTime = startTime ? new Date(startTime) : null;
    const parsedEndTime = endTime ? new Date(endTime) : null;

    const selectedDate = await prisma.selectedDate.create({
      data: {
        date: parsedDate,
        status,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        reason
      }
    });

    return NextResponse.json(selectedDate);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create selected date" },
      { status: 500 }
    );
  }
}

// PUT update selected date
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, date, status, startTime, endTime, reason } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required for update" },
        { status: 400 }
      );
    }

    // Convert string dates to Date objects
    const parsedDate = date ? new Date(date) : undefined;
    const parsedStartTime = startTime ? new Date(startTime) : null;
    const parsedEndTime = endTime ? new Date(endTime) : null;

    const updatedDate = await prisma.selectedDate.update({
      where: { id },
      data: {
        date: parsedDate,
        status,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        reason
      }
    });

    return NextResponse.json(updatedDate);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update selected date" },
      { status: 500 }
    );
  }
}

// DELETE selected date
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "ID is required for deletion" },
        { status: 400 }
      );
    }

    await prisma.selectedDate.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Selected date deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete selected date" },
      { status: 500 }
    );
  }
}
