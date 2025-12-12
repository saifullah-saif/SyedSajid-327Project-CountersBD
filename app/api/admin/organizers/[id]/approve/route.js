import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { Organizer, OrganizerStatusType } from "@/model/model";
import {
  verifyAdminAuth,
  validateNumericId,
  successResponse,
  errorResponse,
} from "@/lib/admin-api-helpers";

/**
 * POST /api/admin/organizers/[id]/approve
 * Approve a pending organizer application
 */
export async function POST(request, { params }) {
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

    // Find the organizer
    const organizer = await Organizer.findOne({
      organizer_id: idValidation.value,
    });

    if (!organizer) {
      return errorResponse("Organizer not found", 404);
    }

    // Check if organizer is in a state that can be approved
    if (organizer.status === OrganizerStatusType.APPROVED) {
      return errorResponse("Organizer is already approved", 400);
    }

    // Update organizer status to approved
    organizer.status = OrganizerStatusType.APPROVED;
    await organizer.save();

    return successResponse(
      {
        organizer_id: organizer.organizer_id,
        organization_name: organizer.organization_name,
        status: organizer.status,
        updated_at: organizer.updated_at,
      },
      "Organizer approved successfully"
    );
  } catch (error) {
    console.error("Error approving organizer:", error);
    return errorResponse("Failed to approve organizer", 500, error.message);
  }
}
