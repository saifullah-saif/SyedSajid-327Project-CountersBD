import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongo";
import { MasterAccount } from "@/model/model";
import bcrypt from "bcryptjs";

/**
 * PUT /api/user/password
 * Change user password
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accountId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const accountId = session.user.accountId;
    const body = await request.json();

    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password and new password are required",
        },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    // Password strength validation
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasNumber || !hasSpecialChar) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least one number and one special character",
        },
        { status: 400 }
      );
    }

    // Fetch master account
    const account = await MasterAccount.findOne({ account_id: accountId });

    if (!account) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 }
      );
    }

    // Check if account uses OAuth (Google login)
    if (account.oauth_provider && !account.password_hash) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot change password for OAuth accounts. Please use your OAuth provider.",
        },
        { status: 400 }
      );
    }

    // Verify current password
    if (!account.password_hash) {
      return NextResponse.json(
        {
          success: false,
          message: "No password set for this account",
        },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      account.password_hash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      account.password_hash
    );

    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be different from current password",
        },
        { status: 400 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    account.password_hash = hashedPassword;
    await account.save();

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update password" },
      { status: 500 }
    );
  }
}
