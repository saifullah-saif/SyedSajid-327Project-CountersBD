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
 * @route GET /api/organizer/scanner/validations?eventId={eventId}&limit={limit}
 * @description Get validation history for a specific event
 * @query {number} eventId - Event ID to get validation history for
 * @query {number} limit - Maximum number of results (default: 10)
 * @returns List of validated tickets with attendee information
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
    const limit = parseInt(searchParams.get("limit") || "10");

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

    // Get validated tickets sorted by validation time (most recent first)
    const validatedTickets = await Ticket.find({
      event_id: eventId,
      is_validated: true,
    })
      .sort({ validation_time: -1 })
      .limit(limit)
      .lean();

    // Enhance tickets with ticket type information from event
    const enhancedTickets = validatedTickets.map((ticket) => {
      // Find the ticket type from event categories
      let ticketTypeName = "Standard Ticket";

      for (const category of event.categories || []) {
        const ticketType = category.ticket_types?.find(
          (tt) => tt.ticket_type_id === ticket.ticket_type_id
        );
        if (ticketType) {
          ticketTypeName = ticketType.name;
          break;
        }
      }

      return {
        ticket_id: ticket.ticket_id,
        qr_code: ticket.qr_code,
        attendee_name: ticket.attendee_name,
        attendee_email: ticket.attendee_email,
        attendee_phone: ticket.attendee_phone,
        validation_time: ticket.validation_time,
        is_validated: ticket.is_validated,
        tickettypes: {
          name: ticketTypeName,
          events: {
            event_id: event.event_id,
            title: event.title,
            start_date: event.start_date,
            venue_name: event.venue_name,
          },
        },
      };
    });

    return NextResponse.json({
      success: true,
      count: enhancedTickets.length,
      data: {
        validations: enhancedTickets,
        event: {
          event_id: event.event_id,
          title: event.title,
          start_date: event.start_date,
          venue_name: event.venue_name,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching validation history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch validation history",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
