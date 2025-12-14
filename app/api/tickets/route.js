import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import mongoose from "mongoose";
import { generateTicketsForOrder } from "@/lib/ticketGenerationService";

// Import models with proper schema registration
// CRITICAL: This ensures models are registered before use in serverless environment
import { Order, Event, Ticket } from "@/model/model";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get models helper - now safely returns already-registered models
const getModels = () => {
  return {
    Order,
    Event,
    Ticket,
  };
};

/**
 * Generate a unique 12-character URL-encoded pass ID
 * Contains eventId, ticketId, ticketTypeId encoded in a compact format
 */
function generatepassId(eventId, ticketId, ticketTypeId) {
  // Create a compact string with event, ticket, and type IDs
  const dataString = `${eventId}-${ticketId}-${ticketTypeId}`;

  // Create a hash-like string using base36 encoding for compactness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);

  // Combine and ensure it's exactly 12 characters
  let passId = (timestamp + random).substring(0, 12).toUpperCase();

  // Ensure uniqueness by adding event/ticket info if needed
  if (passId.length < 12) {
    const padding = (eventId.toString() + ticketId.toString()).substring(
      0,
      12 - passId.length
    );
    passId += padding;
  }

  // URL encode for safe transmission
  return encodeURIComponent(passId);
}

/**
 * Generate PDF ticket using template and ticket data
 */
