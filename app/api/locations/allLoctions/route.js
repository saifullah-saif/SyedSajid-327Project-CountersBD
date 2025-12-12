import { Location } from "@/model/model";
import dbConnect from "@/lib/mongo";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await dbConnect();
    const locations = await Location.find({})
      .select("location_id city address venue_name map_link -_id")
      .sort({ city: 1 })
      .lean();

    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch locations",
    });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate required fields
    if (!body.city) {
      return NextResponse.json(
        {
          success: false,
          error: "City is required",
        },
        { status: 400 }
      );
    }

    // Get the highest location_id and increment
    const lastLocation = await Location.findOne()
      .sort({ location_id: -1 })
      .select("location_id")
      .lean();

    const newLocationId = lastLocation ? lastLocation.location_id + 1 : 1;

    // Create new location
    const newLocation = await Location.create({
      location_id: newLocationId,
      city: body.city,
      venue_name: body.venue_name || null,
      address: body.address || null,
      map_link: body.map_link || null,
    });

    // Return the created location
    const locationData = {
      location_id: newLocation.location_id,
      city: newLocation.city,
      venue_name: newLocation.venue_name,
      address: newLocation.address,
      map_link: newLocation.map_link,
    };

    return NextResponse.json(
      {
        success: true,
        data: locationData,
        message: "Location created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create location",
      },
      { status: 500 }
    );
  }
}
