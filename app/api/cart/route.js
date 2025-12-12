import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { Order, Event, User } from "@/model/model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

/**
 * @route GET /api/cart
 * @description Fetch all pending orders (cart items) for the authenticated user
 * @returns Cart items grouped by event with essential fields only
 */
export async function GET(request) {
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

    // Fetch pending orders (cart items) with minimal necessary fields
    const pendingOrders = await Order.aggregate([
      {
        $match: {
          user_id: user.user_id,
          payment_status: "pending",
        },
      },
      {
        $unwind: "$order_items",
      },
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
        $unwind: { path: "$locationData", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          order_id: 1,
          order_item_id: "$order_items.order_item_id",
          ticket_type_id: "$order_items.ticket_type_id",
          event_id: "$order_items.event_id",
          quantity: "$order_items.quantity",
          unit_price: "$order_items.unit_price",
          eventTitle: "$eventData.title",
          eventDate: "$eventData.start_date",
          eventImage: "$eventData.banner_image",
          venue: "$eventData.venue_name",
          city: "$locationData.city",
          categories: "$eventData.categories",
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
        $addFields: {
          ticketTypeName: {
            $reduce: {
              input: "$categories",
              initialValue: null,
              in: {
                $cond: {
                  if: { $ne: ["$$value", null] },
                  then: "$$value",
                  else: {
                    $let: {
                      vars: {
                        foundTicket: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$$this.ticket_types",
                                as: "ticket",
                                cond: {
                                  $eq: [
                                    "$$ticket.ticket_type_id",
                                    "$ticket_type_id",
                                  ],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: "$$foundTicket.name",
                    },
                  },
                },
              },
            },
          },
          categoryName: {
            $reduce: {
              input: "$categories",
              initialValue: null,
              in: {
                $cond: {
                  if: { $ne: ["$$value", null] },
                  then: "$$value",
                  else: {
                    $let: {
                      vars: {
                        hasTicket: {
                          $anyElementTrue: {
                            $map: {
                              input: "$$this.ticket_types",
                              as: "ticket",
                              in: {
                                $eq: [
                                  "$$ticket.ticket_type_id",
                                  "$ticket_type_id",
                                ],
                              },
                            },
                          },
                        },
                      },
                      in: {
                        $cond: {
                          if: "$$hasTicket",
                          then: "$$this.name",
                          else: null,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          categories: 0,
        },
      },
      {
        $sort: { "eventData.start_date": 1 },
      },
    ]);

    // Convert Decimal128 to numbers
    const formattedCart = pendingOrders.map((item) => ({
      order_id: item.order_id,
      order_item_id: item.order_item_id,
      ticket_type_id: item.ticket_type_id,
      event_id: item.event_id,
      quantity: item.quantity,
      price: item.unit_price ? parseFloat(item.unit_price.toString()) : 0,
      ticketType: item.ticketTypeName || "Unknown Ticket",
      category: item.categoryName || "General",
      eventTitle: item.eventTitle,
      eventDate: item.eventDate,
      eventImage: item.eventImage,
      venue: item.venue,
      city: item.city,
      attendeeInfo: item.attendee_info || [],
    }));

    return NextResponse.json({
      success: true,
      count: formattedCart.length,
      data: formattedCart,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch cart",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @route POST /api/cart
 * @description Add item to cart (create or update pending order)
 * @body {number} eventId - Event ID
 * @body {number} ticketTypeId - Ticket type ID
 * @body {number} quantity - Quantity to add
 * @body {string} category - Category name
 * @body {object} attendeeInfo - Attendee information {name, email, phone}
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
    const { eventId, ticketTypeId, quantity, category, attendeeInfo } = body;

    // Validation
    if (!eventId || !ticketTypeId || !quantity) {
      return NextResponse.json(
        {
          success: false,
          error: "Event ID, ticket type ID, and quantity are required",
        },
        { status: 400 }
      );
    }

    if (
      !attendeeInfo ||
      !attendeeInfo.name ||
      !attendeeInfo.email ||
      !attendeeInfo.phone
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendee information (name, email, phone) is required",
        },
        { status: 400 }
      );
    }

    // Find user by account_id
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

    // Verify event and get ticket type price
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

    // Find ticket type and price
    let ticketPrice = null;
    let maxPerOrder = 10;

    for (const cat of event.categories) {
      const ticketType = cat.ticket_types.find(
        (tt) => tt.ticket_type_id === parseInt(ticketTypeId)
      );
      if (ticketType) {
        ticketPrice = parseFloat(ticketType.price.toString());
        maxPerOrder = ticketType.max_per_order;
        break;
      }
    }

    if (!ticketPrice) {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket type not found",
        },
        { status: 404 }
      );
    }

    // Check if user has a pending order
    let pendingOrder = await Order.findOne({
      user_id: user.user_id,
      payment_status: "pending",
    });

    if (pendingOrder) {
      // Check if this ticket type already exists in the order
      const existingItemIndex = pendingOrder.order_items.findIndex(
        (item) =>
          item.event_id === parseInt(eventId) &&
          item.ticket_type_id === parseInt(ticketTypeId)
      );

      if (existingItemIndex >= 0) {
        // Update quantity
        const newQuantity =
          pendingOrder.order_items[existingItemIndex].quantity + quantity;

        if (newQuantity > maxPerOrder) {
          return NextResponse.json(
            {
              success: false,
              error: `Maximum ${maxPerOrder} tickets allowed per order`,
            },
            { status: 400 }
          );
        }

        pendingOrder.order_items[existingItemIndex].quantity = newQuantity;

        // Add attendee info for additional tickets
        for (let i = 0; i < quantity; i++) {
          pendingOrder.attendee_info.push({
            ticket_type_id: parseInt(ticketTypeId),
            attendee_name: attendeeInfo.name,
            attendee_email: attendeeInfo.email,
            attendee_phone: attendeeInfo.phone,
          });
        }
      } else {
        // Add new order item
        const newOrderItemId =
          Math.max(...pendingOrder.order_items.map((i) => i.order_item_id)) + 1;

        pendingOrder.order_items.push({
          order_item_id: newOrderItemId,
          ticket_type_id: parseInt(ticketTypeId),
          event_id: parseInt(eventId),
          quantity: quantity,
          unit_price: ticketPrice,
        });

        // Add attendee info for each ticket
        for (let i = 0; i < quantity; i++) {
          pendingOrder.attendee_info.push({
            ticket_type_id: parseInt(ticketTypeId),
            attendee_name: attendeeInfo.name,
            attendee_email: attendeeInfo.email,
            attendee_phone: attendeeInfo.phone,
          });
        }
      }

      // Recalculate total
      const subtotal = pendingOrder.order_items.reduce(
        (sum, item) =>
          sum + parseFloat(item.unit_price.toString()) * item.quantity,
        0
      );
      const fees = subtotal * 0.15;
      pendingOrder.total_amount = subtotal + fees;
      pendingOrder.additional_fees = fees;

      await pendingOrder.save();
    } else {
      // Create new pending order
      const lastOrder = await Order.findOne()
        .sort({ order_id: -1 })
        .select("order_id");
      const newOrderId = lastOrder ? lastOrder.order_id + 1 : 1;

      const subtotal = ticketPrice * quantity;
      const fees = subtotal * 0.15;

      const attendeeInfoArray = [];
      for (let i = 0; i < quantity; i++) {
        attendeeInfoArray.push({
          ticket_type_id: parseInt(ticketTypeId),
          attendee_name: attendeeInfo.name,
          attendee_email: attendeeInfo.email,
          attendee_phone: attendeeInfo.phone,
        });
      }

      pendingOrder = new Order({
        order_id: newOrderId,
        user_id: user.user_id,
        total_amount: subtotal + fees,
        additional_fees: fees,
        payment_status: "pending",
        order_items: [
          {
            order_item_id: 1,
            ticket_type_id: parseInt(ticketTypeId),
            event_id: parseInt(eventId),
            quantity: quantity,
            unit_price: ticketPrice,
          },
        ],
        attendee_info: attendeeInfoArray,
      });

      await pendingOrder.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Item added to cart successfully",
        data: {
          order_id: pendingOrder.order_id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add to cart",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @route DELETE /api/cart
 * @description Remove item from cart (delete order item and associated attendee info)
 * @query {number} orderId - Order ID
 * @query {number} orderItemId - Order item ID to remove
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
    const orderItemId = searchParams.get("orderItemId");

    if (!orderId || !orderItemId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID and Order Item ID are required",
        },
        { status: 400 }
      );
    }

    // Find user
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

    // Find order
    const order = await Order.findOne({
      order_id: parseInt(orderId),
      user_id: user.user_id,
      payment_status: "pending",
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    // Find the order item to remove
    const orderItem = order.order_items.find(
      (item) => item.order_item_id === parseInt(orderItemId)
    );

    if (!orderItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Order item not found",
        },
        { status: 404 }
      );
    }

    // Remove attendee info associated with this ticket type
    order.attendee_info = order.attendee_info.filter(
      (info) => info.ticket_type_id !== orderItem.ticket_type_id
    );

    // Remove order item
    order.order_items = order.order_items.filter(
      (item) => item.order_item_id !== parseInt(orderItemId)
    );

    // If no items left, delete the order
    if (order.order_items.length === 0) {
      await Order.deleteOne({ order_id: parseInt(orderId) });
      return NextResponse.json({
        success: true,
        message: "Cart item removed and order deleted",
      });
    }

    // Recalculate total
    const subtotal = order.order_items.reduce(
      (sum, item) =>
        sum + parseFloat(item.unit_price.toString()) * item.quantity,
      0
    );
    const fees = subtotal * 0.15;
    order.total_amount = subtotal + fees;
    order.additional_fees = fees;

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Cart item removed successfully",
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove from cart",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @route PATCH /api/cart
 * @description Update quantity of cart item
 * @body {number} orderId - Order ID
 * @body {number} orderItemId - Order item ID
 * @body {number} quantity - New quantity
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
    const { orderId, orderItemId, quantity } = body;

    if (!orderId || !orderItemId || !quantity) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID, Order Item ID, and quantity are required",
        },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Quantity must be at least 1",
        },
        { status: 400 }
      );
    }

    // Find user
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

    // Find order
    const order = await Order.findOne({
      order_id: parseInt(orderId),
      user_id: user.user_id,
      payment_status: "pending",
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    // Find order item
    const orderItemIndex = order.order_items.findIndex(
      (item) => item.order_item_id === parseInt(orderItemId)
    );

    if (orderItemIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Order item not found",
        },
        { status: 404 }
      );
    }

    const orderItem = order.order_items[orderItemIndex];
    const oldQuantity = orderItem.quantity;
    const ticketTypeId = orderItem.ticket_type_id;

    // Get max per order from event
    const event = await Event.findOne({
      event_id: orderItem.event_id,
    }).select("categories");

    let maxPerOrder = 10;
    for (const cat of event.categories) {
      const ticketType = cat.ticket_types.find(
        (tt) => tt.ticket_type_id === ticketTypeId
      );
      if (ticketType) {
        maxPerOrder = ticketType.max_per_order;
        break;
      }
    }

    if (quantity > maxPerOrder) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${maxPerOrder} tickets allowed per order`,
        },
        { status: 400 }
      );
    }

    // Update quantity
    order.order_items[orderItemIndex].quantity = quantity;

    // Adjust attendee info count
    const attendeeInfoForTicket = order.attendee_info.filter(
      (info) => info.ticket_type_id === ticketTypeId
    );

    if (quantity > oldQuantity) {
      // Add more attendee info (use the first existing one as template)
      const template = attendeeInfoForTicket[0] || {
        attendee_name: "Guest",
        attendee_email: "guest@example.com",
        attendee_phone: "0000000000",
      };

      for (let i = 0; i < quantity - oldQuantity; i++) {
        order.attendee_info.push({
          ticket_type_id: ticketTypeId,
          attendee_name: template.attendee_name,
          attendee_email: template.attendee_email,
          attendee_phone: template.attendee_phone,
        });
      }
    } else if (quantity < oldQuantity) {
      // Remove excess attendee info
      const removeCount = oldQuantity - quantity;
      let removed = 0;

      order.attendee_info = order.attendee_info.filter((info) => {
        if (info.ticket_type_id === ticketTypeId && removed < removeCount) {
          removed++;
          return false;
        }
        return true;
      });
    }

    // Recalculate total
    const subtotal = order.order_items.reduce(
      (sum, item) =>
        sum + parseFloat(item.unit_price.toString()) * item.quantity,
      0
    );
    const fees = subtotal * 0.15;
    order.total_amount = subtotal + fees;
    order.additional_fees = fees;

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Cart item quantity updated successfully",
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update cart quantity",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
