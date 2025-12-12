import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongo";
import { User, MasterAccount } from "@/model/model";
import FileUploadService from "@/lib/fileUploadService";

const fileUploadService = new FileUploadService();

/**
 * GET /api/user/profile
 * Fetch user profile data
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const userId = session.user.userId;

    // Fetch user data with only required fields
    const user = await User.findOne({ user_id: userId }).select(
      "user_id first_name last_name phone_number profile_image gender dob created_at"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Fetch email from MasterAccount
    const account = await MasterAccount.findOne({
      account_id: session.user.accountId,
    }).select("email");

    const profileData = {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: account?.email || session.user.email,
      phone_number: user.phone_number,
      profile_image: user.profile_image,
      gender: user.gender,
      dob: user.dob,
      created_at: user.created_at,
    };

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update user profile data
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const userId = session.user.userId;
    const body = await request.json();

    const {
      first_name,
      last_name,
      phone_number,
      gender,
      dob,
      profile_image,
      email,
    } = body;

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json(
        { success: false, message: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Handle image upload if new image is provided (base64)
    let imageUrl = profile_image;
    if (profile_image && profile_image.startsWith("data:image")) {
      try {
        // Convert base64 to buffer
        const base64Data = profile_image.replace(
          /^data:image\/\w+;base64,/,
          ""
        );
        const imageBuffer = Buffer.from(base64Data, "base64");

        // Determine file extension from mime type
        const mimeMatch = profile_image.match(/^data:image\/(\w+);base64,/);
        const extension = mimeMatch ? mimeMatch[1] : "jpg";
        const fileName = `profile.${extension}`;

        const uploadResult = await fileUploadService.uploadProfileImage(
          imageBuffer,
          fileName,
          userId
        );
        imageUrl = uploadResult.publicUrl;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return NextResponse.json(
          { success: false, message: "Failed to upload profile image" },
          { status: 500 }
        );
      }
    }

    // Update user profile
    const updateData = {
      first_name,
      last_name,
      phone_number: phone_number || null,
      gender: gender || null,
      dob: dob ? new Date(dob) : null,
    };

    if (imageUrl) {
      updateData.profile_image = imageUrl;
    }

    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      updateData,
      { new: true, runValidators: true }
    ).select(
      "user_id first_name last_name phone_number profile_image gender dob"
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update email in MasterAccount if provided and different
    if (email && email !== session.user.email) {
      // Check if email is already taken
      const existingAccount = await MasterAccount.findOne({ email });
      if (
        existingAccount &&
        existingAccount.account_id !== session.user.accountId
      ) {
        return NextResponse.json(
          { success: false, message: "Email is already in use" },
          { status: 400 }
        );
      }

      await MasterAccount.findOneAndUpdate(
        { account_id: session.user.accountId },
        { email }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user_id: updatedUser.user_id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: email || session.user.email,
        phone_number: updatedUser.phone_number,
        profile_image: updatedUser.profile_image,
        gender: updatedUser.gender,
        dob: updatedUser.dob,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
