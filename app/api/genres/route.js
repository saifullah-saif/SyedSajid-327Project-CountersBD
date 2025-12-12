import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import mongoose from "mongoose";
import { Genre } from "@/model/model";
/**
 * @route GET /api/genres
 * @description Fetch all genres
 */
export async function GET(request) {
  try {
    await dbConnect();

    
    const genres = await Genre.find({})
      .select("genre_id name icon -_id")
      .sort({ name: 1 })
      .lean();

    // Transform to match frontend expected structure
    const formattedGenres = genres.map((genre) => ({
      id: genre.genre_id,
      name: genre.name,
      icon: genre.icon || null,
    }));

    return NextResponse.json({
      success: true,
      count: formattedGenres.length,
      data: formattedGenres,
    });
  } catch (error) {
    console.error("Error fetching genres:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch genres",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
