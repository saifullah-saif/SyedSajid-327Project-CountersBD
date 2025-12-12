import { NextResponse } from "next/server";
import { Event, Genre, Location, Organizer } from "@/model/model";

/**
 * GET /api/home
 * Fetches live events, past events, and organizers data for the home page
 *
 * Query parameters:
 * - type: 'live' | 'past' | 'organizers'
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const currentDate = new Date();

    switch (type) {
      case "live":
        // Fetch live events where tickets_sale_start > current date
        const liveEvents = await Event.find({
          tickets_sale_start: { $lt: currentDate },
          tickets_sale_end: { $gt: currentDate },
          status: "approved",
        })
          .select(
            "event_id title banner_image start_date start_time venue_name genre_id location_id"
          )
          .sort({ tickets_sale_end: 1 })
          .limit(4)
          .lean();

        // Populate genre and location data
        const liveEventsWithDetails = await Promise.all(
          liveEvents.map(async (event) => {
            const genre = await Genre.findOne({ genre_id: event.genre_id })
              .select("name")
              .lean();
            const location = await Location.findOne({
              location_id: event.location_id,
            })
              .select("city venue_name")
              .lean();

            return {
              id: event.event_id,
              title: event.title,
              image: event.banner_image,
              date: event.start_date,
              time: event.start_time,
              genre: genre?.name || "Event",
              location: {
                venue: event.venue_name || location?.venue_name || "",
                city: location?.city || "",
              },
            };
          })
        );

        const formattedEvents = liveEventsWithDetails.map((event) => ({
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

        return NextResponse.json({ events: formattedEvents });

      case "past":
        // Fetch past events where tickets_sale_end < current date
        const pastEvents = await Event.find({
          tickets_sale_end: { $lt: currentDate },
          status: "approved",
        })
          .select("event_id title banner_image genre_id")
          .sort({ tickets_sale_end: -1 })
          .limit(16)
          .lean();

        // Populate genre and location data for past events
        const pastEventsWithDetails = await Promise.all(
          pastEvents.map(async (event) => {
            const genre = await Genre.findOne({ genre_id: event.genre_id })
              .select("name")
              .lean();

            return {
              id: event.event_id,
              title: event.title,
              image: event.banner_image,
              genre: genre?.name || "Event",
            };
          })
        );

        return NextResponse.json({ events: pastEventsWithDetails });

      case "organizers":
        // Fetch approved organizers with event count
        const organizers = await Organizer.find({ status: "approved" })
          .select("organizer_id organization_name logo event_count")
          .lean()
          .where("event_count")
          .gt(0);

        // Get event count for each organizer
        const organizersWithEventCount = await Promise.all(
          organizers.map((organizer) => {
            return {
              id: organizer.organizer_id,
              name: organizer.organization_name,
              logo: organizer.logo,
              eventCount: organizer.event_count,
            };
          })
        );

        return NextResponse.json({ organizers: organizersWithEventCount });

      default:
        return NextResponse.json(
          {
            error:
              "Invalid type parameter. Use 'live', 'past', or 'organizers'",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching home data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data", details: error.message },
      { status: 500 }
    );
  }
}
