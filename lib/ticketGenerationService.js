import dbConnect from "@/lib/mongo";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import mongoose from "mongoose";

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
 */
function generatepassId(eventId, ticketId, ticketTypeId) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  let passId = (timestamp + random).substring(0, 12).toUpperCase();

  if (passId.length < 12) {
    const padding = (eventId.toString() + ticketId.toString()).substring(
      0,
      12 - passId.length
    );
    passId += padding;
  }

  return encodeURIComponent(passId);
}

/**
 * Generate PDF ticket using template and ticket data
 */

async function generateTicketPDF(ticket, event, ticketType, categoryName) {
  try {
    const templatePath = "ticket-type-pdf-templates/default-template.pdf";
    const { data: templateData, error: downloadError } = await supabase.storage
      .from("assets")
      .download(templatePath);

    if (downloadError) {
      throw new Error("Failed to download PDF template");
    }

    const templateBuffer = await templateData.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    firstPage.drawText(
      `${categoryName || "Category"} - ${ticketType.name || "Ticket"}`,
      { x: 130, y: height - 291, size: 10, font: font, color: rgb(0, 0, 0) }
    );

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

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    throw new Error(`Failed to generate PDF ticket: ${error.message}`);
  }
}

/**
 * Upload PDF to Supabase storage
 */
async function uploadPDFToStorage(pdfBytes, ticket) {
  try {
    const timestamp = Date.now();
    const fileName = `ticket-${ticket.ticket_id}-${timestamp}.pdf`;
    const filePath = `ticket-pdfs/${fileName}`;

    const { error } = await supabase.storage
      .from("assets")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw error;
    }

    return filePath;
  } catch (error) {
    throw error;
  }
}

/**
 * Get next ticket ID
 */
async function getNextTicketId() {
  const { Ticket } = getModels();
  const lastTicket = await Ticket.findOne().sort({ ticket_id: -1 }).limit(1);
  return lastTicket ? lastTicket.ticket_id + 1 : 1;
}

/**
 * EXPORTED: Generate tickets for an order (used internally and via API)
 * @param {number} orderId - The order ID to generate tickets for
 * @returns {object} Result object with success status and tickets array
 */

// FIXME: Does not create tickets after successful payment

export async function generateTicketsForOrder(orderId) {
  try {
    await dbConnect();

    if (!orderId) {
      return {
        success: false,
        error: "Order ID is required",
        message: "Order ID parameter is missing",
      };
    }

    const { Order, Event, Ticket } = getModels();

    // Get order with items and attendee info
    const order = await Order.findOne({ order_id: orderId });

    if (!order) {
      return {
        success: false,
        error: "Order not found",
        message: `Order with ID ${orderId} does not exist`,
      };
    }

    // Check if order payment is completed
    if (order.payment_status !== "completed") {
      return {
        success: false,
        error: "Payment not completed",
        message: `Order payment status is ${order.payment_status}, must be completed`,
      };
    }

    // Check if tickets already exist for this order
    const existingTickets = await Ticket.find({ order_id: orderId });

    if (existingTickets.length > 0) {
      return {
        success: true,
        message: `Tickets already exist for order ${orderId}`,
        tickets: existingTickets.map((t) => ({
          ticket_id: t.ticket_id,
          pass_id: t.pass_id,
          attendee_name: t.attendee_name,
          pdf_path: t.user_ticketpdf,
        })),
      };
    }

    const generatedTickets = [];
    let attendeeIndex = 0;

    // Process each order item
    for (const orderItem of order.order_items) {
      const event = await Event.findOne({ event_id: orderItem.event_id });

      if (!event) {
        console.error(`Event ${orderItem.event_id} not found`);
        continue;
      }

      // Find ticket type and category info
      let ticketTypeName = "Standard Ticket";
      let categoryName = "General";

      for (const category of event.categories) {
        const ticketType = category.ticket_types.find(
          (tt) => tt.ticket_type_id === orderItem.ticket_type_id
        );
        if (ticketType) {
          ticketTypeName = ticketType.name;
          categoryName = category.name;
          break;
        }
      }

      // Generate tickets for each quantity
      for (let i = 0; i < orderItem.quantity; i++) {
        const ticketId = await getNextTicketId();
        const passId = generatepassId(
          orderItem.event_id,
          ticketId,
          orderItem.ticket_type_id
        );

        // Get attendee info
        const attendeeInfo = order.attendee_info[attendeeIndex] || {
          attendee_name: "Guest",
          attendee_email: "guest@example.com",
          attendee_phone: "N/A",
        };

        // Create ticket document
        const ticketData = {
          ticket_id: ticketId,
          order_id: orderId,
          event_id: orderItem.event_id,
          ticket_type_id: orderItem.ticket_type_id,
          pass_id: passId,
          is_validated: false,
          attendee_name: attendeeInfo.attendee_name,
          attendee_email: attendeeInfo.attendee_email,
          attendee_phone: attendeeInfo.attendee_phone,
          created_at: new Date(),
        };

        // Generate PDF
        try {
          const pdfBytes = await generateTicketPDF(
            ticketData,
            event,
            { name: ticketTypeName },
            categoryName
          );

          // Upload PDF to storage
          const pdfPath = await uploadPDFToStorage(pdfBytes, ticketData);
          ticketData.user_ticketpdf = pdfPath;
        } catch (pdfError) {
          console.error("PDF generation error:", pdfError);
          // Continue without PDF - can be regenerated later
        }

        // Save ticket to database
        const ticket = new Ticket(ticketData);
        await ticket.save();

        generatedTickets.push({
          ticket_id: ticketData.ticket_id,
          pass_id: ticketData.pass_id,
          attendee_name: ticketData.attendee_name,
          pdf_path: ticketData.user_ticketpdf,
        });

        attendeeIndex++;
      }
    }

    if (generatedTickets.length === 0) {
      return {
        success: false,
        error: "No tickets generated",
        message: "Failed to generate any tickets for this order",
      };
    }

    console.log("Generated tickets:", generatedTickets);
    return {
      success: true,
      message: `Successfully generated ${generatedTickets.length} ticket(s)`,
      tickets: generatedTickets,
      order_id: orderId,
    };
  } catch (error) {
    console.error("Error generating tickets:", error);
    return {
      success: false,
      error: "Failed to generate tickets",
      message: error.message,
    };
  }
}
