const { PrismaClient } = require("@prisma/client");
const FileUploadService = require("../../../lib/fileUploadService");

class CreateEventsService {
  constructor() {
    this.prisma = new PrismaClient();
    this.fileUploadService = new FileUploadService();
  }

  // Get all genres for dropdown
  async getAllGenres() {
    try {
      const genres = await this.prisma.genres.findMany({
        orderBy: {
          name: "asc",
        },f
      });

      return genres;
    } catch (error) {
      console.error("Error fetching genres:", error);
      throw new Error("Failed to fetch genres");
    }
  }

  // Get all locations for dropdown
  async getAllLocations() {
    try {
      const locations = await this.prisma.locations.findMany({
        orderBy: {
          city: "asc",
        },
      });

      return locations;
    } catch (error) {
      console.error("Error fetching locations:", error);
      throw new Error("Failed to fetch locations");
    }
  }

  // Get all artists for selection
  async getAllArtists() {
    try {
      const artists = await this.prisma.artists.findMany({
        orderBy: {
          name: "asc",
        },
      });

      return artists;
    } catch (error) {
      console.error("Error fetching artists:", error);
      throw new Error("Failed to fetch artists");
    }
  }

  // Create a new event with categories and ticket types
  async createEvent(eventData, organizerId) {
    console.log("CreateEventsService.createEvent called with data:", {
      ...eventData,
      organizerId,
    });

    // Validate required fields
    const requiredFields = [
      "title",
      "startDate",
      "endDate",
      "startTime",
      "saleStartDate",
      "saleEndDate",
    ];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const transaction = await this.prisma.$transaction(async (prisma) => {
      try {
        // Convert time string to DateTime for Prisma
        const convertTimeToDateTime = (timeString) => {
          if (!timeString) return null;
          // Create a date object with today's date and the provided time
          const [hours, minutes] = timeString.split(":");
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          return date;
        };

        // Handle location - either use existing location_id or create venue_name only
        let locationId = null;
        if (eventData.locationId) {
          locationId = parseInt(eventData.locationId);
        }
        // If no location_id provided but we have venue details, we'll just use venue_name
        // The venueAddress and city from frontend will be ignored for now since
        // the events table doesn't have these fields directly

        const eventCreateData = {
          organizer_id: organizerId,
          title: eventData.title,
          description: eventData.description,
          start_date: new Date(eventData.startDate),
          end_date: new Date(eventData.endDate),
          start_time: convertTimeToDateTime(eventData.startTime),
          banner_image: eventData.bannerImage || null,
          venue_name: eventData.venueName,
          location_id: locationId,
          genre_id: eventData.genreId ? parseInt(eventData.genreId) : null,
          tickets_sale_start: new Date(eventData.saleStartDate),
          tickets_sale_end: new Date(eventData.saleEndDate),
          event_policy: eventData.eventPolicy || null,
          status: "draft",
        };

        console.log("Creating event with data:", eventCreateData);

        // Create the main event
        const event = await prisma.events.create({
          data: eventCreateData,
        });

        // Create event artists if any
        if (eventData.artists && eventData.artists.length > 0) {
          const eventArtistData = eventData.artists.map((artistId) => ({
            event_id: event.event_id,
            artist_id: parseInt(artistId),
          }));

          await prisma.eventartists.createMany({
            data: eventArtistData,
          });
        }

        // Create event categories and ticket types
        if (eventData.categories && eventData.categories.length > 0) {
          for (const category of eventData.categories) {
            const eventCategory = await prisma.eventcategories.create({
              data: {
                event_id: event.event_id,
                name: category.name,
                description: category.description,
                category_type: category.categoryType,
              },
            });

            // Create ticket types for this category
            if (category.tickets && category.tickets.length > 0) {
              const ticketTypesData = category.tickets.map((ticket) => ({
                event_id: event.event_id,
                category_id: eventCategory.category_id,
                name: ticket.name,
                description: ticket.description,
                price: parseFloat(ticket.price),
                quantity_available: parseInt(ticket.quantity),
                max_per_order: parseInt(ticket.maxPerOrder) || 10,
                banner: ticket.banner,
                pdf_template: ticket.pdfTemplate,
              }));

              await prisma.tickettypes.createMany({
                data: ticketTypesData,
              });
            }
          }
        }

        // Fetch the complete event with all related data
        const completeEvent = await prisma.events.findUnique({
          where: { event_id: event.event_id },
          include: {
            genres: true,
            locations: true,
            organizers: {
              select: {
                organizer_id: true,
                organization_name: true,
                phone_number: true,
              },
            },
            eventartists: {
              include: {
                artists: true,
              },
            },
            eventcategories: {
              include: {
                tickettypes: true,
              },
            },
          },
        });

        return completeEvent;
      } catch (error) {
        console.error("Error in create event transaction:", error);
        throw error;
      }
    });

    return transaction;
  }

  // Save event as draft
  async saveEventDraft(eventData, organizerId) {
    try {
      return await this.createEvent(
        { ...eventData, status: "draft" },
        organizerId
      );
    } catch (error) {
      console.error("Error saving event draft:", error);
      throw new Error("Failed to save event draft");
    }
  }

