import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

const Event = mongoose.models.Event || require("@/model/model").Event;
const Order = mongoose.models.Order || require("@/model/model").Order;
const Organizer =
  mongoose.models.Organizer || require("@/model/model").Organizer;

/**
 * GET /api/organizer/dashboard/revenue
 * Returns monthly revenue data for the last N months
 * Query params: months (default: 6)
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
    const monthsParam = searchParams.get("months") || "6";
    const months = parseInt(monthsParam);

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

    // Get all events for this organizer
    const allEvents = await Event.find({ organizer_id: organizerId });
    const allEventIds = allEvents.map((e) => e.event_id);

    // Generate month labels and calculate revenue
    const monthlyData = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      // Get month name (abbreviated)
      const monthName = monthStart.toLocaleDateString("en-US", {
        month: "short",
      });

      // Get orders for this month
      const monthOrders = await Order.find({
        "order_items.event_id": { $in: allEventIds },
        payment_status: "completed",
        created_at: { $gte: monthStart, $lte: monthEnd },
      });

      // Calculate revenue and tickets
      const revenue = monthOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total_amount.toString());
      }, 0);

      const tickets = monthOrders.reduce((sum, order) => {
        return (
          sum +
          order.order_items.reduce((itemSum, item) => {
            return itemSum + (item.quantity || 0);
          }, 0)
        );
      }, 0);

      monthlyData.push({
        month: monthName,
        revenue: Math.round(revenue * 100) / 100,
        tickets,
      });
    }

    return NextResponse.json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch monthly revenue",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
