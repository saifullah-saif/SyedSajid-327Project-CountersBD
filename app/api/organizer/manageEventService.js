const { PrismaClient } = require("@prisma/client");
const FileUploadService = require("../../../lib/fileUploadService");

class ManageEventService {
  constructor() {
    this.prisma = new PrismaClient();
    this.fileUploadService = new FileUploadService();
  }

  // Get event by ID for management (with full details)
  async getEventForManagement(eventId, organizerId) {
    try {
      const event = await this.prisma.events.findFirst({
        where: {
          event_id: eventId,
          organizer_id: organizerId,
        },
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
              tickettypes: {
                include: {
                  _count: {
                    select: {
                      tickets: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!event) {
        throw new Error("Event not found or access denied");
      }

      return this.formatEventForManagement(event);
    } catch (error) {
      console.error("Error fetching event for management:", error);
      throw error;
    }
  }

  // Update event details
  async updateEvent(eventId, organizerId, eventData) {
    const transaction = await this.prisma.$transaction(async (prisma) => {
      try {
        // Verify organizer owns this event
        const existingEvent = await prisma.events.findFirst({
          where: {
            event_id: eventId,
            organizer_id: organizerId,
          },
        });

        if (!existingEvent) {
          throw new Error("Event not found or access denied");
        }

        // Update main event data
        const updatedEvent = await prisma.events.update({
          where: { event_id: eventId },
          data: {
            title: eventData.title,
            description: eventData.description,
            start_date: new Date(eventData.startDate),
            end_date: new Date(eventData.endDate),
            start_time: eventData.startTime, // Keep as string for TIME field
            banner_image: eventData.bannerImage,
            venue_name: eventData.venueName,
            location_id: eventData.locationId
              ? parseInt(eventData.locationId)
              : null,
            genre_id: eventData.genreId ? parseInt(eventData.genreId) : null,
            tickets_sale_start: new Date(eventData.saleStartDate),
            tickets_sale_end: new Date(eventData.saleEndDate),
            event_policy: eventData.eventPolicy,
            updated_at: new Date(),
          },
        });

        // Update event artists
        if (eventData.eventArtists !== undefined) {
          // Remove existing event artists
          await prisma.eventartists.deleteMany({
            where: { event_id: eventId },
          });

          // Add new event artists
          if (eventData.eventArtists && eventData.eventArtists.length > 0) {
            const eventArtistData = eventData.eventArtists.map((artistId) => ({
              event_id: eventId,
              artist_id: parseInt(artistId),
            }));

            await prisma.eventartists.createMany({
              data: eventArtistData,
            });
          }
        }

        // Update categories if provided
        if (eventData.categories) {
          await this.updateEventCategories(
            prisma,
            eventId,
            eventData.categories
          );
        }

        // Fetch updated event with all relations
        const completeEvent = await prisma.events.findUnique({
          where: { event_id: eventId },
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
                tickettypes: {
                  include: {
                    _count: {
                      select: {
                        tickets: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        return this.formatEventForManagement(completeEvent);
      } catch (error) {
        console.error("Error in update event transaction:", error);
        throw error;
      }
    });

    return transaction;
  }

  // Update event categories and ticket types
  async updateEventCategories(prisma, eventId, categories) {
    try {
      // Get existing categories
      const existingCategories = await prisma.eventcategories.findMany({
        where: { event_id: eventId },
        include: {
          tickettypes: {
            include: {
              _count: {
                select: {
                  tickets: true,
                },
              },
            },
          },
        },
      });

      // Process each category
      for (const category of categories) {
        if (category.id && category.id > 0) {
          // Update existing category
          await this.updateExistingCategory(prisma, category);
        } else {
          // Create new category
          await this.createNewCategory(prisma, eventId, category);
        }
      }

      // Remove categories that are not in the update (careful with tickets)
      const updatedCategoryIds = categories
        .filter((cat) => cat.id && cat.id > 0)
        .map((cat) => cat.id);

      const categoriesToRemove = existingCategories.filter(
        (cat) => !updatedCategoryIds.includes(cat.category_id)
      );

      for (const categoryToRemove of categoriesToRemove) {
        // Only remove if no tickets have been sold
        const hasTickets = categoryToRemove.tickettypes.some(
          (tt) => tt._count.tickets > 0
        );

        if (!hasTickets) {
          // Remove ticket types first
          await prisma.tickettypes.deleteMany({
            where: { category_id: categoryToRemove.category_id },
          });

          // Remove category
          await prisma.eventcategories.delete({
            where: { category_id: categoryToRemove.category_id },
          });
        }
      }
    } catch (error) {
      console.error("Error updating event categories:", error);
      throw error;
    }
  }

  // Update existing category
  async updateExistingCategory(prisma, category) {
    try {
      // Update category details
      await prisma.eventcategories.update({
        where: { category_id: category.id },
        data: {
          name: category.name,
          description: category.description,
          category_type: category.categoryType,
        },
      });

      // Update ticket types
      if (category.tickets) {
        await this.updateCategoryTicketTypes(
          prisma,
          category.id,
          category.tickets
        );
      }
    } catch (error) {
      console.error("Error updating existing category:", error);
      throw error;
    }
  }

  // Create new category
  async createNewCategory(prisma, eventId, category) {
    try {
      const newCategory = await prisma.eventcategories.create({
        data: {
          event_id: eventId,
          name: category.name,
          description: category.description,
          category_type: category.categoryType,
        },
      });

      // Create ticket types for new category
      if (category.tickets && category.tickets.length > 0) {
        const ticketTypesData = category.tickets.map((ticket) => ({
          event_id: eventId,
          category_id: newCategory.category_id,
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
    } catch (error) {
      console.error("Error creating new category:", error);
      throw error;
    }
  }

  // Update category ticket types
  async updateCategoryTicketTypes(prisma, categoryId, tickets) {
    try {
      // Get existing ticket types
      const existingTicketTypes = await prisma.tickettypes.findMany({
        where: { category_id: categoryId },
        include: {
          _count: {
            select: {
              tickets: true,
            },
          },
        },
      });

      // Process each ticket type
      for (const ticket of tickets) {
        if (ticket.id && ticket.id > 0) {
          // Update existing ticket type (be careful with quantity if tickets sold)
          const existingTicket = existingTicketTypes.find(
            (et) => et.ticket_type_id === ticket.id
          );

          const updateData = {
            name: ticket.name,
            description: ticket.description,
            price: parseFloat(ticket.price),
            max_per_order: parseInt(ticket.maxPerOrder) || 10,
            banner: ticket.banner,
            pdf_template: ticket.pdfTemplate,
          };

          // Only update quantity if no tickets have been sold
          if (!existingTicket || existingTicket._count.tickets === 0) {
            updateData.quantity_available = parseInt(ticket.quantity);
          } else {
            // For existing tickets with sales, only allow increasing quantity
            const newQuantity = parseInt(ticket.quantity);
            if (newQuantity > existingTicket.quantity_available) {
              updateData.quantity_available = newQuantity;
            }
          }

          await prisma.tickettypes.update({
            where: { ticket_type_id: ticket.id },
            data: updateData,
          });
        } else {
          // Create new ticket type
          await prisma.tickettypes.create({
            data: {
              event_id: (
                await prisma.eventcategories.findUnique({
                  where: { category_id: categoryId },
                  select: { event_id: true },
                })
              ).event_id,
              category_id: categoryId,
              name: ticket.name,
              description: ticket.description,
              price: parseFloat(ticket.price),
              quantity_available: parseInt(ticket.quantity),
              max_per_order: parseInt(ticket.maxPerOrder) || 10,
              banner: ticket.banner,
              pdf_template: ticket.pdfTemplate,
            },
          });
        }
      }

      // Remove ticket types that are not in the update (careful with sold tickets)
      const updatedTicketIds = tickets
        .filter((ticket) => ticket.id && ticket.id > 0)
        .map((ticket) => ticket.id);

      const ticketTypesToRemove = existingTicketTypes.filter(
        (ett) => !updatedTicketIds.includes(ett.ticket_type_id)
      );

      for (const ticketTypeToRemove of ticketTypesToRemove) {
        // Only remove if no tickets have been sold
        if (ticketTypeToRemove._count.tickets === 0) {
          await prisma.tickettypes.delete({
            where: { ticket_type_id: ticketTypeToRemove.ticket_type_id },
          });
        }
      }
    } catch (error) {
      console.error("Error updating category ticket types:", error);
      throw error;
    }
  }

  // Publish event (change status from draft to pending/live)
  async publishEvent(eventId, organizerId) {
    try {
      // Verify organizer owns this event
      const event = await this.prisma.events.findFirst({
        where: {
          event_id: eventId,
          organizer_id: organizerId,
        },
      });

      if (!event) {
        throw new Error("Event not found or access denied");
      }

      if (event.status === "live" || event.status === "approved") {
        throw new Error("Event is already published");
      }

      if (event.status === "completed" || event.status === "cancelled") {
        throw new Error("Cannot publish a completed or cancelled event");
      }

      // Update event status to pending (for admin approval) or live
      const newStatus = "pending"; // Can be changed to 'live' based on business logic

      const updatedEvent = await this.prisma.events.update({
        where: { event_id: eventId },
        data: {
          status: newStatus,
          updated_at: new Date(),
        },
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

      return this.formatEventForManagement(updatedEvent);
    } catch (error) {
      console.error("Error publishing event:", error);
      throw error;
    }
  }

  // Get all genres for dropdown
  async getAllGenres() {
    try {
      const genres = await this.prisma.genres.findMany({
        orderBy: { name: "asc" },
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
        orderBy: { city: "asc" },
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
        orderBy: { name: "asc" },
      });
      return artists;
    } catch (error) {
      console.error("Error fetching artists:", error);
      throw new Error("Failed to fetch artists");
    }
  }

  // Get event preview data (for preview functionality)
  async getEventPreview(eventId, organizerId) {
    try {
      const event = await this.getEventForManagement(eventId, organizerId);

      // Add additional preview-specific data
      const ticketStats = await this.getEventTicketStats(eventId);

      return {
        ...event,
        stats: ticketStats,
      };
    } catch (error) {
      console.error("Error getting event preview:", error);
      throw error;
    }
  }

  // Get event ticket statistics
  async getEventTicketStats(eventId) {
    try {
      const stats = await this.prisma.tickettypes.groupBy({
        by: ["ticket_type_id"],
        where: { event_id: eventId },
        _sum: {
          quantity_available: true,
        },
        _count: {
          tickets: true,
        },
      });

      const totalAvailable = stats.reduce(
        (sum, stat) => sum + (stat._sum.quantity_available || 0),
        0
      );
      const totalSold = stats.reduce(
        (sum, stat) => sum + stat._count.tickets,
        0
      );

      return {
        totalAvailable,
        totalSold,
        remainingTickets: totalAvailable - totalSold,
        salesPercentage:
          totalAvailable > 0
            ? ((totalSold / totalAvailable) * 100).toFixed(2)
            : 0,
      };
    } catch (error) {
      console.error("Error getting event ticket stats:", error);
      return {
        totalAvailable: 0,
        totalSold: 0,
        remainingTickets: 0,
        salesPercentage: 0,
      };
    }
  }

  // Format event for management view
  formatEventForManagement(event) {
    return {
      id: event.event_id,
      title: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      startTime: event.start_time,
      saleStartDate: event.tickets_sale_start,
      saleEndDate: event.tickets_sale_end,
      venueName: event.venue_name,
      venueAddress: event.locations?.address,
      city: event.locations?.city,
      mapLink: event.locations?.map_link,
      eventPolicy: event.event_policy,
      bannerImage: event.banner_image,
      genreId: event.genre_id?.toString(),
      locationId: event.location_id?.toString(),
      status: event.status,
      genre: event.genres,
      location: event.locations,
      organizer: event.organizers,
      eventArtists:
        event.eventartists?.map((ea) => ({
          artist_id: ea.artists.artist_id,
          name: ea.artists.name,
          bio: ea.artists.bio,
          image: ea.artists.image,
        })) || [],
      categories:
        event.eventcategories?.map((cat) => ({
          id: cat.category_id,
          name: cat.name,
          description: cat.description,
          type: cat.category_type,
          categoryType: cat.category_type,
          tickets:
            cat.tickettypes?.map((tt) => ({
              id: tt.ticket_type_id,
              name: tt.name,
              description: tt.description,
              price: parseFloat(tt.price),
              quantity: tt.quantity_available,
              sold: tt._count?.tickets || 0,
              maxPerOrder: tt.max_per_order,
              banner: tt.banner,
              pdfTemplate: tt.pdf_template,
            })) || [],
        })) || [],
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

module.exports = ManageEventService;
