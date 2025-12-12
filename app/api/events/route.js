import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";

import { Event } from "@/model/model";
/**
 * @route GET /api/events
 * @description Fetch events with filtering and categorization
 * @query {string} status - Event status: 'live', 'upcoming', 'past'
 * @query {string} genres - Comma-separated genre names
 * @query {string} locations - Comma-separated city names
 * @query {string} search - Search query for event title
 * @query {number} limit - Maximum number of events to return (default: 100)
 */
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // 'live', 'upcoming', 'past'
    const genresParam = searchParams.get("genres");
    const locationsParam = searchParams.get("locations");
    const searchQuery = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Parse comma-separated values
    const genres = genresParam ? genresParam.split(",").filter(Boolean) : [];
    const locations = locationsParam
      ? locationsParam.split(",").filter(Boolean)
      : [];

    // Build aggregation pipeline
    const pipeline = [];

    // Step 1: Filter by ticket sale status
    if (status) {
      const now = new Date();
      let dateFilter = {};

      switch (status) {
        case "past":
          // Events where ticket sales have ended
          dateFilter = { tickets_sale_end: { $lt: now } };
          break;
        case "live":
          // Events where ticket sales are currently active
          dateFilter = {
            tickets_sale_start: { $lte: now },
            tickets_sale_end: { $gte: now },
          };
          break;
        case "upcoming":
          // Events where ticket sales haven't started yet
          dateFilter = { tickets_sale_start: { $gt: now } };
          break;
      }

      pipeline.push({ $match: dateFilter });
    }

    // Step 2: Lookup Genre
    pipeline.push({
      $lookup: {
        from: "genres",
        localField: "genre_id",
        foreignField: "genre_id",
        as: "genreData",
      },
    });

    // Step 3: Lookup Location
    pipeline.push({
      $lookup: {
        from: "locations",
        localField: "location_id",
        foreignField: "location_id",
        as: "locationData",
      },
    });

    // Step 4: Unwind lookups (convert arrays to objects)
    pipeline.push(
      { $unwind: { path: "$genreData", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$locationData", preserveNullAndEmptyArrays: true } }
    );

    // Step 5: Filter by genres if specified
    if (genres.length > 0) {
      pipeline.push({
        $match: { "genreData.name": { $in: genres } },
      });
    }

    // Step 6: Filter by locations if specified
    if (locations.length > 0) {
      pipeline.push({
        $match: { "locationData.city": { $in: locations } },
      });
    }

    // Step 7: Filter by search query
    if (searchQuery) {
      pipeline.push({
        $match: {
          title: { $regex: searchQuery, $options: "i" },
        },
      });
    }

    // Step 8: Project only necessary fields and calculate minimum price
    pipeline.push({
      $project: {
        _id: 0,
        id: "$event_id",
        title: 1,
        description: 1,
        image: "$banner_image",
        date: "$start_date",
        time: "$start_time",
        genre: "$genreData.name",
        location: {
          venue: "$venue_name",
          city: "$locationData.city",
          address: "$locationData.address",
        },
        organizer: "$organizer_id",
        // Calculate minimum price from all ticket types across all categories
        price: {
          $min: {
            $reduce: {
              input: "$categories",
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: "$$this.ticket_types",
                      as: "ticket",
                      in: "$$ticket.price",
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });

    // Step 9: Sort by date (upcoming events first)
    pipeline.push({ $sort: { date: 1 } });

    // Step 10: Limit results
    pipeline.push({ $limit: limit });

    // Execute aggregation
    const events = await Event.aggregate(pipeline);

    // Convert Decimal128 prices to numbers
    const formattedEvents = events.map((event) => ({
      ...event,
      price: event.price ? parseFloat(event.price.toString()) : 0,
      time: event.time
        ? new Date(event.time).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : null,
    }));

    return NextResponse.json({
      success: true,
      count: formattedEvents.length,
      data: formattedEvents,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch events",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
