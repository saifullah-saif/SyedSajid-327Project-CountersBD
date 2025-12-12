import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import {
  Organizer,
  MasterAccount,
  Event,
  OrganizerStatusType,
} from "@/model/model";
import {
  verifyAdminAuth,
  successResponse,
  errorResponse,
} from "@/lib/admin-api-helpers";

/**
 * GET /api/admin/organizers
 * List all organizers with their account information and event counts
 */
export async function GET(request) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    await dbConnect();

    // Fetch all organizers with aggregation pipeline
    const organizersWithDetails = await Organizer.aggregate([
      {
        // Sort by creation date (newest first)
        $sort: { created_at: -1 },
      },
      {
        // Lookup master account for email
        $lookup: {
          from: "masteraccounts",
          localField: "account_id",
          foreignField: "account_id",
          as: "account",
        },
      },
      {
        // Unwind account array
        $unwind: {
          path: "$account",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Project final structure
        $project: {
          organizer_id: 1,
          organization_name: 1,
          phone_number: 1,
          logo: 1,
          description: 1,
          facebook_link: 1,
          insta_link: 1,
          web_link: 1,
          status: 1,
          event_count: 1,
          created_at: 1,
          updated_at: 1,
          account_id: 1,
          email: "$account.email",
          email_verified: "$account.email_verified",
          last_login: "$account.last_login",
        },
      },
    ]);

    // Update event counts (in case they're not accurate)
    const organizersWithCorrectCounts = await Promise.all(
      organizersWithDetails.map(async (organizer) => {
        try {
          const eventCount = await Event.countDocuments({
            organizer_id: organizer.organizer_id,
          });

          return {
            ...organizer,
            event_count: eventCount,
          };
        } catch (err) {
          console.error(
            `Error counting events for organizer ${organizer.organizer_id}:`,
            err
          );
          return organizer;
        }
      })
    );

    return successResponse(organizersWithCorrectCounts);
  } catch (error) {
    console.error("Error fetching organizers:", error);
    return errorResponse("Failed to fetch organizers", 500, error.message);
  }
}
