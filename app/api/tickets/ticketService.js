const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const passId = require("passId");
const { v4: uuidv4 } = require("uuid");

const prisma = new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

class TicketService {
  static instance = null;

  static getInstance() {
    if (!TicketService.instance) {
      TicketService.instance = new TicketService();
    }
    return TicketService.instance;
  }

  /**
   * Generate a unique 12-character URL-encoded QR code
   * Contains eventId, ticketId, ticketTypeId encoded in a compact format
   */
  generatepassId(eventId, ticketId, ticketTypeId) {
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
   * Create tickets for an order with attendee information
   */
  async createTicketsForOrder(orderData, ticketsWithAttendeeInfo) {
    try {
      const createdTickets = [];

      for (const ticketInfo of ticketsWithAttendeeInfo) {
        const { ticketTypeId, attendeeInfo } = ticketInfo;

        // Create the ticket record
        const ticket = await prisma.tickets.create({
          data: {
            order_id: orderData.order_id,
            ticket_type_id: ticketTypeId,
            pass_id: "",
            attendee_name: attendeeInfo.name,
            attendee_email: attendeeInfo.email,
            attendee_phone: attendeeInfo.phone,
            is_validated: false,
            user_ticketpdf: null, // Will be updated after PDF generation
          },
        });

        // Generate QR code with the actual ticket ID
        const passId = this.generatepassId(
          orderData.eventId,
          ticket.ticket_id,
          ticketTypeId
        );

        // Update ticket with QR code
        const updatedTicket = await prisma.tickets.update({
          where: { ticket_id: ticket.ticket_id },
          data: { pass_id: passId },
          include: {
            tickettypes: {
              include: {
                events: true,
              },
            },
          },
        });

        createdTickets.push(updatedTicket);
      }

      return createdTickets;
    } catch (error) {
      console.error("Error creating tickets:", error);
      throw new Error("Failed to create tickets service 103");
    }
  }

  /**
   * Generate PDF ticket using template and ticket data
   */
  async generateTicketPDF(ticket) {
    try {
      const event = ticket.tickettypes.events;

      // Get PDF template from Supabase storage
      const templatePath =
        // ticket.tickettypes.pdf_template ||
        "ticket-type-pdf-templates/default-template.pdf";
      const { data: templateData, error: downloadError } =
        await supabase.storage.from("assets").download(templatePath);

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
      const { width, height } = firstPage.getSize();

      // Embed font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Generate QR code image
      const passIdDataURL = await passId.toDataURL(ticket.pass_id, {
        width: 150,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Convert data URL to buffer
      const passIdBuffer = Buffer.from(passIdDataURL.split(",")[1], "base64");
      const passIdImage = await pdfDoc.embedPng(passIdBuffer);

      // Add dynamic content to PDF
      // firstPage.drawText(event.title, {
      //   x: 125,
      //   y: 283,
      //   size: 10,
      //   font: boldFont,
      //   color: rgb(0, 0, 0),
      // });

      firstPage.drawText(`${ticket.tickettypes.name}`, {
        x: 130,
        y: height - 291,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(ticket.attendee_name, {
        x: 90,
        y: height - 621,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(ticket.attendee_email, {
        x: 90,
        y: height - 639,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(ticket.attendee_phone, {
        x: 90,
        y: height - 657,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });

      // Add event policy if available
      if (event.event_policy) {
        // firstPage.drawText("Terms & Conditions:", {
        //   x: 86,
        //   y: height - 250,
        //   size: 12,
        //   font: font,
        //   color: rgb(0, 0, 0),
        // });

        // Split policy text into lines to fit on page
        const policyLines = this.splitTextIntoLines(event.event_policy, 60);
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

      // Add QR code
      firstPage.drawImage(passIdImage, {
        x: 390,
        y: height - 779,
        width: 150,
        height: 150,
      });

      // Add QR code text
      firstPage.drawText(ticket.pass_id, {
        x: 420,
        y: height - 810,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Serialize PDF
      const pdfBytes = await pdfDoc.save();

      return pdfBytes;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error("Failed to generate PDF ticket");
    }
  }

  /**
   * Upload PDF to Supabase storage and return the file path
   */
  async uploadPDFToStorage(pdfBytes, ticket) {
    try {
      // Generate unique filename
      const fileName = `ticket-${ticket.ticket_id}-${ticket.pass_id}.pdf`;
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
   * Complete ticket creation workflow: create tickets, generate PDFs, upload to storage
   */
  async createCompleteTickets(orderData, ticketsWithAttendeeInfo) {
    try {
      // Step 1: Create ticket records
      const tickets = await this.createTicketsForOrder(
        orderData,
        ticketsWithAttendeeInfo
      );

      // Step 2: Generate PDFs and upload to storage for each ticket
      const updatedTickets = [];

      for (const ticket of tickets) {
        try {
          // Generate PDF
          const pdfBytes = await this.generateTicketPDF(ticket);

          // Upload to storage
          const pdfPath = await this.uploadPDFToStorage(pdfBytes, ticket);

          // Update ticket with PDF path
          const updatedTicket = await prisma.tickets.update({
            where: { ticket_id: ticket.ticket_id },
            data: { user_ticketpdf: pdfPath },
            include: {
              tickettypes: {
                include: {
                  events: true,
                },
              },
            },
          });

          updatedTickets.push(updatedTicket);
        } catch (pdfError) {
          console.error(
            `Error processing PDF for ticket ${ticket.ticket_id}:`,
            pdfError
          );
          // Continue with other tickets even if one fails
          updatedTickets.push(ticket);
        }
      }

      return updatedTickets;
    } catch (error) {
      console.error("Error in createCompleteTickets:", error);
      throw error;
    }
  }

  /**
   * Get PDF file from storage for download
   */
  async getTicketPDF(ticketId, userId) {
    try {
      // Verify ticket belongs to user
      const ticket = await prisma.tickets.findFirst({
        where: {
          ticket_id: ticketId,
          orders: {
            user_id: userId,
            payment_status: "completed",
          },
        },
      });

      if (!ticket || !ticket.user_ticketpdf) {
        throw new Error("Ticket not found or PDF not available");
      }

      // Download from Supabase storage
      const { data, error } = await supabase.storage
        .from("assets")
        .download(ticket.user_ticketpdf);

      if (error) {
        console.error("Error downloading PDF:", error);
        throw new Error("Failed to download PDF");
      }

      return {
        data,
        filename: `ticket-${ticketId}.pdf`,
        contentType: "application/pdf",
      };
    } catch (error) {
      console.error("Error getting ticket PDF:", error);
      throw error;
    }
  }

  /**
   * Create order with pending payment status for two-stage purchase flow
   */
  async createPendingOrder(userId, selectedTickets, eventId) {
    try {
      // Calculate total amount
      const totalAmount = selectedTickets.reduce((sum, ticket) => {
        return sum + parseFloat(ticket.price) * ticket.quantity;
      }, 0);

      // Create order with pending status
      const order = await prisma.orders.create({
        data: {
          user_id: userId,
          total_amount: totalAmount,
          additional_fees: 0.0,
          payment_status: "pending", // Start with pending status
          payment_method: null, // Will be set after payment
          transaction_id: null, // Will be set after payment confirmation
        },
      });

      // Create order items
      for (const ticket of selectedTickets) {
        await prisma.orderitems.create({
          data: {
            order_id: order.order_id,
            ticket_type_id: ticket.ticketTypeId,
            quantity: ticket.quantity,
            unit_price: parseFloat(ticket.price),
          },
        });
      }

      return { ...order, eventId };
    } catch (error) {
      console.error("Error creating pending order:", error);
      throw new Error("Failed to create pending order");
    }
  }

  /**
   * Update order payment status and add transaction details
   */
  async updateOrderPaymentStatus(
    orderId,
    paymentStatus,
    transactionId,
    paymentMethod = "sslcommerz"
  ) {
    try {
      const updatedOrder = await prisma.orders.update({
        where: { order_id: orderId },
        data: {
          payment_status: paymentStatus,
          transaction_id: transactionId,
          payment_method: paymentMethod,
        },
      });

      return updatedOrder;
    } catch (error) {
      console.error("Error updating order payment status:", error);
      throw error;
    }
  }

  /**
   * Create order from cart items with pending payment status
   */
  async createOrderFromCart(userId, cartItems) {
    try {
      // Calculate total amount from cart items
      const totalAmount = cartItems.reduce((sum, item) => {
        return sum + parseFloat(item.tickettypes.price) * item.quantity;
      }, 0);

      // Create order with pending status
      const order = await prisma.orders.create({
        data: {
          user_id: userId,
          total_amount: totalAmount,
          additional_fees: 0.0,
          payment_status: "pending",
          payment_method: null,
          transaction_id: null,
        },
      });

      // Create order items from cart
      const orderItems = [];
      for (const cartItem of cartItems) {
        const orderItem = await prisma.orderitems.create({
          data: {
            order_id: order.order_id,
            ticket_type_id: cartItem.ticket_type_id,
            quantity: cartItem.quantity,
            unit_price: parseFloat(cartItem.tickettypes.price),
          },
        });
        orderItems.push(orderItem);
      }

      return {
        order,
        orderItems,
      };
    } catch (error) {
      console.error("Error creating order from cart:", error);
      throw error;
    }
  }

  /**
   * Generate tickets from an existing order (for two-stage purchase flow)
   */
  async generateTicketsFromOrder(orderId, ticketsWithAttendeeInfo) {
    try {
      console.log("Generating tickets from order:", orderId);

      // Get order with order items
      const order = await prisma.orders.findUnique({
        where: { order_id: orderId },
        include: {
          orderitems: {
            include: {
              tickettypes: {
                include: {
                  events: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.payment_status !== "completed") {
        throw new Error("Order payment is not completed");
      }

      // Check if tickets already exist for this order
      const existingTickets = await prisma.tickets.findMany({
        where: { order_id: orderId },
      });

      if (existingTickets.length > 0) {
        throw new Error("Tickets already generated for this order");
      }

      const tickets = [];
      let attendeeIndex = 0;

      // Generate tickets for each order item
      for (const orderItem of order.orderitems) {
        for (let i = 0; i < orderItem.quantity; i++) {
          const attendeeInfo = ticketsWithAttendeeInfo[attendeeIndex];

          if (!attendeeInfo) {
            throw new Error(
              `Missing attendee information for ticket ${attendeeIndex + 1}`
            );
          }

          // Create the ticket record
          const ticket = await prisma.tickets.create({
            data: {
              order_id: orderId,
              ticket_type_id: orderItem.ticket_type_id,
              pass_id: "", // Will be updated after we have the ticket_id
              attendee_name: attendeeInfo.attendeeInfo.name,
              attendee_email: attendeeInfo.attendeeInfo.email,
              attendee_phone: attendeeInfo.attendeeInfo.phone,
              is_validated: false,
              user_ticketpdf: null, // Will be updated after PDF generation
            },
          });

          // Generate QR code with the actual ticket ID
          const passId = this.generatepassId(
            orderItem.tickettypes.events.event_id,
            ticket.ticket_id,
            orderItem.ticket_type_id
          );

          // Update ticket with QR code
          await prisma.tickets.update({
            where: { ticket_id: ticket.ticket_id },
            data: { pass_id: passId },
          });

          // Generate and store PDF
          const pdfBuffer = await this.generateTicketPDF({
            ...ticket,
            pass_id: passId,
            tickettypes: orderItem.tickettypes,
          });

          // Upload PDF to Supabase Storage
          const fileName = `ticket_${ticket.ticket_id}_${Date.now()}.pdf`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("ticket-pdfs")
              .upload(fileName, pdfBuffer, {
                contentType: "application/pdf",
                upsert: false,
              });

          if (uploadError) {
            console.error("Error uploading PDF:", uploadError);
            throw new Error("Failed to upload ticket PDF");
          }

          // Update ticket with PDF URL
          const updatedTicket = await prisma.tickets.update({
            where: { ticket_id: ticket.ticket_id },
            data: { user_ticketpdf: uploadData.path },
          });

          tickets.push({
            ...updatedTicket,
            pass_id: passId,
            tickettypes: orderItem.tickettypes,
          });

          attendeeIndex++;
        }
      }

      return {
        success: true,
        tickets,
        order,
      };
    } catch (error) {
      console.error("Error generating tickets from order:", error);
      throw error;
    }
  }

  /**
   * Utility function to split text into lines
   */
  splitTextIntoLines(text, maxCharsPerLine) {
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
}

module.exports = TicketService;
