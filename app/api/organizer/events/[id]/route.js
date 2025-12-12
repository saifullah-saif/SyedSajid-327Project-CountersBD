import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { Event, Order, Organizer, MasterAccount } from "@/model/model";

/**
 * GET /api/organizer/events/[id]
 * Get single event details
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    // Get session and verify organizer
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organizer

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

    // Get event
    const event = await Event.findOne({ event_id: parseInt(id) }).lean();

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (event.organizer_id !== organizerId) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to access this event",
        },
        { status: 403 }
      );
    }

    // Get order statistics for this event
    const orderStats = await Order.aggregate([
      {
        $match: {
          "order_items.event_id": parseInt(id),
          payment_status: "completed",
        },
      },
      { $unwind: "$order_items" },
      {
        $match: {
          "order_items.event_id": parseInt(id),
        },
      },
      {
        $group: {
          _id: null,
          tickets_sold: { $sum: "$order_items.quantity" },
          revenue: {
            $sum: {
              $multiply: [
                { $toDouble: "$order_items.unit_price" },
                "$order_items.quantity",
              ],
            },
          },
        },
      },
    ]);

    const stats = orderStats[0] || { tickets_sold: 0, revenue: 0 };

    // Calculate total capacity
    let totalCapacity = 0;
    const formattedCategories = [];

    if (event.categories && Array.isArray(event.categories)) {
      event.categories.forEach((category) => {
        const categoryTickets = [];

        if (category.ticket_types && Array.isArray(category.ticket_types)) {
          category.ticket_types.forEach((ticket) => {
            totalCapacity += ticket.quantity_available || 0;
            categoryTickets.push({
              id: ticket.ticket_type_id,
              name: ticket.name,
              description: ticket.description,
              price: parseFloat(ticket.price.toString()),
              quantity: ticket.quantity_available,
              maxPerOrder: ticket.max_per_order,
              banner: ticket.banner,
              pdfTemplate: ticket.pdf_template,
            });
          });
        }

        formattedCategories.push({
          id: category.category_id,
          name: category.name,
          description: category.description,
          type: category.category_type,
          categoryType: category.category_type,
          tickets: categoryTickets,
        });
      });
    }

    // Format artists
    const formattedArtists = [];
    if (event.artists && Array.isArray(event.artists)) {
      event.artists.forEach((artist) => {
        formattedArtists.push({
          artist_id: artist.artist_id,
          name: artist.name,
          bio: artist.bio,
          image: artist.image,
        });
      });
    }

    // Format start time to HH:mm
    let startTimeFormatted = "";
    if (event.start_time) {
      const date = new Date(event.start_time);
      startTimeFormatted = `${String(date.getHours()).padStart(
        2,
        "0"
      )}:${String(date.getMinutes()).padStart(2, "0")}`;
    }

    // Format response
    const formattedEvent = {
      id: event.event_id,
      title: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      startTime: startTimeFormatted,
      saleStartDate: event.tickets_sale_start,
      saleEndDate: event.tickets_sale_end,
      venueName: event.venue_name,
      venueAddress: event.venue_address || "",
      city: event.city || "",
      mapLink: event.map_link || "",
      eventPolicy: event.event_policy,
      bannerImage: event.banner_image,
      genreId: event.genre_id ? String(event.genre_id) : "",
      locationId: event.location_id,
      status: event.status,
      capacity: totalCapacity,
      eventArtists: formattedArtists,
      categories: formattedCategories,
      stats: {
        tickets_sold: stats.tickets_sold,
        revenue: Math.round(stats.revenue * 100) / 100,
        attendee_count: stats.tickets_sold,
      },
      created_at: event.created_at,
      updated_at: event.updated_at,
    };

    return NextResponse.json({
      success: true,
      event: formattedEvent,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch event",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizer/events/[id]
 * Partially update an event
 */
