import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import { Location } from "@/model/model";

/**
 * @route GET /api/locations
 * @description Fetch unique locations (cities) from events
 */
export async function GET(request) {
  try {
    await dbConnect();

    
    const locations = await Location.distinct("city");

    return NextResponse.json({
      success: true,
      count: locations.length,
      data: locations.sort(),
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch locations",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
