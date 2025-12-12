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
 * POST /api/admin/events/[id]/approve
 * Approve a pending event
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

    await dbConnect();

    // Find the event
    const event = await Event.findOne({ event_id: idValidation.value });

    if (!event) {
      return errorResponse("Event not found", 404);
    }

    // Check if event is in a state that can be approved
    if (event.status === EventStatusType.APPROVED) {
      return errorResponse("Event is already approved", 400);
    }

    if (event.status === EventStatusType.LIVE) {
      return errorResponse("Cannot approve an event that is already live", 400);
    }

    if (event.status === EventStatusType.COMPLETED) {
      return errorResponse("Cannot approve a completed event", 400);
    }

    if (event.status === EventStatusType.CANCELLED) {
      return errorResponse("Cannot approve a cancelled event", 400);
    }

    // Update event status to approved
    event.status = EventStatusType.APPROVED;
    await event.save();

    return successResponse(
      {
        event_id: event.event_id,
        title: event.title,
        status: event.status,
        updated_at: event.updated_at,
      },
      "Event approved successfully"
    );
  } catch (error) {
    console.error("Error approving event:", error);
    return errorResponse("Failed to approve event", 500, error.message);
  }
}
