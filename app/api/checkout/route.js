import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { Order, Event, User, Location, Genre } from "@/model/model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

/**
 * @route GET /api/checkout
 * @description Fetch checkout data for the authenticated user
 * @query {string} eventId - Optional: Filter by specific event
 * @returns Pending orders with event details, ticket information, and attendee data
 */
export async function GET(request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please log in to access checkout",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const eventId = searchParams.get("eventId");

    // Find user by account_id from session
    const user = await User.findOne({
      account_id: session.user.accountId,
    }).select("user_id first_name last_name");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Build base query for pending orders
    const matchQuery = {
      user_id: user.user_id,
      payment_status: "pending",
    };

    // Scenario 1: Single Order Checkout (orderId provided)
    if (orderId) {
      matchQuery.order_id = parseInt(orderId);
    }

    // Fetch checkout data with aggregation for optimal performance
    const checkoutData = await Order.aggregate([
      {
        $match: matchQuery,
      },
      {
        $unwind: "$order_items",
      },
      // Scenario 2: Single Event Checkout (eventId provided)
      // Filter order items by eventId if provided
      ...(eventId
        ? [
            {
              $match: {
                "order_items.event_id": parseInt(eventId),
              },
            },
          ]
        : []),
      {
        $lookup: {
          from: "events",
          localField: "order_items.event_id",
          foreignField: "event_id",
          as: "eventData",
        },
      },
      {
        $unwind: "$eventData",
      },
      {
        $lookup: {
          from: "locations",
          localField: "eventData.location_id",
          foreignField: "location_id",
          as: "locationData",
        },
      },
      {
        $unwind: {
          path: "$locationData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "genres",
          localField: "eventData.genre_id",
          foreignField: "genre_id",
          as: "genreData",
        },
      },
      {
        $unwind: {
          path: "$genreData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          // Order Information
          order_id: 1,
          total_amount: 1,
          additional_fees: 1,
          payment_status: 1,
          payment_method: 1,
          created_at: 1,

          // Order Item Details
          order_item_id: "$order_items.order_item_id",
          ticket_type_id: "$order_items.ticket_type_id",
          event_id: "$order_items.event_id",
          quantity: "$order_items.quantity",
          unit_price: "$order_items.unit_price",

          // Event Information (only necessary fields)
          eventTitle: "$eventData.title",
          eventDescription: "$eventData.description",
          eventStartDate: "$eventData.start_date",
          eventEndDate: "$eventData.end_date",
          eventStartTime: "$eventData.start_time",
          eventBannerImage: "$eventData.banner_image",
          eventVenueName: "$eventData.venue_name",
          eventPolicy: "$eventData.event_policy",
          eventStatus: "$eventData.status",

          // Location Information
          locationCity: "$locationData.city",
          locationVenueName: "$locationData.venue_name",
          locationAddress: "$locationData.address",
          locationMapLink: "$locationData.map_link",

          // Genre Information
          genreName: "$genreData.name",

          // Event Categories and Ticket Types
          categories: "$eventData.categories",

          // Attendee Information for this order
          attendee_info: {
            $filter: {
              input: "$attendee_info",
              as: "attendee",
              cond: {
                $eq: [
                  "$$attendee.ticket_type_id",
                  "$order_items.ticket_type_id",
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            order_id: "$order_id",
            event_id: "$event_id",
          },
          order_id: { $first: "$order_id" },
          total_amount: { $first: "$total_amount" },
          additional_fees: { $first: "$additional_fees" },
          payment_status: { $first: "$payment_status" },
          payment_method: { $first: "$payment_method" },
          created_at: { $first: "$created_at" },

          // Event Details
          eventTitle: { $first: "$eventTitle" },
          eventDescription: { $first: "$eventDescription" },
          eventStartDate: { $first: "$eventStartDate" },
          eventEndDate: { $first: "$eventEndDate" },
          eventStartTime: { $first: "$eventStartTime" },
          eventBannerImage: { $first: "$eventBannerImage" },
          eventVenueName: { $first: "$eventVenueName" },
          eventPolicy: { $first: "$eventPolicy" },
          eventStatus: { $first: "$eventStatus" },

          // Location
          locationCity: { $first: "$locationCity" },
          locationVenueName: { $first: "$locationVenueName" },
          locationAddress: { $first: "$locationAddress" },
          locationMapLink: { $first: "$locationMapLink" },

          // Genre
          genreName: { $first: "$genreName" },

          // Categories
          categories: { $first: "$categories" },

          // Aggregated order items
          order_items: {
            $push: {
              order_item_id: "$order_item_id",
              ticket_type_id: "$ticket_type_id",
              event_id: "$event_id",
              quantity: "$quantity",
              unit_price: "$unit_price",
              attendee_info: "$attendee_info",
            },
          },
        },
      },
      {
        $sort: { created_at: -1 },
      },
    ]);

    // Process and format the results
    const formattedCheckoutData = checkoutData.map((item) => {
      // Extract ticket type details from categories
      const ticketTypesMap = new Map();
      item.categories?.forEach((category) => {
        category.ticket_types?.forEach((ticketType) => {
          ticketTypesMap.set(ticketType.ticket_type_id, {
            name: ticketType.name,
            description: ticketType.description,
            categoryName: category.name,
            categoryType: category.category_type,
          });
        });
      });

      // Enhance order items with ticket type details
      const enhancedOrderItems = item.order_items.map((orderItem) => {
        const ticketDetails = ticketTypesMap.get(orderItem.ticket_type_id) || {
          name: "Unknown Ticket",
          description: "",
          categoryName: "General",
          categoryType: "",
        };

        return {
          order_item_id: orderItem.order_item_id,
          ticket_type_id: orderItem.ticket_type_id,
          event_id: orderItem.event_id,
          quantity: orderItem.quantity,
          unit_price: orderItem.unit_price
            ? parseFloat(orderItem.unit_price.toString())
            : 0,
          ticketName: ticketDetails.name,
          ticketDescription: ticketDetails.description,
          categoryName: ticketDetails.categoryName,
          categoryType: ticketDetails.categoryType,
          subtotal:
            orderItem.quantity *
            (orderItem.unit_price
              ? parseFloat(orderItem.unit_price.toString())
              : 0),
          attendee_info: orderItem.attendee_info || [],
        };
      });

      return {
        order_id: item.order_id,
        total_amount: item.total_amount
          ? parseFloat(item.total_amount.toString())
          : 0,
        additional_fees: item.additional_fees
          ? parseFloat(item.additional_fees.toString())
          : 0,
        payment_status: item.payment_status,
        payment_method: item.payment_method,
        created_at: item.created_at,

        // Event information
        event: {
          event_id: item._id.event_id,
          title: item.eventTitle,
          description: item.eventDescription,
          start_date: item.eventStartDate,
          end_date: item.eventEndDate,
          start_time: item.eventStartTime,
          banner_image: item.eventBannerImage,
          venue_name: item.eventVenueName,
          policy: item.eventPolicy,
          status: item.eventStatus,
          location: {
            city: item.locationCity,
            venue_name: item.locationVenueName,
            address: item.locationAddress,
            map_link: item.locationMapLink,
          },
          genre: item.genreName,
        },

        // Enhanced order items
        order_items: enhancedOrderItems,

        // User information
        user: {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      };
    });

    // Calculate summary statistics
    const summary = {
      total_orders: formattedCheckoutData.length,
      total_items: formattedCheckoutData.reduce(
        (sum, order) =>
          sum +
          order.order_items.reduce(
            (itemSum, item) => itemSum + item.quantity,
            0
          ),
        0
      ),
      grand_total: formattedCheckoutData.reduce(
        (sum, order) => sum + order.total_amount,
        0
      ),
    };

    return NextResponse.json({
      success: true,
      data: formattedCheckoutData,
      summary,
    });
  } catch (error) {
    console.error("Error fetching checkout data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch checkout data",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @route POST /api/checkout
 * @description Complete checkout directly by updating order status and generating tickets
 * @body {number} orderId - Order ID to process
 * @body {string} paymentMethod - Payment method (defaults to "direct")
 * @body {object} billingInfo - Billing information (optional)
 * @returns Order completion status, transaction ID, and ticket generation results
 */
export async function POST(request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please log in to checkout",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, paymentMethod, billingInfo } = body;

    // Validation
    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

    // Find user by account_id from session
    const user = await User.findOne({
      account_id: session.user.accountId,
    }).select("user_id first_name last_name phone_number");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Find the order and verify ownership
    const order = await Order.findOne({
      order_id: parseInt(orderId),
      user_id: user.user_id,
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found or unauthorized",
        },
        { status: 404 }
      );
    }

    // Verify order is still pending
    if (order.payment_status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Order is already ${order.payment_status}`,
        },
        { status: 400 }
      );
    }

    // Verify all order items are still available
    for (const orderItem of order.order_items) {
      const event = await Event.findOne({
        event_id: orderItem.event_id,
      }).select("categories status");

      if (!event || event.status === "cancelled") {
        return NextResponse.json(
          {
            success: false,
            error: "Event is no longer available",
          },
          { status: 400 }
        );
      }

      // Check ticket availability
      let ticketFound = false;
      let ticketAvailable = false;

      event.categories.forEach((category) => {
        const ticketType = category.ticket_types.find(
          (tt) => tt.ticket_type_id === orderItem.ticket_type_id
        );
        if (ticketType) {
          ticketFound = true;
          if (ticketType.quantity_available >= orderItem.quantity) {
            ticketAvailable = true;
          }
        }
      });

      if (!ticketFound) {
        return NextResponse.json(
          {
            success: false,
            error: `Ticket type ${orderItem.ticket_type_id} is no longer available`,
          },
          { status: 400 }
        );
      }

      if (!ticketAvailable) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient tickets available for ticket type ${orderItem.ticket_type_id}`,
          },
          { status: 400 }
        );
      }
    }

    // Update order with payment method and mark as completed
    if (paymentMethod) {
      order.payment_method = paymentMethod;
    }

    // Direct checkout: Update order status to completed and reduce ticket inventory
    order.payment_status = "completed";
    order.transaction_id = `DIR-${Date.now()}-${order.order_id}`; // Generate transaction ID

    // Reduce ticket quantities for all order items
    for (const orderItem of order.order_items) {
      const event = await Event.findOne({
        event_id: orderItem.event_id,
      });

      if (event) {
        event.categories.forEach((category) => {
          const ticketType = category.ticket_types.find(
            (tt) => tt.ticket_type_id === orderItem.ticket_type_id
          );
          if (ticketType) {
            ticketType.quantity_available = Math.max(
              0,
              ticketType.quantity_available - orderItem.quantity
            );
          }
        });

        await event.save();
      }
    }

    await order.save();

    // Import ticket generation service
    const { generateTicketsForOrder } = await import(
      "@/lib/ticketGenerationService"
    );

    // Generate tickets immediately after order completion
    let ticketResult = { success: false, tickets: [], error: null };
    try {
      ticketResult = await generateTicketsForOrder(order.order_id);

      if (!ticketResult.success) {
        console.error("Failed to generate tickets:", ticketResult.error);
        // Continue even if ticket generation fails - user can retry later
      }
    } catch (ticketError) {
      console.error("Error generating tickets:", ticketError);
      ticketResult.error = ticketError.message;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order completed successfully",
        data: {
          order_id: order.order_id,
          payment_status: "completed",
          transaction_id: order.transaction_id,
          tickets_generated: ticketResult.success,
          ticket_count: ticketResult.tickets?.length || 0,
          ticket_generation_error: ticketResult.error,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create checkout session",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @route PATCH /api/checkout
 * @description Update checkout session or order details
 * @body {number} orderId - Order ID to update
 * @body {string} paymentMethod - Payment method to update
 * @body {string} paymentStatus - Payment status to update (pending, completed, failed)
 * @body {string} transactionId - Transaction ID to set
 * @returns Updated order details
 */
export async function PATCH(request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please log in",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, paymentMethod, paymentStatus, transactionId } = body;

    // Validation
    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

    // Find user by account_id from session
    const user = await User.findOne({
      account_id: session.user.accountId,
    }).select("user_id");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Find the order and verify ownership
    const order = await Order.findOne({
      order_id: parseInt(orderId),
      user_id: user.user_id,
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found or unauthorized",
        },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (paymentMethod) {
      order.payment_method = paymentMethod;
    }

    if (paymentStatus) {
      // Validate payment status
      const validStatuses = ["pending", "completed", "failed", "refunded"];
      if (!validStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid payment status. Must be one of: ${validStatuses.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }

      // If marking as completed, reduce ticket quantities
      if (
        paymentStatus === "completed" &&
        order.payment_status !== "completed"
      ) {
        // Reduce ticket quantities for all order items
        for (const orderItem of order.order_items) {
          const event = await Event.findOne({
            event_id: orderItem.event_id,
          });

          if (event) {
            event.categories.forEach((category) => {
              const ticketType = category.ticket_types.find(
                (tt) => tt.ticket_type_id === orderItem.ticket_type_id
              );
              if (ticketType) {
                ticketType.quantity_available = Math.max(
                  0,
                  ticketType.quantity_available - orderItem.quantity
                );
              }
            });

            await event.save();
          }
        }
      }

      order.payment_status = paymentStatus;
    }

    if (transactionId) {
      order.transaction_id = transactionId;
    }

    await order.save();

    // Format response
    const formattedOrder = {
      order_id: order.order_id,
      total_amount: order.total_amount
        ? parseFloat(order.total_amount.toString())
        : 0,
      additional_fees: order.additional_fees
        ? parseFloat(order.additional_fees.toString())
        : 0,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      transaction_id: order.transaction_id,
      order_items: order.order_items.map((item) => ({
        ...item,
        unit_price: item.unit_price
          ? parseFloat(item.unit_price.toString())
          : 0,
      })),
      attendee_info: order.attendee_info,
      created_at: order.created_at,
    };

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      data: formattedOrder,
    });
  } catch (error) {
    console.error("Error updating checkout session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update checkout session",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @route DELETE /api/checkout
 * @description Cancel/delete a pending checkout order
 * @query {string} orderId - Order ID to cancel
 * @returns Success message
 */
export async function DELETE(request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please log in",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    // Validation
    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

    // Find user by account_id from session
    const user = await User.findOne({
      account_id: session.user.accountId,
    }).select("user_id");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Find the order and verify ownership
    const order = await Order.findOne({
      order_id: parseInt(orderId),
      user_id: user.user_id,
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found or unauthorized",
        },
        { status: 404 }
      );
    }

    // Only allow deletion of pending orders
    if (order.payment_status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete order with status: ${order.payment_status}`,
        },
        { status: 400 }
      );
    }

    // Delete the order
    await Order.deleteOne({ order_id: parseInt(orderId) });

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        order_id: parseInt(orderId),
      },
    });
  } catch (error) {
    console.error("Error cancelling checkout order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel order",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