async function generateTicketPDF(ticket, event, ticketType, categoryName) {
  try {
    // Get PDF template from Supabase storage
    const templatePath = "ticket-type-pdf-templates/default-template.pdf";
    // ticketType.pdf_template ||

    const { data: templateData, error: downloadError } = await supabase.storage
      .from("assets")
      .download(templatePath);

    if (downloadError) {
      console.error("Error downloading PDF template:", downloadError);
      throw new Error("Failed to download PDF template");
    }

    // Convert blob to array buffer
    const templateBuffer = await templateData.arrayBuffer();

    // Load the PDF template
    const pdfDoc = await PDFDocument.load(templateBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Get page dimensions
    const { height } = firstPage.getSize();

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add event name
    // firstPage.drawText(event.title || "Event", {
    //   x: 130,
    //   y: height - 260,
    //   size: 12,
    //   font: boldFont,
    //   color: rgb(0, 0, 0),
    // });

    // Add ticket category and type
    firstPage.drawText(
      `${categoryName || "Category"} - ${ticketType.name || "Ticket"}`,
      {
        x: 130,
        y: height - 291,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      }
    );

    // Add attendee information
    firstPage.drawText(ticket.attendee_name || "N/A", {
      x: 90,
      y: height - 621,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(ticket.attendee_email || "N/A", {
      x: 90,
      y: height - 639,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(ticket.attendee_phone || "N/A", {
      x: 90,
      y: height - 657,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Add event policy (terms & conditions) if available
    if (event.event_policy) {
      const policyLines = splitTextIntoLines(event.event_policy, 60);
      policyLines.slice(0, 5).forEach((line, index) => {
        firstPage.drawText(line, {
          x: 50,
          y: height - 350 - index * 15,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
      });
    }

    // Add pass ID text
    firstPage.drawText("Pass ID:", {
      x: 390,
      y: height - 765,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    firstPage.drawText(decodeURIComponent(ticket.pass_id), {
      x: 390,
      y: height - 790,
      size: 14,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    return pdfBytes;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`Failed to generate PDF ticket: ${error.message}`);
  }
}

/**
 * Upload PDF to Supabase storage and return the file path
 */
async function uploadPDFToStorage(pdfBytes, ticket) {
  try {
    // Generate unique filename with timestamp to prevent collisions
    const timestamp = Date.now();
    const fileName = `ticket-${ticket.ticket_id}-${timestamp}.pdf`;
    const filePath = `ticket-pdfs/${fileName}`;

    // Upload to Supabase storage
    const { error } = await supabase.storage
      .from("assets")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading PDF:", error);
      throw new Error("Failed to upload PDF to storage");
    }

    return filePath;
  } catch (error) {
    console.error("Error in uploadPDFToStorage:", error);
    throw error;
  }
}

/**
 * Utility function to split text into lines
 */
function splitTextIntoLines(text, maxCharsPerLine) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Get next ticket ID (auto-increment simulation)
 */
async function getNextTicketId() {
  const { Ticket } = getModels();
  const lastTicket = await Ticket.findOne().sort({ ticket_id: -1 }).limit(1);
  return lastTicket ? lastTicket.ticket_id + 1 : 1;
}

/**
 * @route POST /api/tickets
 * @description Generate tickets after successful payment
 * @body {number} orderId - Order ID
 * @returns Generated tickets with PDFs
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    // Import and use the ticket generation service

    const result = await generateTicketsForOrder(orderId);

    if (!result.success) {
      return NextResponse.json(result, {
        status: result.error === "Order not found" ? 404 : 400,
      });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/tickets:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate tickets",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @route GET /api/tickets
 * @description Get tickets for a user or specific order
 * @query {number} orderId - Filter by order ID
 * @query {number} userId - Filter by user ID
 * @query {string} passId - Get specific ticket by pass ID
 * @returns Tickets with details
 */
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const userId = searchParams.get("userId");
    const passId = searchParams.get("passId");

    const { Ticket, Order, Event } = getModels();

    let query = {};

    if (passId) {
      // Get specific ticket by pass ID
      query.pass_id = passId;
    } else if (orderId) {
      // Get tickets for specific order
      query.order_id = parseInt(orderId);
    } else if (userId) {
      // Get all orders for user, then get tickets
      const orders = await Order.find({
        user_id: parseInt(userId),
        payment_status: "completed",
      }).select("order_id");

      const orderIds = orders.map((order) => order.order_id);
      query.order_id = { $in: orderIds };
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide orderId, userId, or passId parameter",
        },
        { status: 400 }
      );
    }

    // Fetch tickets
    const tickets = await Ticket.find(query).sort({ created_at: -1 });

    // Enhance tickets with event details
    const enhancedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const event = await Event.findOne({ event_id: ticket.event_id });

        let ticketTypeName = "Unknown";
        let categoryName = "Unknown";

        if (event) {
          for (const category of event.categories) {
            const foundTicketType = category.ticket_types.find(
              (tt) => tt.ticket_type_id === ticket.ticket_type_id
            );

            if (foundTicketType) {
              ticketTypeName = foundTicketType.name;
              categoryName = category.name;
              break;
            }
          }
        }

        return {
          ticket_id: ticket.ticket_id,
          order_id: ticket.order_id,
          event_id: ticket.event_id,
          event_title: event ? event.title : "Unknown Event",
          category: categoryName,
          ticket_type: ticketTypeName,
          pass_id: ticket.pass_id,
          is_validated: ticket.is_validated,
          validation_time: ticket.validation_time,
          attendee_name: ticket.attendee_name,
          attendee_email: ticket.attendee_email,
          attendee_phone: ticket.attendee_phone,
          pdf_path: ticket.user_ticketpdf,
          created_at: ticket.created_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: enhancedTickets.length,
      tickets: enhancedTickets,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tickets",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @route PUT /api/tickets
 * @description Validate a ticket (mark as used)
 * @body {string} passId - Pass ID of the ticket to validate
 * @returns Updated ticket
 */
export async function PUT(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { passId } = body;

    console.log(passId);

    if (!passId) {
      return NextResponse.json(
        {
          success: false,
          error: "Pass ID is required",
        },
        { status: 400 }
      );
    }

    const { Ticket } = getModels();

    // Find ticket by pass ID
    const ticket = await Ticket.findOne({ pass_id: passId });

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket not found",
        },
        { status: 404 }
      );
    }

    // Check if already validated
    if (ticket.is_validated) {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket already validated",
          validation_time: ticket.validation_time,
        },
        { status: 400 }
      );
    }

    // Validate ticket
    ticket.is_validated = true;
    ticket.validation_time = new Date();
    await ticket.save();

    return NextResponse.json({
      success: true,
      message: "Ticket validated successfully",
      ticket: {
        ticket_id: ticket.ticket_id,
        pass_id: ticket.pass_id,
        is_validated: ticket.is_validated,
        validation_time: ticket.validation_time,
        attendee_name: ticket.attendee_name,
      },
    });
  } catch (error) {
    console.error("Error validating ticket:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate ticket",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
