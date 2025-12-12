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
 * POST /api/admin/organizers/[id]/reject
 * Reject an organizer application with optional reason
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

    // Parse request body for rejection reason
    let rejectionReason = null;
    try {
      const body = await request.json();
      rejectionReason = body.reason || null;
    } catch (err) {
      // Body is optional, continue without it
    }

    await dbConnect();

    // Find the organizer
    const organizer = await Organizer.findOne({
      organizer_id: idValidation.value,
    });

    if (!organizer) {
      return errorResponse("Organizer not found", 404);
    }

    // Check if organizer is in a state that can be rejected
    if (organizer.status === OrganizerStatusType.REJECTED) {
      return errorResponse("Organizer is already rejected", 400);
    }

    // Update organizer status to rejected
    organizer.status = OrganizerStatusType.REJECTED;
    await organizer.save();

    // Note: If you need to store rejection reason, you might want to add a field to the Organizer schema
    // For now, we'll include it in the response but it won't be persisted

    return successResponse(
      {
        organizer_id: organizer.organizer_id,
        organization_name: organizer.organization_name,
        status: organizer.status,
        rejection_reason: rejectionReason,
        updated_at: organizer.updated_at,
      },
      "Organizer rejected successfully"
    );
  } catch (error) {
    console.error("Error rejecting organizer:", error);
    return errorResponse("Failed to reject organizer", 500, error.message);
  }
}
