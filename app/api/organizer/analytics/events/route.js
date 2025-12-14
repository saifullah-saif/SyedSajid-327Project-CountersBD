import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

const Event = mongoose.models.Event || require("@/model/model").Event;
const Order = mongoose.models.Order || require("@/model/model").Order;
const Genre = mongoose.models.Genre || require("@/model/model").Genre;
const Organizer =
  mongoose.models.Organizer || require("@/model/model").Organizer;
const MasterAccount =
  mongoose.models.MasterAccount || require("@/model/model").MasterAccount;

/**
 * @route GET /api/organizer/analytics/events
 * @description Get all events with revenue and ticket type breakdown for the organizer
 * @returns {Array} Events with revenue data and ticket types
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

    // Get organizer by email
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

    // Get all events for this organizer
    const events = await Event.find({
      organizer_id: organizer.organizer_id,
    }).select("event_id title genre_id categories");

    if (events.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const eventIds = events.map((e) => e.event_id);

    // Get all completed orders for these events
    const orders = await Order.find({
      "order_items.event_id": { $in: eventIds },
      payment_status: "completed",
    }).select("order_items");

    // Get all genres for mapping
    const genres = await Genre.find({}).select("genre_id name");
    const genreMap = {};
    genres.forEach((genre) => {
      genreMap[genre.genre_id] = genre.name;
    });

    // Calculate revenue and ticket type breakdown per event
    const eventDataMap = {};

    events.forEach((event) => {
      eventDataMap[event.event_id] = {
        id: `e${event.event_id}`,
        name: event.title,
        revenue: 0,
        genre: genreMap[event.genre_id] || "Other",
        ticketTypes: {},
      };
    });

    // Calculate revenue from orders
    orders.forEach((order) => {
      order.order_items.forEach((item) => {
        if (eventDataMap[item.event_id]) {
          const itemRevenue =
            parseFloat(item.unit_price.toString()) * item.quantity;
          eventDataMap[item.event_id].revenue += itemRevenue;

          // Find ticket type name
          const event = events.find((e) => e.event_id === item.event_id);
          let ticketTypeName = "Unknown";

          if (event && event.categories) {
            for (const category of event.categories) {
              const ticketType = category.ticket_types?.find(
                (tt) => tt.ticket_type_id === item.ticket_type_id
              );
              if (ticketType) {
                ticketTypeName = ticketType.name;
                break;
              }
            }
          }

          // Aggregate revenue by ticket type
          eventDataMap[item.event_id].ticketTypes[ticketTypeName] =
            (eventDataMap[item.event_id].ticketTypes[ticketTypeName] || 0) +
            itemRevenue;
        }
      });
    });

    // Convert to array and format
    const eventData = Object.values(eventDataMap).map((event) => ({
      id: event.id,
      name: event.name,
      revenue: parseFloat(event.revenue.toFixed(2)),
      genre: event.genre,
      ticketTypes: event.ticketTypes,
    }));

    // Sort by revenue descending
    eventData.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      success: true,
      data: eventData,
    });
  } catch (error) {
    console.error("Error fetching event analytics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
