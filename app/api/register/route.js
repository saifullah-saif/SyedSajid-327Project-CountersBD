import { NextResponse } from "next/server";
import { createUser, createOrganizer } from "@/queries/users";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongo";

export const POST = async (request) => {
  try {
    const requestData = await request.json();
    const { email, password, userType = "user" } = requestData;

    // Validate common required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let result;

    if (userType === "organizer") {
      // Organizer registration
      const {
        organizationName,
        phoneNumber,
        description,
        facebookLink,
        instaLink,
        webLink,
      } = requestData;

      if (!organizationName) {
        return NextResponse.json(
          { success: false, error: "Organization name is required" },
          { status: 400 }
        );
      }

      const newOrganizer = {
        email,
        password: hashedPassword,
        organizationName,
        phoneNumber: phoneNumber || "",
        description: description || "",
        facebookLink: facebookLink || "",
        instaLink: instaLink || "",
        webLink: webLink || "",
      };

      result = await createOrganizer(newOrganizer);

      return NextResponse.json(
        {
          success: true,
          message:
            "Organizer account created successfully. Your account is pending approval.",
          user: {
            id: result.id,
            email: result.email,
            name: result.name,
            role: "organizer",
          },
        },
        { status: 201 }
      );
    } else if (userType === "user") {
      // User registration
      const { firstName, lastName, phoneNumber } = requestData;

      if (!firstName || !lastName) {
        return NextResponse.json(
          { success: false, error: "First name and last name are required" },
          { status: 400 }
        );
      }

      const newUser = {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber: phoneNumber || "",
      };

      result = await createUser(newUser);

      return NextResponse.json(
        {
          success: true,
          message: "User has been created successfully",
          user: {
            id: result.id,
            email: result.email,
            name: result.name,
            role: "user",
          },
        },
        { status: 201 }
      );
    } else if (userType === "admin") {
      const { name } = requestData;

      if (!name) {
        return NextResponse.json(
          { success: false, error: "Name is required for admin registration" },
          { status: 400 }
        );
      }

      const newAdmin = {
        email,
        password: hashedPassword,
        name,
      };

      result = await createAdmin(newAdmin);

      return NextResponse.json(
        { success: false, error: "Admin registration not implemented" },
        { status: 501 }
      );
    }
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "An error occurred during registration",
      },
      { status: 500 }
    );
  }
};
