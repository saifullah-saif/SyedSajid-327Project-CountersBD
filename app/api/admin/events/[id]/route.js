import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { Event, Organizer, MasterAccount, Order } from "@/model/model";
import {
  verifyAdminAuth,
  validateNumericId,
  successResponse,
  errorResponse,
} from "@/lib/admin-api-helpers";

/**
 * GET /api/admin/events/[id]
 * Get detailed information for a specific event
 */
export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    // Validate event ID
    const idValidation = validateNumericId(params.id, "Event ID");
    if (!idValidation.valid) {
      return errorResponse(idValidation.error, 400);
    }

    await dbConnect();

    // Fetch event with full details
    const eventDetails = await Event.aggregate([
      {
        $match: { event_id: idValidation.value },
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
        $unwind: {
          path: "$organizer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Lookup organizer's master account
        $lookup: {
          from: "masteraccounts",
          localField: "organizer.account_id",
          foreignField: "account_id",
          as: "organizerAccount",
        },
      },
      {
        $unwind: {
          path: "$organizerAccount",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Lookup location
        $lookup: {
          from: "locations",
          localField: "location_id",
          foreignField: "location_id",
          as: "location",
        },
      },
      {
        $unwind: {
          path: "$location",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Lookup genre
        $lookup: {
          from: "genres",
          localField: "genre_id",
          foreignField: "genre_id",
          as: "genre",
        },
      },
      {
        $unwind: {
          path: "$genre",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!eventDetails || eventDetails.length === 0) {
      return errorResponse("Event not found", 404);
    }

    const event = eventDetails[0];

    // Calculate sales statistics
    const salesData = await Order.aggregate([
      {
        $unwind: "$order_items",
      },
      {
        $match: {
          "order_items.event_id": idValidation.value,
          payment_status: "completed",
        },
      },
      {
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
          total_orders: { $addToSet: "$order_id" },
        },
      },
      {
        $project: {
          tickets_sold: 1,
          revenue: 1,
          total_orders: { $size: "$total_orders" },
        },
      },
    ]);

    const sales = salesData[0] || {
      tickets_sold: 0,
      revenue: 0,
      total_orders: 0,
    };

    // Calculate total available tickets
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

    // Format response
    const response = {
      event_id: event.event_id,
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      start_time: event.start_time,
      banner_image: event.banner_image,
      venue_name: event.venue_name,
      status: event.status,
      created_at: event.created_at,
      updated_at: event.updated_at,
      tickets_sale_start: event.tickets_sale_start,
      tickets_sale_end: event.tickets_sale_end,
      event_policy: event.event_policy,
      organizer: {
        organizer_id: event.organizer?.organizer_id,
        organization_name: event.organizer?.organization_name,
        email: event.organizerAccount?.email,
        phone_number: event.organizer?.phone_number,
        logo: event.organizer?.logo,
        description: event.organizer?.description,
        status: event.organizer?.status,
      },
      location: event.location
        ? {
            city: event.location.city,
            venue_name: event.location.venue_name,
            address: event.location.address,
            map_link: event.location.map_link,
          }
        : null,
      genre: event.genre
        ? {
            name: event.genre.name,
            icon: event.genre.icon,
          }
        : null,
      categories: event.categories || [],
      artists: event.artists || [],
      sales: {
        tickets_sold: sales.tickets_sold,
        revenue: parseFloat(sales.revenue.toFixed(2)),
        total_orders: sales.total_orders,
        total_tickets_available: totalTickets,
        sold_percentage:
          totalTickets > 0
            ? parseFloat(((sales.tickets_sold / totalTickets) * 100).toFixed(2))
            : 0,
      },
    };

    return successResponse(response);
  } catch (error) {
    console.error("Error fetching event details:", error);
    return errorResponse("Failed to fetch event details", 500, error.message);
  }
}
