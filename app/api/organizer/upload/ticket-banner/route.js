import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import FileUploadService from "@/lib/fileUploadService";

/**
 * POST /api/organizer/upload/ticket-banner
 * Uploads ticket type banner image to Supabase Storage
 * Requires authentication and organizer role
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Verify organizer role
    if (session.user.role !== "organizer") {
      return NextResponse.json(
        { success: false, error: "Access denied - Organizer role required" },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");
    const eventId = formData.get("eventId");
    const ticketTypeId = formData.get("ticketTypeId");

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    if (!ticketTypeId) {
      return NextResponse.json(
        { success: false, error: "Ticket Type ID is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type. Only JPEG, JPG, PNG, and WebP images are allowed",
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds 5MB limit",
        },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload using FileUploadService
    const fileUploadService = new FileUploadService();
    const uploadResult = await fileUploadService.uploadTicketTypeBanner(
      buffer,
      file.name,
      eventId,
      ticketTypeId
    );

    if (!uploadResult.success) {
      console.error("Ticket banner upload failed:", uploadResult.error);
      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error || "Failed to upload ticket banner image",
        },
        { status: 500 }
      );
    }

    // Return success with file details
    return NextResponse.json({
      success: true,
      data: {
        publicUrl: uploadResult.publicUrl,
        filePath: uploadResult.filePath,
        fileName: uploadResult.fileName,
      },
      message: "Ticket banner uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading ticket banner:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
