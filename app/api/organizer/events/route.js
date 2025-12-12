import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

const Event = mongoose.models.Event || require("@/model/model").Event;
const Order = mongoose.models.Order || require("@/model/model").Order;
const Organizer =
  mongoose.models.Organizer || require("@/model/model").Organizer;

/**
 * GET /api/organizer/events
 * Get list of events for the organizer
 * Query params:
 * - status: Filter by event status (all, draft, pending, approved, live, completed, cancelled)
 * - search: Search term for event title
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build query
    const query = { organizer_id: organizerId };

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Get total count
    const totalEvents = await Event.countDocuments(query);

    // Get events with pagination
    const events = await Event.find(query)
      .select({
        event_id: 1,
        title: 1,
        description: 1,
        start_date: 1,
        end_date: 1,
        start_time: 1,
        banner_image: 1,
        venue_name: 1,
        status: 1,
        categories: 1,
        location_id: 1,
        genre_id: 1,
        created_at: 1,
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get event IDs for order aggregation
    const eventIds = events.map((e) => e.event_id);

    // Get order statistics for all events
    const orderStats = await Order.aggregate([
      {
        $match: {
          "order_items.event_id": { $in: eventIds },
          payment_status: "completed",
        },
      },
      { $unwind: "$order_items" },
      {
        $match: {
          "order_items.event_id": { $in: eventIds },
        },
      },
      {
        $group: {
          _id: "$order_items.event_id",
          tickets_sold: { $sum: "$order_items.quantity" },
          revenue: {
            $sum: {
              $multiply: [
                { $toDouble: "$order_items.unit_price" },
                "$order_items.quantity",
              ],
            },
          },
          attendee_count: { $sum: "$order_items.quantity" },
        },
      },
    ]);

    // Create a map for quick lookup
    const statsMap = {};
    orderStats.forEach((stat) => {
      statsMap[stat._id] = {
        tickets_sold: stat.tickets_sold,
        revenue: Math.round(stat.revenue * 100) / 100,
        attendee_count: stat.attendee_count,
      };
    });

    // Format events with statistics
    const formattedEvents = events.map((event) => {
      // Calculate total ticket capacity
      let totalTickets = 0;
      const categories = [];

      if (event.categories && Array.isArray(event.categories)) {
        event.categories.forEach((category) => {
          const categoryData = {
            name: category.name,
            ticket_count: 0,
          };

          if (category.ticket_types && Array.isArray(category.ticket_types)) {
            category.ticket_types.forEach((ticket) => {
              const quantity = ticket.quantity_available || 0;
              totalTickets += quantity;
              categoryData.ticket_count += quantity;
            });
          }

          categories.push(categoryData.name);
        });
      }

      const stats = statsMap[event.event_id] || {
        tickets_sold: 0,
        revenue: 0,
        attendee_count: 0,
      };

      return {
        id: event.event_id,
        title: event.title,
        description: event.description,
        date: event.start_date,
        endDate: event.end_date,
        startTime: event.start_time,
        location: event.venue_name || "TBD",
        image: event.banner_image || "/placeholder.svg",
        status: event.status || "draft",
        total_tickets: totalTickets,
        ticket_capacity: totalTickets,
        tickets_sold: stats.tickets_sold,
        revenue: stats.revenue,
        ticket_sales: stats.revenue,
        attendee_count: stats.attendee_count,
        attendees: stats.attendee_count,
        categories,
        location_id: event.location_id,
        genre_id: event.genre_id,
        created_at: event.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      pagination: {
        page,
        limit,
        total: totalEvents,
        pages: Math.ceil(totalEvents / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizer/events
 * Create a new event
 * Body: Event data including categories and tickets
 */
