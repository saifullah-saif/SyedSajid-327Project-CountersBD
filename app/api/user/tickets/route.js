import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongo";
import { Ticket, Order, Event, Location } from "@/model/model";

/**
 * GET /api/user/tickets
 * Fetch all tickets for the logged-in user with event details
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const userId = session.user.userId;

    // Use aggregation pipeline to fetch tickets with event details
    const tickets = await Ticket.aggregate([
      // Step 1: Lookup orders to filter by user_id
      {
        $lookup: {
          from: "orders",
          localField: "order_id",
          foreignField: "order_id",
          as: "order",
        },
      },
      {
        $unwind: "$order",
      },
      // Step 2: Filter tickets belonging to the user
      {
        $match: {
          "order.user_id": userId,
        },
      },
      // Step 3: Lookup event details
      {
        $lookup: {
          from: "events",
          localField: "event_id",
          foreignField: "event_id",
          as: "event",
        },
      },
      {
        $unwind: "$event",
      },
      // Step 4: Lookup location details
      {
        $lookup: {
          from: "locations",
          localField: "event.location_id",
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
      // Step 5: Project only required fields
      {
        $project: {
          ticket_id: 1,
          pass_id: 1,
          is_validated: 1,
          user_ticketpdf: 1,
          attendee_name: 1,
          attendee_email: 1,
          attendee_phone: 1,
          created_at: 1,
          ticket_type_id: 1,
          event_id: "$event.event_id",
          eventTitle: "$event.title",
          eventImage: "$event.banner_image",
          eventDate: "$event.start_date",
          eventTime: "$event.start_time",
          eventEndDate: "$event.end_date",
          eventLocation: {
            venue: "$location.venue_name",
            city: "$location.city",
            address: "$location.address",
          },
          purchaseDate: "$order.created_at",
          // Find ticket type details from event categories
          categories: "$event.categories",
        },
      },
      // Step 6: Add computed fields for ticket type name and price
      {
        $addFields: {
          ticketTypeInfo: {
            $reduce: {
              input: "$categories",
              initialValue: null,
              in: {
                $cond: {
                  if: {
                    $in: [
                      "$ticket_type_id",
                      "$$this.ticket_types.ticket_type_id",
                    ],
                  },
                  then: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$$this.ticket_types",
                          as: "tt",
                          cond: {
                            $eq: ["$$tt.ticket_type_id", "$ticket_type_id"],
                          },
                        },
                      },
                      0,
                    ],
                  },
                  else: "$$value",
                },
              },
            },
          },
        },
      },
      {
        $project: {
          ticket_id: 1,
          pass_id: 1,
          is_validated: 1,
          user_ticketpdf: 1,
          attendee_name: 1,
          attendee_email: 1,
          attendee_phone: 1,
          created_at: 1,
          event_id: 1,
          eventTitle: 1,
          eventImage: 1,
          eventDate: 1,
          eventTime: 1,
          eventEndDate: 1,
          eventLocation: 1,
          purchaseDate: 1,
          ticketType: "$ticketTypeInfo.name",
          price: { $toString: "$ticketTypeInfo.price" },
          ticket_type_id: 1,
        },
      },
      // Step 7: Sort by event date (newest first)
      {
        $sort: { eventDate: -1 },
      },
    ]);

    // Transform data to match frontend expected format
    const formattedTickets = tickets.map((ticket) => ({
      id: ticket.ticket_id,
      ticket_id: ticket.ticket_id,
      pass_id: ticket.pass_id,
      is_validated: ticket.is_validated,
      user_ticketpdf: ticket.user_ticketpdf,
      attendee_name: ticket.attendee_name,
      attendee_email: ticket.attendee_email,
      attendee_phone: ticket.attendee_phone,
      eventId: ticket.event_id,
      eventTitle: ticket.eventTitle,
      eventImage: ticket.eventImage,
      eventDate: ticket.eventDate,
      eventTime: ticket.eventTime,
      eventEndDate: ticket.eventEndDate,
      eventLocation: ticket.eventLocation,
      ticketType: ticket.ticketType || "General Admission",
      price: ticket.price || "0",
      purchaseDate: ticket.purchaseDate || ticket.created_at,
      passId: ticket.pass_id,
    }));

    // Filter tickets based on event end date
    // Live tickets: end_date + 1 day >= current date
    // Past tickets: end_date + 1 day < current date
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    const liveTickets = formattedTickets.filter((ticket) => {
      if (!ticket.eventEndDate) return false;
      const endDate = new Date(ticket.eventEndDate);
      // Add 1 day to end date
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(0, 0, 0, 0);
      return endDate >= currentDate;
    });

    const pastTickets = formattedTickets.filter((ticket) => {
      if (!ticket.eventEndDate) return false;
      const endDate = new Date(ticket.eventEndDate);
      // Add 1 day to end date
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(0, 0, 0, 0);
      return endDate < currentDate;
    });

    return NextResponse.json({
      success: true,
      data: {
        tickets: formattedTickets,
        liveTickets: liveTickets,
        pastTickets: pastTickets,
        total: formattedTickets.length,
        liveCount: liveTickets.length,
        pastCount: pastTickets.length,
      },
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tickets",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