export async function PATCH(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;

    // Get session and verify organizer
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organizer

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

    // Find event and verify ownership
    const event = await Event.findOne({ event_id: parseInt(id) });

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

    // Parse request body
    const body = await request.json();

    // Build update object with only provided fields
    const updateData = {};

    if (body.status) updateData.status = body.status;
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;

    // Update event
    const updatedEvent = await Event.findOneAndUpdate(
      { event_id: parseInt(id) },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log("Event partially updated:", id);

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

/**
 * PUT /api/organizer/events/[id]
 * Comprehensive update for all event fields including categories, tickets, and artists
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;

    // Get session and verify organizer
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organizer
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

    // Find event and verify ownership
    const event = await Event.findOne({ event_id: parseInt(id) });

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

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "title",
      "startDate",
      "endDate",
      "startTime",
      "saleStartDate",
      "saleEndDate",
      "venueName",
      "description",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            message: `Missing required field: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Helper function to convert time string (HH:mm) to Date object
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

    // Get order statistics to check sold tickets
    const orderStats = await Order.aggregate([
      {
        $match: {
          "order_items.event_id": parseInt(id),
          payment_status: "completed",
        },
      },
      { $unwind: "$order_items" },
      {
        $match: {
          "order_items.event_id": parseInt(id),
        },
      },
      {
        $group: {
          _id: "$order_items.ticket_type_id",
          tickets_sold: { $sum: "$order_items.quantity" },
        },
      },
    ]);

    // Create map of sold tickets by ticket_type_id
    const soldTicketsMap = {};
    orderStats.forEach((stat) => {
      soldTicketsMap[stat._id] = stat.tickets_sold;
    });

    // Process categories and tickets
    const processedCategories = [];
    if (body.categories && Array.isArray(body.categories)) {
      for (const category of body.categories) {
        const processedTickets = [];

        if (category.tickets && Array.isArray(category.tickets)) {
          for (const ticket of category.tickets) {
            const ticketTypeId = ticket.id;
            const soldCount = soldTicketsMap[ticketTypeId] || 0;

            // Validate: cannot reduce quantity below sold tickets
            if (ticket.quantity < soldCount) {
              return NextResponse.json(
                {
                  success: false,
                  message: `Cannot reduce quantity for ticket "${ticket.name}" below ${soldCount} (already sold)`,
                  field: `categories.${category.id}.tickets.${ticketTypeId}.quantity`,
                },
                { status: 400 }
              );
            }

            processedTickets.push({
              ticket_type_id: ticketTypeId,
              name: ticket.name,
              description: ticket.description || "",
              price: ticket.price,
              quantity_available: ticket.quantity,
              max_per_order: ticket.maxPerOrder || 10,
              banner: ticket.banner || null,
              pdf_template: ticket.pdfTemplate || null,
            });
          }
        }

        processedCategories.push({
          category_id: category.id,
          name: category.name,
          description: category.description || "",
          category_type: category.categoryType || category.type || "general",
          ticket_types: processedTickets,
        });
      }
    }

    // Process artists
    const processedArtists = [];
    if (body.eventArtists && Array.isArray(body.eventArtists)) {
      for (const artist of body.eventArtists) {
        processedArtists.push({
          artist_id: artist.artist_id,
          name: artist.name,
          bio: artist.bio || "",
          image: artist.image || null,
        });
      }
    }

    // Build comprehensive update object
    const updateData = {
      title: body.title,
      description: body.description,
      start_date: new Date(body.startDate),
      end_date: new Date(body.endDate),
      start_time: convertTimeToDate(body.startTime),
      venue_name: body.venueName,
      venue_address: body.venueAddress || "",
      city: body.city || "",
      map_link: body.mapLink || "",
      tickets_sale_start: new Date(body.saleStartDate),
      tickets_sale_end: new Date(body.saleEndDate),
      event_policy: body.eventPolicy || "",
      banner_image: body.bannerImage || null,
      genre_id: body.genreId ? parseInt(body.genreId) : null,
      location_id: body.locationId ? parseInt(body.locationId) : null,
      categories: processedCategories,
      artists: processedArtists,
    };

    // Only update status if explicitly provided and valid
    if (body.status) {
      const validStatuses = [
        "draft",
        "pending",
        "approved",
        "live",
        "completed",
        "cancelled",
      ];
      if (validStatuses.includes(body.status)) {
        updateData.status = body.status;
      }
    }

    // Perform update
    const updatedEvent = await Event.findOneAndUpdate(
      { event_id: parseInt(id) },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return NextResponse.json(
        { success: false, message: "Failed to update event" },
        { status: 500 }
      );
    }

    console.log("Event comprehensively updated:", id);

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      event: {
        id: updatedEvent.event_id,
        title: updatedEvent.title,
        status: updatedEvent.status,
        updated_at: updatedEvent.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating event:", error);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message,
          })),
        },
        { status: 422 }
      );
    }

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

/**
 * DELETE /api/organizer/events/[id]
 * Delete or cancel an event
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;

    // Get session and verify organizer
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organizer
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

    // Find event and verify ownership
    const event = await Event.findOne({ event_id: parseInt(id) });

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
          message: "You don't have permission to delete this event",
        },
        { status: 403 }
      );
    }

    // Check if event has orders
    const hasOrders = await Order.findOne({
      "order_items.event_id": parseInt(id),
      payment_status: "completed",
    });

    if (hasOrders) {
      // If event has orders, mark as cancelled instead of deleting
      event.status = "cancelled";
      await event.save();

      console.log("Event cancelled (has orders):", id);

      return NextResponse.json({
        success: true,
        message: "Event cancelled successfully",
        cancelled: true,
      });
    } else {
      // If no orders, safe to delete
      await Event.deleteOne({ event_id: parseInt(id) });

      // Update organizer's event count

      if (organizer) {
        organizer.event_count = (organizer.event_count || 0) - 1;
        await organizer.save();
      }

      console.log("Event deleted:", id);

      return NextResponse.json({
        success: true,
        message: "Event deleted successfully",
        deleted: true,
      });
    }
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete event",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