  // Publish event (change status to pending for approval)
  async publishEvent(eventData, organizerId) {
    try {
      const event = await this.createEvent(
        { ...eventData, status: "pending" },
        organizerId
      );

      // Additional logic for publishing can be added here
      // Like sending notifications to admins for approval

      return event;
    } catch (error) {
      console.error("Error publishing event:", error);
      throw new Error("Failed to publish event");
    }
  }

  // Check if organizer exists and is approved
  async validateOrganizer(organizerId) {
    try {
      const organizer = await this.prisma.organizers.findUnique({
        where: { organizer_id: organizerId },
        include: {
          masteraccounts: true,
        },
      });

      if (!organizer) {
        throw new Error("Organizer not found");
      }

      if (organizer.status !== "approved") {
        throw new Error(
          "Organizer account is not approved for creating events"
        );
      }

      return organizer;
    } catch (error) {
      console.error("Error validating organizer:", error);
      throw error;
    }
  }

  // Format event response
  formatEventResponse(event) {
    return {
      id: event.event_id,
      title: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      startTime: event.start_time,
      bannerImage: event.banner_image,
      venueName: event.venue_name,
      venueAddress: event.locations?.address,
      city: event.locations?.city,
      mapLink: event.locations?.map_link,
      eventPolicy: event.event_policy,
      genre: event.genres,
      location: event.locations,
      organizer: event.organizers,
      artists: event.eventartists?.map((ea) => ea.artists) || [],
      categories:
        event.eventcategories?.map((cat) => ({
          id: cat.category_id,
          name: cat.name,
          description: cat.description,
          categoryType: cat.category_type,
          tickets: cat.tickettypes || [],
        })) || [],
      status: event.status,
      ticketsSaleStart: event.tickets_sale_start,
      ticketsSaleEnd: event.tickets_sale_end,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    };
  }

  // Upload event banner image
  async uploadEventBannerImage(fileBuffer, originalName, eventId) {
    try {
      const uploadResult = await this.fileUploadService.uploadEventBanner(
        fileBuffer,
        originalName,
        eventId
      );

      if (uploadResult.success) {
        // Update event with banner image URL
        await this.prisma.events.update({
          where: { event_id: eventId },
          data: { banner_image: uploadResult.publicUrl },
        });

        return {
          success: true,
          message: "Event banner uploaded successfully",
          data: {
            bannerUrl: uploadResult.publicUrl,
            filePath: uploadResult.filePath,
            fileName: uploadResult.fileName,
          },
        };
      }

      throw new Error("Upload failed");
    } catch (error) {
      console.error("Error uploading event banner:", error);
      throw new Error(`Failed to upload event banner: ${error.message}`);
    }
  }

  // Upload ticket type banner image
  async uploadTicketTypeBannerImage(
    fileBuffer,
    originalName,
    eventId,
    ticketTypeId
  ) {
    try {
      const uploadResult = await this.fileUploadService.uploadTicketTypeBanner(
        fileBuffer,
        originalName,
        eventId,
        ticketTypeId
      );

      if (uploadResult.success) {
        // Update ticket type with banner image URL
        await this.prisma.tickettypes.update({
          where: { ticket_type_id: ticketTypeId },
          data: { banner: uploadResult.publicUrl },
        });

        return {
          success: true,
          message: "Ticket type banner uploaded successfully",
          data: {
            bannerUrl: uploadResult.publicUrl,
            filePath: uploadResult.filePath,
            fileName: uploadResult.fileName,
          },
        };
      }

      throw new Error("Upload failed");
    } catch (error) {
      console.error("Error uploading ticket type banner:", error);
      throw new Error(`Failed to upload ticket type banner: ${error.message}`);
    }
  }

  // Upload ticket type PDF template
  async uploadTicketTypePdfTemplate(
    fileBuffer,
    originalName,
    eventId,
    ticketTypeId
  ) {
    try {
      const uploadResult = await this.fileUploadService.uploadTicketTypePdf(
        fileBuffer,
        originalName,
        eventId,
        ticketTypeId
      );

      if (uploadResult.success) {
        // Update ticket type with PDF template URL
        await this.prisma.tickettypes.update({
          where: { ticket_type_id: ticketTypeId },
          data: { pdf_template: uploadResult.publicUrl },
        });

        return {
          success: true,
          message: "PDF template uploaded successfully",
          data: {
            templateUrl: uploadResult.publicUrl,
            filePath: uploadResult.filePath,
            fileName: uploadResult.fileName,
          },
        };
      }

      throw new Error("Upload failed");
    } catch (error) {
      console.error("Error uploading PDF template:", error);
      throw new Error(`Failed to upload PDF template: ${error.message}`);
    }
  }

  // Delete uploaded file
  async deleteUploadedFile(filePath) {
    try {
      return await this.fileUploadService.deleteFile(filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }
}

module.exports = CreateEventsService;
