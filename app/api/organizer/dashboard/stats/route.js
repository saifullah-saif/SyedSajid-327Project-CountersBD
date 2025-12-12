import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

const Event = mongoose.models.Event || require("@/model/model").Event;
const Order = mongoose.models.Order || require("@/model/model").Order;
const Organizer =
  mongoose.models.Organizer || require("@/model/model").Organizer;

/**
 * GET /api/organizer/dashboard/stats
 * Returns dashboard statistics for the organizer
 * - Total revenue
 * - Total tickets sold
 * - Active events count
 * - Total attendees
 * - Percentage changes from previous period
 */
export async function GET(request) {
  try {
    await dbConnect();

    // Get session and verify organizer
    const session = await getServerSession();
    console.log(session);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organizer by email
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

    // Calculate date ranges for current and previous periods
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get current month stats
    const currentMonthEvents = await Event.find({
      organizer_id: organizerId,
      created_at: { $gte: currentMonthStart },
    });

    const currentMonthEventIds = currentMonthEvents.map((e) => e.event_id);

    const currentMonthOrders = await Order.find({
      "order_items.event_id": { $in: currentMonthEventIds },
      payment_status: "completed",
      created_at: { $gte: currentMonthStart },
    });

    // Get previous month stats
    const previousMonthEvents = await Event.find({
      organizer_id: organizerId,
      created_at: { $gte: previousMonthStart, $lt: currentMonthStart },
    });

    const previousMonthEventIds = previousMonthEvents.map((e) => e.event_id);

    const previousMonthOrders = await Order.find({
      "order_items.event_id": { $in: previousMonthEventIds },
      payment_status: "completed",
      created_at: { $gte: previousMonthStart, $lt: currentMonthStart },
    });

    // Calculate current totals
    const allEvents = await Event.find({ organizer_id: organizerId });
    const allEventIds = allEvents.map((e) => e.event_id);

    const allOrders = await Order.find({
      "order_items.event_id": { $in: allEventIds },
      payment_status: "completed",
    });

    const totalRevenue = allOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total_amount.toString());
    }, 0);

    const totalTicketsSold = allOrders.reduce((sum, order) => {
      return (
        sum +
        order.order_items.reduce((itemSum, item) => {
          return itemSum + (item.quantity || 0);
        }, 0)
      );
    }, 0);

    const activeEvents = await Event.countDocuments({
      organizer_id: organizerId,
      status: { $in: ["approved", "live"] },
      end_date: { $gte: now },
    });

    const totalAttendees = totalTicketsSold; // Each ticket represents one attendee

    // Calculate previous period totals for comparison
    const previousRevenue = previousMonthOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total_amount.toString());
    }, 0);

    const previousTickets = previousMonthOrders.reduce((sum, order) => {
      return (
        sum +
        order.order_items.reduce((itemSum, item) => {
          return itemSum + (item.quantity || 0);
        }, 0)
      );
    }, 0);

    const currentRevenue = currentMonthOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total_amount.toString());
    }, 0);

    const currentTickets = currentMonthOrders.reduce((sum, order) => {
      return (
        sum +
        order.order_items.reduce((itemSum, item) => {
          return itemSum + (item.quantity || 0);
        }, 0)
      );
    }, 0);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const stats = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTicketsSold,
      activeEvents,
      totalAttendees,
      changes: {
        revenueChange: calculateChange(currentRevenue, previousRevenue),
        ticketsChange: calculateChange(currentTickets, previousTickets),
        eventsChange: calculateChange(
          currentMonthEvents.length,
          previousMonthEvents.length
        ),
        attendeesChange: calculateChange(currentTickets, previousTickets),
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard statistics",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
