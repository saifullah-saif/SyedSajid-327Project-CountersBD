import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import {
  Event,
  Organizer,
  User,
  Order,
  EventStatusType,
  OrganizerStatusType,
} from "@/model/model";
import {
  verifyAdminAuth,
  successResponse,
  errorResponse,
  getMonthlyDateRanges,
  calculatePercentageChange,
} from "@/lib/admin-api-helpers";

/**
 * GET /api/admin/stats
 * Get comprehensive platform statistics for the admin dashboard
 */
export async function GET(request) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    await dbConnect();

    // Get date ranges for monthly comparison
    const { currentMonthStart, currentMonthEnd, lastMonthStart, lastMonthEnd } =
      getMonthlyDateRanges();

    // Parallel execution of all statistics queries for better performance
    const [
      // Event statistics
      totalEvents,
      currentMonthEvents,
      lastMonthEvents,
      eventsByStatus,

      // Organizer statistics
      totalOrganizers,
      currentMonthOrganizers,
      lastMonthOrganizers,
      organizersByStatus,

      // User statistics
      totalUsers,
      currentMonthUsers,
      lastMonthUsers,

      // Revenue and sales statistics
      revenueData,
      currentMonthRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      // Events
      Event.countDocuments(),
      Event.countDocuments({
        created_at: { $gte: currentMonthStart, $lte: currentMonthEnd },
      }),
      Event.countDocuments({
        created_at: { $gte: lastMonthStart, $lte: lastMonthEnd },
      }),
      Event.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Organizers
      Organizer.countDocuments(),
      Organizer.countDocuments({
        created_at: { $gte: currentMonthStart, $lte: currentMonthEnd },
      }),
      Organizer.countDocuments({
        created_at: { $gte: lastMonthStart, $lte: lastMonthEnd },
      }),
      Organizer.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Users
      User.countDocuments(),
      User.countDocuments({
        created_at: { $gte: currentMonthStart, $lte: currentMonthEnd },
      }),
      User.countDocuments({
        created_at: { $gte: lastMonthStart, $lte: lastMonthEnd },
      }),

      // Revenue and tickets
      Order.aggregate([
        {
          $match: {
            payment_status: "completed",
          },
        },
        {
          $unwind: "$order_items",
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $multiply: [
                  "$order_items.quantity",
                  { $toDouble: "$order_items.unit_price" },
                ],
              },
            },
            totalTicketsSold: { $sum: "$order_items.quantity" },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            payment_status: "completed",
            created_at: { $gte: currentMonthStart, $lte: currentMonthEnd },
          },
        },
        {
          $unwind: "$order_items",
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: {
                $multiply: [
                  "$order_items.quantity",
                  { $toDouble: "$order_items.unit_price" },
                ],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            payment_status: "completed",
            created_at: { $gte: lastMonthStart, $lte: lastMonthEnd },
          },
        },
        {
          $unwind: "$order_items",
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: {
                $multiply: [
                  "$order_items.quantity",
                  { $toDouble: "$order_items.unit_price" },
                ],
              },
            },
          },
        },
      ]),
    ]);

    // Process event status counts
    const eventStatusCounts = {
      draft: 0,
      pending: 0,
      approved: 0,
      live: 0,
      completed: 0,
      cancelled: 0,
    };
    eventsByStatus.forEach((item) => {
      if (item._id in eventStatusCounts) {
        eventStatusCounts[item._id] = item.count;
      }
    });

    // Process organizer status counts
    const organizerStatusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    organizersByStatus.forEach((item) => {
      if (item._id in organizerStatusCounts) {
        organizerStatusCounts[item._id] = item.count;
      }
    });

    // Process revenue data
    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const totalTicketsSold = revenueData[0]?.totalTicketsSold || 0;
    const currentMonthRev = currentMonthRevenue[0]?.revenue || 0;
    const lastMonthRev = lastMonthRevenue[0]?.revenue || 0;

    // Calculate monthly growth percentages
    const monthlyGrowth = {
      users: calculatePercentageChange(currentMonthUsers, lastMonthUsers),
      organizers: calculatePercentageChange(
        currentMonthOrganizers,
        lastMonthOrganizers
      ),
      events: calculatePercentageChange(currentMonthEvents, lastMonthEvents),
      revenue: calculatePercentageChange(currentMonthRev, lastMonthRev),
    };

    // Format response
    const stats = {
      // Overall counts
      totalUsers,
      totalOrganizers,
      totalEvents,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalTicketsSold,

      // Active/Live metrics
      liveEvents: eventStatusCounts.live,
      activeOrganizers: organizerStatusCounts.approved,

      // Pending approvals
      pendingApprovals:
        eventStatusCounts.pending + organizerStatusCounts.pending,
      pendingEvents: eventStatusCounts.pending,
      pendingOrganizers: organizerStatusCounts.pending,

      // Status breakdowns
      eventsByStatus: eventStatusCounts,
      organizersByStatus: organizerStatusCounts,

      // Monthly growth
      monthlyGrowth: {
        users: parseFloat(monthlyGrowth.users.toFixed(2)),
        organizers: parseFloat(monthlyGrowth.organizers.toFixed(2)),
        events: parseFloat(monthlyGrowth.events.toFixed(2)),
        revenue: parseFloat(monthlyGrowth.revenue.toFixed(2)),
      },

      // Current month metrics
      currentMonth: {
        users: currentMonthUsers,
        organizers: currentMonthOrganizers,
        events: currentMonthEvents,
        revenue: parseFloat(currentMonthRev.toFixed(2)),
      },

      // Last month metrics for comparison
      lastMonth: {
        users: lastMonthUsers,
        organizers: lastMonthOrganizers,
        events: lastMonthEvents,
        revenue: parseFloat(lastMonthRev.toFixed(2)),
      },
    };

    return successResponse(stats);
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return errorResponse("Failed to fetch statistics", 500, error.message);
  }
}
