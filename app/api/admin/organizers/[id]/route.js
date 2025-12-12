import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { Organizer, MasterAccount, Event } from "@/model/model";
import {
  verifyAdminAuth,
  validateNumericId,
  successResponse,
  errorResponse,
} from "@/lib/admin-api-helpers";

/**
 * GET /api/admin/organizers/[id]
 * Get detailed information for a specific organizer including their events
 */
export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    // Validate organizer ID
    const idValidation = validateNumericId(params.id, "Organizer ID");
    if (!idValidation.valid) {
      return errorResponse(idValidation.error, 400);
    }

    await dbConnect();

    // Fetch organizer with account details
    const organizerDetails = await Organizer.aggregate([
      {
        $match: { organizer_id: idValidation.value },
      },
      {
        // Lookup master account
        $lookup: {
          from: "masteraccounts",
          localField: "account_id",
          foreignField: "account_id",
          as: "account",
        },
      },
      {
        $unwind: {
          path: "$account",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!organizerDetails || organizerDetails.length === 0) {
      return errorResponse("Organizer not found", 404);
    }

    const organizer = organizerDetails[0];

    // Fetch organizer's events
    const events = await Event.find({
      organizer_id: idValidation.value,
    })
      .sort({ created_at: -1 })
      .select({
        event_id: 1,
        title: 1,
        start_date: 1,
        end_date: 1,
        status: 1,
        banner_image: 1,
        created_at: 1,
      })
      .lean();

    // Count events by status
    const eventsByStatus = {
      total: events.length,
      draft: events.filter((e) => e.status === "draft").length,
      pending: events.filter((e) => e.status === "pending").length,
      approved: events.filter((e) => e.status === "approved").length,
      live: events.filter((e) => e.status === "live").length,
      completed: events.filter((e) => e.status === "completed").length,
      cancelled: events.filter((e) => e.status === "cancelled").length,
    };

    // Format response
    const response = {
      organizer_id: organizer.organizer_id,
      organization_name: organizer.organization_name,
      phone_number: organizer.phone_number,
      logo: organizer.logo,
      description: organizer.description,
      facebook_link: organizer.facebook_link,
      insta_link: organizer.insta_link,
      web_link: organizer.web_link,
      status: organizer.status,
      event_count: events.length,
      created_at: organizer.created_at,
      updated_at: organizer.updated_at,
      account: {
        email: organizer.account?.email,
        email_verified: organizer.account?.email_verified,
        last_login: organizer.account?.last_login,
      },
      events: events,
      events_by_status: eventsByStatus,
    };

    return successResponse(response);
  } catch (error) {
    console.error("Error fetching organizer details:", error);
    return errorResponse(
      "Failed to fetch organizer details",
      500,
      error.message
    );
  }
}
