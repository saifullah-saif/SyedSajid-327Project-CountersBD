import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import dbConnect from "@/lib/mongo";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route.js";

// Import models with proper schema registration
import { Ticket, Order, User } from "@/model/model";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get models helper
const getModels = () => {
  return {
    Ticket,
    Order,
    User,
  };
};

/**
 * @route GET /api/tickets/download?ticketId={id}
 * @description Download ticket PDF from Supabase storage
 * @query {number} ticketId - Ticket ID to download
 * @returns PDF file
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

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket ID is required",
        },
        { status: 400 }
      );
    }

    const { Ticket, Order, User } = getModels();

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

    // Find ticket
    const ticket = await Ticket.findOne({
      ticket_id: parseInt(ticketId),
    });

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket not found",
        },
        { status: 404 }
      );
    }

    // Verify ticket belongs to user
    const order = await Order.findOne({
      order_id: ticket.order_id,
      user_id: user.user_id,
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Ticket does not belong to you",
        },
        { status: 403 }
      );
    }

    // Check if PDF exists
    if (!ticket.user_ticketpdf) {
      return NextResponse.json(
        {
          success: false,
          error: "PDF not available for this ticket",
        },
        { status: 404 }
      );
    }

    // Download PDF from Supabase storage
    const { data, error } = await supabase.storage
      .from("assets")
      .download(ticket.user_ticketpdf);

    if (error) {
      console.error("Error downloading PDF from Supabase:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to download PDF",
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Convert blob to array buffer
    const arrayBuffer = await data.arrayBuffer();

    // Return PDF file
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ticket-${ticketId}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error downloading ticket PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to download ticket PDF",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