export async function POST(request) {
  try {
    await dbConnect();

    // Get session and verify organizer
    const session = await getServerSession();
    console.log(session);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "title",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "saleStartDate",
      "saleEndDate",
      "venueName",
      "venueAddress",
      "city",
      "description",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate unique event_id
    const lastEvent = await Event.findOne().sort({ event_id: -1 });
    const eventId = lastEvent ? lastEvent.event_id + 1 : 1;

    // Convert time string to Date object (HH:mm format)
    const convertTimeToDate = (timeString) => {
      if (!timeString) return null;
      const [hours, minutes] = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date;
    };

    // Process categories and generate IDs
    const processedCategories = [];
    if (body.categories && Array.isArray(body.categories)) {
      for (let i = 0; i < body.categories.length; i++) {
        const category = body.categories[i];
        const categoryId = i + 1;

        const processedTickets = [];
        if (category.tickets && Array.isArray(category.tickets)) {
          for (let j = 0; j < category.tickets.length; j++) {
            const ticket = category.tickets[j];
            processedTickets.push({
              ticket_type_id: j + 1,
              name: ticket.name,
              description: ticket.description || "",
              price: parseFloat(ticket.price) || 0,
              quantity_available: parseInt(ticket.quantity) || 0,
              max_per_order: parseInt(ticket.maxPerOrder) || 10,
              banner: ticket.banner || null,
              pdf_template: ticket.pdfTemplate || null,
            });
          }
        }

        processedCategories.push({
          category_id: categoryId,
          name: category.name,
          description: category.description || "",
          category_type: category.categoryType || category.type || "general",
          ticket_types: processedTickets,
        });
      }
    }

    // Process artists
    const processedArtists = [];
    if (body.artists && Array.isArray(body.artists)) {
      for (const artistId of body.artists) {
        // Fetch artist details
        const Artist =
          mongoose.models.Artist || require("@/model/model").Artist;
        const artist = await Artist.findOne({ artist_id: artistId });

        if (artist) {
          processedArtists.push({
            artist_id: artist.artist_id,
            name: artist.name,
            bio: artist.bio || "",
            image: artist.image || "",
          });
        }
      }
    }

    // Create event document
    const eventData = {
      event_id: eventId,
      organizer_id: organizerId,
      title: body.title,
      description: body.description,
      start_date: new Date(body.startDate),
      end_date: new Date(body.endDate),
      start_time: convertTimeToDate(body.startTime),
      banner_image: body.bannerImage || null,
      venue_name: body.venueName,
      location_id: body.locationId || null,
      genre_id: body.genreId || null,
      tickets_sale_start: new Date(body.saleStartDate),
      tickets_sale_end: new Date(body.saleEndDate),
      event_policy: body.eventPolicy || "",
      status: body.status || "draft",
      categories: processedCategories,
      artists: processedArtists,
    };

    const newEvent = new Event(eventData);
    await newEvent.save();

    if (organizer) {
      organizer.event_count = (organizer.event_count || 0) + 1;
      await organizer.save();
    }

    console.log("Event created successfully:", eventId);

    return NextResponse.json(
      {
        success: true,
        message: "Event created successfully",
        eventId: eventId,
        event: {
          id: eventId,
          title: newEvent.title,
          status: newEvent.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create event",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizer/events
 * Update an existing event
 * Body: Event data with event_id
 */
export async function PUT(request) {
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

    // Parse request body
    const body = await request.json();

    if (!body.event_id) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Find and verify event ownership
    const event = await Event.findOne({ event_id: body.event_id });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    if (event.organizer_id !== organizerId) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to update this event",
        },
        { status: 403 }
      );
    }

    // Convert time string to Date object
    const convertTimeToDate = (timeString) => {
      if (!timeString) return null;
      const [hours, minutes] = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date;
    };

    // Build update object
    const updateData = {};

    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.startDate) updateData.start_date = new Date(body.startDate);
    if (body.endDate) updateData.end_date = new Date(body.endDate);
    if (body.startTime)
      updateData.start_time = convertTimeToDate(body.startTime);
    if (body.bannerImage !== undefined)
      updateData.banner_image = body.bannerImage;
    if (body.venueName) updateData.venue_name = body.venueName;
    if (body.locationId !== undefined) updateData.location_id = body.locationId;
    if (body.genreId !== undefined) updateData.genre_id = body.genreId;
    if (body.saleStartDate)
      updateData.tickets_sale_start = new Date(body.saleStartDate);
    if (body.saleEndDate)
      updateData.tickets_sale_end = new Date(body.saleEndDate);
    if (body.eventPolicy !== undefined)
      updateData.event_policy = body.eventPolicy;
    if (body.status) updateData.status = body.status;

    // Process categories if provided
    if (body.categories && Array.isArray(body.categories)) {
      const processedCategories = [];
      for (let i = 0; i < body.categories.length; i++) {
        const category = body.categories[i];
        const categoryId = i + 1;

        const processedTickets = [];
        if (category.tickets && Array.isArray(category.tickets)) {
          for (let j = 0; j < category.tickets.length; j++) {
            const ticket = category.tickets[j];
            processedTickets.push({
              ticket_type_id: j + 1,
              name: ticket.name,
              description: ticket.description || "",
              price: parseFloat(ticket.price) || 0,
              quantity_available: parseInt(ticket.quantity) || 0,
              max_per_order: parseInt(ticket.maxPerOrder) || 10,
              banner: ticket.banner || null,
              pdf_template: ticket.pdfTemplate || null,
            });
          }
        }

        processedCategories.push({
          category_id: categoryId,
          name: category.name,
          description: category.description || "",
          category_type: category.categoryType || category.type || "general",
          ticket_types: processedTickets,
        });
      }
      updateData.categories = processedCategories;
    }

    // Process artists if provided
    if (body.artists && Array.isArray(body.artists)) {
      const processedArtists = [];
      for (const artistId of body.artists) {
        const Artist =
          mongoose.models.Artist || require("@/model/model").Artist;
        const artist = await Artist.findOne({ artist_id: artistId });

        if (artist) {
          processedArtists.push({
            artist_id: artist.artist_id,
            name: artist.name,
            bio: artist.bio || "",
            image: artist.image || "",
          });
        }
      }
      updateData.artists = processedArtists;
    }

    // Update the event
    const updatedEvent = await Event.findOneAndUpdate(
      { event_id: body.event_id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log("Event updated successfully:", body.event_id);

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      event: {
        id: updatedEvent.event_id,
        title: updatedEvent.title,
        status: updatedEvent.status,
      },
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update event",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
