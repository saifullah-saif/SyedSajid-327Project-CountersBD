import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

const Event = mongoose.models.Event || require("@/model/model").Event;
const Organizer =
  mongoose.models.Organizer || require("@/model/model").Organizer;

/**
 * GET /api/organizer/dashboard/recent-events
 * Returns recent events for the organizer
 * Query params: limit (default: 3)
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit") || "3";
    const limit = parseInt(limitParam);

    // Get organizer
    const MasterAccount =
      mongoose.models.MasterAccount || require("@/model/model").MasterAccount;
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

    // Get recent events with necessary fields only
    const recentEvents = await Event.find({ organizer_id: organizerId })
      .select({
        event_id: 1,
        title: 1,
        start_date: 1,
        end_date: 1,
        banner_image: 1,
        status: 1,
        venue_name: 1,
        "categories.ticket_types.quantity_available": 1,
      })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    // Format the events for frontend
    const formattedEvents = recentEvents.map((event) => {
      // Calculate total ticket capacity
      let totalTickets = 0;
      if (event.categories && Array.isArray(event.categories)) {
        event.categories.forEach((category) => {
          if (category.ticket_types && Array.isArray(category.ticket_types)) {
            category.ticket_types.forEach((ticket) => {
              totalTickets += ticket.quantity_available || 0;
            });
          }
        });
      }

      return {
        id: event.event_id,
        title: event.title,
        date: event.start_date,
        endDate: event.end_date,
        location: event.venue_name || "TBD",
        image: event.banner_image || "/placeholder.svg",
        status: event.status || "draft",
        totalTickets,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedEvents,
    });
  } catch (error) {
    console.error("Error fetching recent events:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch recent events",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
