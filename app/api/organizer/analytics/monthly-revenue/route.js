import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

const Event = mongoose.models.Event || require("@/model/model").Event;
const Order = mongoose.models.Order || require("@/model/model").Order;
const Organizer =
  mongoose.models.Organizer || require("@/model/model").Organizer;
const MasterAccount =
  mongoose.models.MasterAccount || require("@/model/model").MasterAccount;

/**
 * @route GET /api/organizer/analytics/monthly-revenue
 * @description Get monthly revenue data for the organizer
 * @query {number} months - Number of months to retrieve (default: 6)
 * @returns {Array} Monthly revenue data
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const monthsCount = parseInt(searchParams.get("months")) || 6;

    // Get all events for this organizer
    const events = await Event.find({
      organizer_id: organizer.organizer_id,
    }).select("event_id");

    const eventIds = events.map((e) => e.event_id);

    if (eventIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Calculate date range (last N months)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsCount);

    // Get all completed orders in the date range
    const orders = await Order.find({
      "order_items.event_id": { $in: eventIds },
      payment_status: "completed",
      created_at: { $gte: startDate, $lte: endDate },
    }).select("order_items total_amount created_at");

    // Group revenue by month
    const monthlyRevenueMap = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Initialize all months with 0
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyRevenueMap[monthKey] = {
        month: monthNames[date.getMonth()],
        revenue: 0,
        year: date.getFullYear(),
      };
    }

    // Calculate revenue for each month
    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;

      if (monthlyRevenueMap[monthKey]) {
        // Only count revenue from items belonging to this organizer's events
        let orderRevenue = 0;
        order.order_items.forEach((item) => {
          if (eventIds.includes(item.event_id)) {
            orderRevenue +=
              parseFloat(item.unit_price.toString()) * item.quantity;
          }
        });
        monthlyRevenueMap[monthKey].revenue += orderRevenue;
      }
    });

    // Convert to array and format
    const monthlyRevenue = Object.values(monthlyRevenueMap).map((item) => ({
      month: item.month,
      revenue: parseFloat(item.revenue.toFixed(2)),
    }));

    return NextResponse.json({
      success: true,
      data: monthlyRevenue,
    });
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
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
