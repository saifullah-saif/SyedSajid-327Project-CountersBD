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
 * @route GET /api/organizer/scanner/ticket?passId={passId}
 * @description Get ticket details by Pass ID for scanner page
 * @query {string} passId - Pass ID to lookup
 * @returns Ticket with nested event and ticket type information
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
    const passId = searchParams.get("passId");

    if (!passId) {
      return NextResponse.json(
        { success: false, message: "Pass ID is required" },
        { status: 400 }
      );
    }

    // Find ticket by pass ID
    const ticket = await Ticket.findOne({ pass_id: passId }).lean();

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Get event details
    const event = await Event.findOne({ event_id: ticket.event_id }).lean();

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Find ticket type information
    let ticketTypeInfo = null;
    let ticketPrice = 0;

    for (const category of event.categories || []) {
      const ticketType = category.ticket_types?.find(
        (tt) => tt.ticket_type_id === ticket.ticket_type_id
      );
      if (ticketType) {
        ticketTypeInfo = {
          name: ticketType.name,
          description: ticketType.description,
          price: ticketType.price,
        };
        ticketPrice = ticketType.price;
        break;
      }
    }

    // Format response to match scanner page expectations
    const formattedTicket = {
      ticket_id: ticket.ticket_id,
      order_id: ticket.order_id,
      event_id: ticket.event_id,
      ticket_type_id: ticket.ticket_type_id,
      qr_code: ticket.qr_code,
      is_validated: ticket.is_validated,
      validation_time: ticket.validation_time,
      attendee_name: ticket.attendee_name,
      attendee_email: ticket.attendee_email,
      attendee_phone: ticket.attendee_phone,
      user_ticketpdf: ticket.user_ticketpdf,
      created_at: ticket.created_at,
      tickettypes: {
        ticket_type_id: ticket.ticket_type_id,
        name: ticketTypeInfo?.name || "Standard Ticket",
        description: ticketTypeInfo?.description || "",
        price: ticketPrice,
        events: {
          event_id: event.event_id,
          title: event.title,
          description: event.description,
          start_date: event.start_date,
          end_date: event.end_date,
          venue_name: event.venue_name,
          banner_image: event.banner_image,
          status: event.status,
          organizer_id: event.organizer_id,
        },
      },
    };

    return NextResponse.json({
      success: true,
      tickets: [formattedTicket],
      count: 1,
    });
  } catch (error) {
    console.error("Error fetching ticket by QR code:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch ticket",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
