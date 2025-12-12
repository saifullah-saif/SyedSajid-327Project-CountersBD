import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { Event, EventStatusType } from "@/model/model";
import {
  verifyAdminAuth,
  validateNumericId,
  successResponse,
  errorResponse,
} from "@/lib/admin-api-helpers";

/**
 * POST /api/admin/events/[id]/reject
 * Reject an event with optional reason
 */
export async function POST(request, { params }) {
  try {
    // Verify admin authentication
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    // Validate event ID
    const idValidation = validateNumericId(params.id, "Event ID");
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

    // Find the event
    const event = await Event.findOne({ event_id: idValidation.value });

    if (!event) {
      return errorResponse("Event not found", 404);
    }

    // Check if event is in a state that can be rejected
    if (event.status === EventStatusType.LIVE) {
      return errorResponse(
        "Cannot reject an event that is currently live",
        400
      );
    }

    if (event.status === EventStatusType.COMPLETED) {
      return errorResponse("Cannot reject a completed event", 400);
    }

    if (event.status === EventStatusType.CANCELLED) {
      return errorResponse("Event is already cancelled", 400);
    }

    // Update event status to cancelled (using cancelled as rejection status)
    event.status = EventStatusType.CANCELLED;
    await event.save();

    // Note: If you need to store rejection reason, you might want to add a field to the Event schema
    // For now, we'll include it in the response but it won't be persisted

    return successResponse(
      {
        event_id: event.event_id,
        title: event.title,
        status: event.status,
        rejection_reason: rejectionReason,
        updated_at: event.updated_at,
      },
      "Event rejected successfully"
    );
  } catch (error) {
    console.error("Error rejecting event:", error);
    return errorResponse("Failed to reject event", 500, error.message);
  }
}
