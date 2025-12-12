import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongo";
import { Admin, MasterAccount } from "@/model/model";
import bcrypt from "bcryptjs";
import { getNextSequence } from "@/lib/db-utils";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    await dbConnect();

    // Fetch all admins
    const admins = await Admin.find({}).sort({ created_at: -1 }).lean();

    // Fetch associated master accounts
    const adminData = await Promise.all(
      admins.map(async (admin) => {
        const masterAccount = await MasterAccount.findOne({
          account_id: admin.account_id,
        }).lean();

        return {
          admin_id: admin.admin_id,
          name: admin.name,
          email: masterAccount?.email || "N/A",
          email_verified: masterAccount?.email_verified || false,
          created_at: admin.created_at,
          last_login: masterAccount?.last_login || null,
          account_id: admin.account_id,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: adminData,
      count: adminData.length,
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingAccount = await MasterAccount.findOne({ email });
    if (existingAccount) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const accountId = await getNextSequence("account_id");
    const adminId = await getNextSequence("admin_id");

    const hashedPassword = await bcrypt.hash(password, 10);

    const masterAccount = await MasterAccount.create({
      account_id: accountId,
      email,
      password_hash: hashedPassword,
      role_type: "admin",
      role_id: adminId,
      email_verified: false,
    });

    const admin = await Admin.create({
      admin_id: adminId,
      account_id: accountId,
      name,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Admin created successfully",
        data: {
          admin_id: admin.admin_id,
          name: admin.name,
          email: masterAccount.email,
          created_at: admin.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Failed to create admin", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const admin = await Admin.findOne({ admin_id: parseInt(adminId) });
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Prevent self-deletion
    if (session.user.adminId === parseInt(adminId)) {
      return NextResponse.json(
        { error: "Cannot delete your own admin account" },
        { status: 403 }
      );
    }

    await MasterAccount.deleteOne({ account_id: admin.account_id });
    await Admin.deleteOne({ admin_id: parseInt(adminId) });

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { error: "Failed to delete admin", details: error.message },
      { status: 500 }
    );
  }
}
