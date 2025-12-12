import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import {
  Event,
  Organizer,
  MasterAccount,
  Order,
  EventStatusType,
} from "@/model/model";
import {
  verifyAdminAuth,
  successResponse,
  errorResponse,
  decimalToNumber,
} from "@/lib/admin-api-helpers";

/**
 * GET /api/admin/events
 * List all events with organizer information and sales statistics
 */
export async function GET(request) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    await dbConnect();

    // Fetch all events with aggregation pipeline
    const eventsWithDetails = await Event.aggregate([
      {
        // Sort by creation date (newest first)
        $sort: { created_at: -1 },
      },
      {
        // Lookup organizer information
        $lookup: {
          from: "organizers",
          localField: "organizer_id",
          foreignField: "organizer_id",
          as: "organizer",
        },
      },
      {
        // Unwind organizer array (should be single document)
        $unwind: {
          path: "$organizer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Lookup organizer's master account for email
        $lookup: {
          from: "masteraccounts",
          localField: "organizer.account_id",
          foreignField: "account_id",
          as: "organizerAccount",
        },
      },
      {
        // Unwind organizer account
        $unwind: {
          path: "$organizerAccount",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Lookup location information
        $lookup: {
          from: "locations",
          localField: "location_id",
          foreignField: "location_id",
          as: "location",
        },
      },
      {
        // Unwind location
        $unwind: {
          path: "$location",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Lookup genre information
        $lookup: {
          from: "genres",
          localField: "genre_id",
          foreignField: "genre_id",
          as: "genre",
        },
      },
      {
        // Unwind genre
        $unwind: {
          path: "$genre",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Project final structure
        $project: {
          event_id: 1,
          title: 1,
          description: 1,
          start_date: 1,
          end_date: 1,
          start_time: 1,
          banner_image: 1,
          venue_name: 1,
          status: 1,
          created_at: 1,
          updated_at: 1,
          organizer_id: 1,
          organizer_name: "$organizer.organization_name",
          organizer_email: "$organizerAccount.email",
          organizer_phone: "$organizer.phone_number",
          organizer_logo: "$organizer.logo",
          location: {
            city: "$location.city",
            venue_name: "$location.venue_name",
            address: "$location.address",
          },
          genre: {
            name: "$genre.name",
            icon: "$genre.icon",
          },
          tickets_sale_start: 1,
          tickets_sale_end: 1,
          categories: 1,
          artists: 1,
        },
      },
    ]);

    // Calculate tickets sold and revenue for each event
    const eventsWithSalesData = await Promise.all(
      eventsWithDetails.map(async (event) => {
        try {
          // Aggregate sales data from orders
          const salesData = await Order.aggregate([
            {
              // Unwind order items to process each ticket separately
              $unwind: "$order_items",
            },
            {
              // Match orders for this event with completed payment
              $match: {
                "order_items.event_id": event.event_id,
                payment_status: "completed",
              },
            },
            {
              // Group and calculate totals
              $group: {
                _id: null,
                tickets_sold: { $sum: "$order_items.quantity" },
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
          ]);

          const sales = salesData[0] || { tickets_sold: 0, revenue: 0 };

          return {
            ...event,
            tickets_sold: sales.tickets_sold,
            revenue: parseFloat(sales.revenue.toFixed(2)),
          };
        } catch (err) {
          console.error(
            `Error calculating sales for event ${event.event_id}:`,
            err
          );
          return {
            ...event,
            tickets_sold: 0,
            revenue: 0,
          };
        }
      })
    );

    return successResponse(eventsWithSalesData);
  } catch (error) {
    console.error("Error fetching events:", error);
    return errorResponse("Failed to fetch events", 500, error.message);
  }
}
