import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { Event, Genre, Location, Artist, Organizer } from "@/model/model";

/**
 * @route GET /api/events/[id]
 * @description Fetch a single event with full details including categories, ticket types, artists, location, and genre
 * @param {string} id - Event ID
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Event ID is required",
        },
        { status: 400 }
      );
    }

    // Build aggregation pipeline for detailed event data
    const pipeline = [
      {
        $match: { event_id: parseInt(id) },
      },
      // Lookup Genre
      {
        $lookup: {
          from: "genres",
          localField: "genre_id",
          foreignField: "genre_id",
          as: "genreData",
        },
      },
      // Lookup Location
      {
        $lookup: {
          from: "locations",
          localField: "location_id",
          foreignField: "location_id",
          as: "locationData",
        },
      },
      // Lookup Organizer
      {
        $lookup: {
          from: "organizers",
          localField: "organizer_id",
          foreignField: "organizer_id",
          as: "organizerData",
        },
      },
      // Unwind lookups
      {
        $unwind: { path: "$genreData", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$locationData", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$organizerData", preserveNullAndEmptyArrays: true },
      },
      // Project fields
      {
        $project: {
          _id: 0,
          id: "$event_id",
          title: 1,
          description: 1,
          image: "$banner_image",
          startDate: "$start_date",
          endDate: "$end_date",
          time: "$start_time",
          genre: "$genreData.name",
          genreIcon: "$genreData.icon",
          location: {
            venue: "$venue_name",
            city: "$locationData.city",
            address: "$locationData.address",
            mapLink: "$locationData.map_link",
          },
          organizer: {
            id: "$organizerData.organizer_id",
            name: "$organizerData.organization_name",
            description: "$organizerData.description",
            logo: "$organizerData.logo",
            phone: "$organizerData.phone_number",
            facebook: "$organizerData.facebook_link",
            instagram: "$organizerData.insta_link",
            website: "$organizerData.web_link",
          },
          ticketsSaleStart: "$tickets_sale_start",
          ticketsSaleEnd: "$tickets_sale_end",
          eventPolicy: "$event_policy",
          status: 1,
          artists: 1,
          categories: {
            $map: {
              input: "$categories",
              as: "cat",
              in: {
                id: "$$cat.category_id",
                name: "$$cat.name",
                description: "$$cat.description",
                categoryType: "$$cat.category_type",
                ticketTypes: {
                  $map: {
                    input: "$$cat.ticket_types",
                    as: "ticket",
                    in: {
                      id: "$$ticket.ticket_type_id",
                      name: "$$ticket.name",
                      description: "$$ticket.description",
                      price: "$$ticket.price",
                      quantityAvailable: "$$ticket.quantity_available",
                      maxPerOrder: "$$ticket.max_per_order",
                      banner: "$$ticket.banner",
                      pdfTemplate: "$$ticket.pdf_template",
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];

    const events = await Event.aggregate(pipeline);

    if (!events || events.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 }
      );
    }

    const event = events[0];

    // Convert Decimal128 prices to numbers for all ticket types
    if (event.categories) {
      event.categories = event.categories.map((category) => ({
        ...category,
        ticketTypes: category.ticketTypes.map((ticket) => ({
          ...ticket,
          price: ticket.price ? parseFloat(ticket.price.toString()) : 0,
        })),
      }));
    }

    // Format time
    if (event.time) {
      event.time = new Date(event.time).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error fetching event details:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch event details",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
