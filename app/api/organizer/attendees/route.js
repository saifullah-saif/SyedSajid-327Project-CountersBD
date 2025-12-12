import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

const Event = mongoose.models.Event || require("@/model/model").Event;
const Ticket = mongoose.models.Ticket || require("@/model/model").Ticket;
const Order = mongoose.models.Order || require("@/model/model").Order;
const Organizer =
  mongoose.models.Organizer || require("@/model/model").Organizer;
const MasterAccount =
  mongoose.models.MasterAccount || require("@/model/model").MasterAccount;

/**
 * GET /api/organizer/attendees
 * Get all attendees data for the organizer's events
 * Returns complete attendee list without backend filtering
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

    const organizerId = organizer.organizer_id;

    // Get all events for this organizer
    const events = await Event.find({ organizer_id: organizerId })
      .select({
        event_id: 1,
        title: 1,
        start_date: 1,
        banner_image: 1,
        venue_name: 1,
        categories: 1,
      })
      .lean();

    const eventIds = events.map((e) => e.event_id);

    if (eventIds.length === 0) {
      return NextResponse.json({
        success: true,
        attendees: [],
        events: [],
        analytics: {
          totalAttendees: 0,
          verified: 0,
          pending: 0,
          eventsWithAttendees: [],
          attendeeAnalytics: [],
        },
      });
    }

    // Get all tickets for these events
    const tickets = await Ticket.find({ event_id: { $in: eventIds } })
      .select({
        ticket_id: 1,
        order_id: 1,
        event_id: 1,
        ticket_type_id: 1,
        
        is_validated: 1,
        validation_time: 1,
        attendee_email: 1,
        attendee_name: 1,
        attendee_phone: 1,
        created_at: 1,
      })
      .lean();

    // Get all orders for these tickets
    const orderIds = [...new Set(tickets.map((t) => t.order_id))];
    const orders = await Order.find({ order_id: { $in: orderIds } })
      .select({
        order_id: 1,
        created_at: 1,
        order_items: 1,
      })
      .lean();

    // Create a map for quick lookup
    const orderMap = {};
    orders.forEach((order) => {
      orderMap[order.order_id] = order;
    });

    const eventMap = {};
    events.forEach((event) => {
      eventMap[event.event_id] = event;
    });

    // Format attendees data
    const attendees = tickets.map((ticket) => {
      const order = orderMap[ticket.order_id];
      const event = eventMap[ticket.event_id];

      // Find ticket type details from event categories
      let ticketTypeName = "General";
      let categoryName = "Standard";

      if (event && event.categories) {
        for (const category of event.categories) {
          if (category.ticket_types) {
            const ticketType = category.ticket_types.find(
              (tt) => tt.ticket_type_id === ticket.ticket_type_id
            );
            if (ticketType) {
              ticketTypeName = ticketType.name;
              categoryName = category.name;
              break;
            }
          }
        }
      }

      return {
        id: ticket.ticket_id,
        name: ticket.attendee_name || "N/A",
        email: ticket.attendee_email || "N/A",
        phone: ticket.attendee_phone || "N/A",
        
        ticket_type: ticketTypeName,
        ticket_category: categoryName,
        event_id: ticket.event_id,
        event_title: event ? event.title : "Unknown Event",
        purchase_date: order ? order.created_at : ticket.created_at,
        verification_status: ticket.is_validated ? "verified" : "pending",
        verification_time: ticket.validation_time || null,
      };
    });

    // Calculate analytics
    const totalAttendees = attendees.length;
    const verified = attendees.filter(
      (a) => a.verification_status === "verified"
    ).length;
    const pending = totalAttendees - verified;

    // Calculate attendees by event
    const attendeesByEvent = {};
    attendees.forEach((attendee) => {
      const eventId = attendee.event_id;
      if (!attendeesByEvent[eventId]) {
        attendeesByEvent[eventId] = {
          id: eventId,
          title: attendee.event_title,
          totalAttendees: 0,
          verified: 0,
          pending: 0,
        };
      }
      attendeesByEvent[eventId].totalAttendees++;
      if (attendee.verification_status === "verified") {
        attendeesByEvent[eventId].verified++;
      } else {
        attendeesByEvent[eventId].pending++;
      }
    });

    const eventsWithAttendees = events.map((event) => {
      const stats = attendeesByEvent[event.event_id] || {
        totalAttendees: 0,
        verified: 0,
        pending: 0,
      };

      return {
        id: event.event_id,
        title: event.title,
        banner: event.banner_image || "/placeholder.svg",
        date: event.start_date,
        location: event.venue_name || "N/A",
        totalAttendees: stats.totalAttendees,
        verified: stats.verified,
        pending: stats.pending,
        attendanceRate:
          stats.totalAttendees > 0
            ? ((stats.verified / stats.totalAttendees) * 100).toFixed(1)
            : 0,
      };
    });

    // Calculate attendee analytics for charts
    const ticketTypeBreakdown = {};
    attendees.forEach((attendee) => {
      const type = attendee.ticket_type;
      ticketTypeBreakdown[type] = (ticketTypeBreakdown[type] || 0) + 1;
    });

    const attendeeAnalytics = Object.entries(ticketTypeBreakdown).map(
      ([name, value]) => ({
        name,
        value,
        color: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"][
          Object.keys(ticketTypeBreakdown).indexOf(name) % 5
        ],
      })
    );

    return NextResponse.json({
      success: true,
      attendees,
      events: eventsWithAttendees,
      analytics: {
        totalAttendees,
        verified,
        pending,
        eventsWithAttendees,
        attendeeAnalytics,
      },
    });
  } catch (error) {
    console.error("Error fetching attendees:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch attendees",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
