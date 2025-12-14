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
 * @route GET /api/organizer/analytics/genre-revenue
 * @description Get revenue breakdown by genre for the organizer
 * @returns {Array} Revenue data grouped by genre
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
    }).select("event_id genre_id");

    if (events.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const eventIds = events.map((e) => e.event_id);

    // Get all genres
    const genres = await Genre.find({}).select("genre_id name");
    const genreMap = {};
    genres.forEach((genre) => {
      genreMap[genre.genre_id] = genre.name;
    });

    // Create event to genre mapping
    const eventGenreMap = {};
    events.forEach((event) => {
      eventGenreMap[event.event_id] = genreMap[event.genre_id] || "Other";
    });

    // Get all completed orders for these events
    const orders = await Order.find({
      "order_items.event_id": { $in: eventIds },
      payment_status: "completed",
    }).select("order_items");

    // Calculate revenue by genre
    const genreRevenueMap = {};

    orders.forEach((order) => {
      order.order_items.forEach((item) => {
        if (eventIds.includes(item.event_id)) {
          const genre = eventGenreMap[item.event_id];
          const itemRevenue =
            parseFloat(item.unit_price.toString()) * item.quantity;

          genreRevenueMap[genre] = (genreRevenueMap[genre] || 0) + itemRevenue;
        }
      });
    });

    // Convert to array format
    const genreRevenue = Object.entries(genreRevenueMap).map(
      ([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
      })
    );

    // Sort by value descending
    genreRevenue.sort((a, b) => b.value - a.value);

    return NextResponse.json({
      success: true,
      data: genreRevenue,
    });
  } catch (error) {
    console.error("Error fetching genre revenue:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
