import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

const Event = mongoose.models.Event || require("@/model/model").Event;
const Ticket = mongoose.models.Ticket || require("@/model/model").Ticket;
const Organizer =
  mongoose.models.Organizer || require("@/model/model").Organizer;
const MasterAccount =
  mongoose.models.MasterAccount || require("@/model/model").MasterAccount;

/**
 * @route GET /api/organizer/scanner/stats?eventId={eventId}
 * @description Get ticket scan statistics for a specific event
 * @query {number} eventId - Event ID to get stats for
 * @returns Event scan statistics including total tickets, validations, and rates
 */
export async function GET(request) {
  try {
    await dbConnect();

    // Get session and verify organizer
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organizer
    const masterAccount = await MasterAccount.findOne({
      email: session.user.email,
    });

    if (!masterAccount) {
      return NextResponse.json(
        { success: false, message: "Master account not found" },
        { status: 404 }
      );
    }

    const organizer = await Organizer.findOne({
      account_id: masterAccount.account_id,
    });

    if (!organizer || organizer.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          message: "Organizer not found or not approved",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const eventId = parseInt(searchParams.get("eventId"));

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Verify event belongs to organizer
    const event = await Event.findOne({
      event_id: eventId,
      organizer_id: organizer.organizer_id,
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found or access denied" },
        { status: 404 }
      );
    }

    // Get ticket statistics
    const totalTickets = await Ticket.countDocuments({ event_id: eventId });

    const validatedTickets = await Ticket.countDocuments({
      event_id: eventId,
      is_validated: true,
    });

    // Get today's validations (from midnight to now)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayValidations = await Ticket.countDocuments({
      event_id: eventId,
      is_validated: true,
      validation_time: { $gte: today },
    });

    // Calculate validation rate
    const validationRate =
      totalTickets > 0
        ? Math.round((validatedTickets / totalTickets) * 100)
        : 0;

    // Get pending tickets
    const pendingTickets = totalTickets - validatedTickets;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalTickets,
          validatedTickets,
          pendingTickets,
          todayValidations,
          validationRate,
        },
        event: {
          event_id: event.event_id,
          title: event.title,
          start_date: event.start_date,
          venue_name: event.venue_name,
          status: event.status,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching scan stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch scan statistics",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
