import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

const Event = mongoose.models.Event || require("@/model/model").Event;
const Order = mongoose.models.Order || require("@/model/model").Order;
const Ticket = mongoose.models.Ticket || require("@/model/model").Ticket;
const Organizer =
  mongoose.models.Organizer || require("@/model/model").Organizer;
const MasterAccount =
  mongoose.models.MasterAccount || require("@/model/model").MasterAccount;
const Genre = mongoose.models.Genre || require("@/model/model").Genre;

/**
 * @route GET /api/organizer/analytics/overview
 * @description Get analytics overview statistics for the organizer
 * @returns {Object} Overview stats including total revenue, avg revenue per ticket, top selling event, total tickets sold
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
    }).select("event_id title");

    const eventIds = events.map((e) => e.event_id);

    if (eventIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalRevenue: 0,
          avgRevenuePerTicket: 0,
          topSellingEvent: null,
          totalTicketsSold: 0,
        },
      });
    }

    // Get all orders for these events
    const orders = await Order.find({
      "order_items.event_id": { $in: eventIds },
      payment_status: "completed",
    });

    // Calculate total revenue
    let totalRevenue = 0;
    const eventRevenueMap = {};

    orders.forEach((order) => {
      const orderAmount = parseFloat(order.total_amount.toString());
      totalRevenue += orderAmount;

      // Calculate revenue per event
      order.order_items.forEach((item) => {
        if (eventIds.includes(item.event_id)) {
          const itemRevenue =
            parseFloat(item.unit_price.toString()) * item.quantity;
          eventRevenueMap[item.event_id] =
            (eventRevenueMap[item.event_id] || 0) + itemRevenue;
        }
      });
    });

    // Get total tickets sold
    const totalTicketsSold = await Ticket.countDocuments({
      event_id: { $in: eventIds },
    });

    // Calculate average revenue per ticket
    const avgRevenuePerTicket =
      totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;

    // Find top selling event by revenue
    let topSellingEvent = null;
    let maxRevenue = 0;

    for (const [eventId, revenue] of Object.entries(eventRevenueMap)) {
      if (revenue > maxRevenue) {
        maxRevenue = revenue;
        const event = events.find((e) => e.event_id === parseInt(eventId));
        topSellingEvent = event ? event.title : null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        avgRevenuePerTicket: parseFloat(avgRevenuePerTicket.toFixed(2)),
        topSellingEvent: topSellingEvent || "N/A",
        totalTicketsSold,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
