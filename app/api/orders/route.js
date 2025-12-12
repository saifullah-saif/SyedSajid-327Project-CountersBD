import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { Order, Event, User } from "@/model/model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

/**
 * @route GET /api/orders
 * @description Fetch orders for the authenticated user
 * @query {string} status - Filter by payment status (pending, completed, failed, refunded)
 */
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const orderId = searchParams.get("order_id");

    // Allow non-authenticated access for order lookup by order_id
    // This enables order status checking without requiring authentication
    if (orderId) {
      // Direct order lookup without session requirement
      const order = await Order.findOne({ order_id: parseInt(orderId) })
        .sort({ created_at: -1 })
        .select(
          "order_id total_amount payment_status payment_method transaction_id order_items attendee_info created_at"
        )
        .lean();

      if (!order) {
        return NextResponse.json(
          {
            success: false,
            error: "Order not found",
          },
          { status: 404 }
        );
      }

      // Format the order
      const formattedOrder = {
        ...order,
        _id: order._id.toString(),
        total_amount: order.total_amount
          ? parseFloat(order.total_amount.toString())
          : 0,
        order_items: order.order_items.map((item) => ({
          ...item,
          unit_price: item.unit_price
            ? parseFloat(item.unit_price.toString())
            : 0,
        })),
      };

      return NextResponse.json({
        success: true,
        count: 1,
        orders: [formattedOrder],
      });
    }

    // For other queries, require authentication
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

    // CRITICAL FIX: Handle both accountId and account_id for session compatibility
    const accountId = session.user.accountId || session.user.account_id;

    // Find user by account_id from session
    const user = await User.findOne({
      account_id: accountId,
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

    // Build query
    const query = { user_id: user.user_id };
    if (status) {
      query.payment_status = status;
    }

    // Fetch orders
    const orders = await Order.find(query)
      .sort({ created_at: -1 })
      .select(
        "order_id total_amount payment_status payment_method transaction_id order_items attendee_info created_at"
      )
      .lean();

    // Convert Decimal128 to numbers
    const formattedOrders = orders.map((order) => ({
      ...order,
      _id: order._id.toString(),
      total_amount: order.total_amount
        ? parseFloat(order.total_amount.toString())
        : 0,
      order_items: order.order_items.map((item) => ({
        ...item,
        unit_price: item.unit_price
          ? parseFloat(item.unit_price.toString())
          : 0,
      })),
    }));

    return NextResponse.json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch orders",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @route POST /api/orders
 * @description Create a new order with attendee information and order items
 * @body {number} eventId - Event ID
 * @body {array} orderItems - Array of order items [{ticket_type_id, quantity, unit_price}]
 * @body {array} attendeeInfo - Array of attendee information [{ticket_type_id, attendee_name, attendee_email, attendee_phone}]
 *
 * @body {string} paymentMethod - Payment method (optional)
 */
export async function POST(request) {
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
    const { eventId, orderItems, attendeeInfo, paymentMethod } = body;

    // Validation
    if (!eventId) {
      return NextResponse.json(
        {
          success: false,
          error: "Event ID is required",
        },
        { status: 400 }
      );
    }

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Order items are required",
        },
        { status: 400 }
      );
    }

    if (
      !attendeeInfo ||
      !Array.isArray(attendeeInfo) ||
      attendeeInfo.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendee information is required",
        },
        { status: 400 }
      );
    }

    console.log(session);
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

    // Verify event exists and get ticket type information
    const event = await Event.findOne({ event_id: parseInt(eventId) }).select(
      "event_id categories"
    );

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 }
      );
    }

    // Validate ticket types and prices
    const ticketTypeMap = new Map();
    event.categories.forEach((category) => {
      category.ticket_types.forEach((ticketType) => {
        ticketTypeMap.set(ticketType.ticket_type_id, {
          price: parseFloat(ticketType.price.toString()),
          quantityAvailable: ticketType.quantity_available,
          maxPerOrder: ticketType.max_per_order,
        });
      });
    });

    // Validate order items
    for (const item of orderItems) {
      const ticketInfo = ticketTypeMap.get(item.ticket_type_id);
      if (!ticketInfo) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid ticket type ID: ${item.ticket_type_id}`,
          },
          { status: 400 }
        );
      }

      // Validate price matches
      const itemPrice = parseFloat(item.unit_price);
      if (Math.abs(itemPrice - ticketInfo.price) > 0.01) {
        return NextResponse.json(
          {
            success: false,
            error: `Price mismatch for ticket type ${item.ticket_type_id}`,
          },
          { status: 400 }
        );
      }

      // Validate quantity
      if (item.quantity > ticketInfo.maxPerOrder) {
        return NextResponse.json(
          {
            success: false,
            error: `Quantity exceeds maximum allowed per order for ticket type ${item.ticket_type_id}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate attendee info
    for (const info of attendeeInfo) {
      if (
        !info.ticket_type_id ||
        !info.attendee_name ||
        !info.attendee_email ||
        !info.attendee_phone
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "All attendee information fields are required",
          },
          { status: 400 }
        );
      }
    }

    // Generate unique order_id
    const lastOrder = await Order.findOne()
      .sort({ order_id: -1 })
      .select("order_id");
    const newOrderId = lastOrder ? lastOrder.order_id + 1 : 1;

    // Calculate total amount
    const subtotal = orderItems.reduce(
      (sum, item) => sum + parseFloat(item.unit_price) * item.quantity,
      0
    );

    const totalAmount = subtotal;

    // Generate order_item_id for each item
    const formattedOrderItems = orderItems.map((item, index) => ({
      order_item_id: newOrderId * 1000 + index + 1,
      ticket_type_id: item.ticket_type_id,
      event_id: parseInt(eventId),
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    // Create order
    const newOrder = new Order({
      order_id: newOrderId,
      user_id: user.user_id,
      total_amount: totalAmount,

      payment_status: "pending",
      payment_method: paymentMethod || null,
      transaction_id: null,
      order_items: formattedOrderItems,
      attendee_info: attendeeInfo.map((info) => ({
        ticket_type_id: info.ticket_type_id,
        attendee_name: info.attendee_name,
        attendee_email: info.attendee_email,
        attendee_phone: info.attendee_phone,
      })),
    });

    await newOrder.save();

    // Convert Decimal128 to numbers for response
    const savedOrder = newOrder.toObject();
    savedOrder.total_amount = parseFloat(savedOrder.total_amount.toString());

    savedOrder.order_items = savedOrder.order_items.map((item) => ({
      ...item,
      unit_price: parseFloat(item.unit_price.toString()),
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: savedOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
