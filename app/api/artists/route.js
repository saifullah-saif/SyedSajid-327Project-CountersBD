import mongoose from "mongoose";
import { Artist } from "@/model/model";
import dbConnect from "@/lib/mongo";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await dbConnect();
    const artists = await Artist.find({})
      .select("artist_id name bio image -_id")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, data: artists });
  } catch (error) {
    console.error("Error fetching artists:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch artists",
    });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Artist name is required",
        },
        { status: 400 }
      );
    }

    // Get the highest artist_id and increment
    const lastArtist = await Artist.findOne()
      .sort({ artist_id: -1 })
      .select("artist_id")
      .lean();

    const newArtistId = lastArtist ? lastArtist.artist_id + 1 : 1;

    // Create new artist
    const newArtist = await Artist.create({
      artist_id: newArtistId,
      name: body.name,
      bio: body.bio || null,
      image: body.image || null,
    });

    // Return the created artist
    const artistData = {
      artist_id: newArtist.artist_id,
      name: newArtist.name,
      bio: newArtist.bio,
      image: newArtist.image,
    };

    return NextResponse.json(
      {
        success: true,
        data: artistData,
        message: "Artist created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating artist:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create artist",
      },
      { status: 500 }
    );
  }
}
