import NextAuth from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongo";
import {
  findUserByEmail,
  findOrganizerByEmail,
  findAdminByEmail,
} from "@/queries/users";
import { MasterAccount, User, Organizer } from "@/model/model";
import {
  CustomMongoDBAdapter,
  setAuthType,
} from "@/lib/utils/customMongoAdapter";

/**
 * Custom MongoDB Adapter for NextAuth.js
 * Integrates with existing database schema (masteraccounts and user/organizer collections)
 */

// Dynamic authOptions function to allow setting auth type before adapter initialization
function getAuthOptions() {
  return {
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    adapter: CustomMongoDBAdapter(),
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Please provide email and password");
          }

          try {
            await dbConnect();

            const { email, password, userType = "user" } = credentials;

            let userData;
            let accountData;

            // Fetch user or organizer based on userType
            if (userType === "organizer") {
              userData = await findOrganizerByEmail(email);
            } else if (userType === "user") {
              userData = await findUserByEmail(email);
            } else if (userType === "admin") {
              userData = await findAdminByEmail(email);
            }

            if (!userData) {
              throw new Error("No account found with this email");
            }

            const isMatch = await bcrypt.compare(password, userData.password);

            if (!isMatch) {
              throw new Error("Invalid password");
            }

            // Update last login
            await MasterAccount.findOne({ email: email }).then((account) => {
              if (account) {
                account.last_login = new Date();
                account.save();
                accountData = account;
              }
            });

            console.log("User data:", userData);

            // Return user object for session with role information
            return {
              email: userData.email,
              name:
                userType === "organizer"
                  ? userData.organization_name
                  : userType === "admin"
                  ? userData.name
                  : `${userData.first_name} ${userData.last_name}`,
              image:
                userType === "organizer"
                  ? userData.logo
                  : userData.profile_image,
              role: userType, // "user" or "organizer"
              accountId: accountData?.account_id,
              userId: userType === "user" ? userData.user_id : undefined,
              organizerId:
                userType === "organizer" ? userData.organizer_id : undefined,
              adminId: userType === "admin" ? userData.admin_id : undefined,
            };
          } catch (error) {
            console.error("Authorization error:", error);
            throw new Error(error.message || "Authentication failed");
          }
        },
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      }),
    ],

    callbacks: {
      async signIn({ user, account, profile }) {
        try {
          await dbConnect();

          if (account?.provider === "google") {
            // Check if user exists by email
            let masterAccount = await MasterAccount.findOne({
              email: user.email,
            });

            if (masterAccount) {
              // Update OAuth details if not already set
              if (!masterAccount.oauth_id) {
                masterAccount.oauth_id = account.providerAccountId;
                masterAccount.oauth_provider = account.provider;
                masterAccount.email_verified = true;
                masterAccount.last_login = new Date();
                await masterAccount.save();
              } else {
                // Just update last login
                masterAccount.last_login = new Date();
                await masterAccount.save();
              }

              // Update profile image based on role type
              if (masterAccount.role_type === "organizer") {
                const organizerRecord = await Organizer.findOne({
                  account_id: masterAccount.account_id,
                });
                if (
                  organizerRecord &&
                  profile?.picture &&
                  !organizerRecord.logo
                ) {
                  organizerRecord.logo = profile.picture;
                  await organizerRecord.save();
                }
              } else {
                const userRecord = await User.findOne({
                  account_id: masterAccount.account_id,
                });
                if (
                  userRecord &&
                  profile?.picture &&
                  !userRecord.profile_image
                ) {
                  userRecord.profile_image = profile.picture;
                  await userRecord.save();
                }
              }
            }
          }

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      },

      async jwt({ token, user, account, profile }) {
        // Initial sign in
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.role = user.role;
          token.accountId = user.accountId;
          token.userId = user.userId;
          token.organizerId = user.organizerId;
          token.image = user.image;
        }

        // Google OAuth sign in
        if (account?.provider === "google" && profile) {
          try {
            await dbConnect();
            const masterAccount = await MasterAccount.findOne({
              email: token.email,
            });

            if (masterAccount) {
              token.accountId = masterAccount.account_id;
              token.role = masterAccount.role_type;

              if (masterAccount.role_type === "organizer") {
                const organizerRecord = await Organizer.findOne({
                  account_id: masterAccount.account_id,
                });
                token.organizerId = organizerRecord?.organizer_id;
                token.image = organizerRecord?.logo || profile.picture;
              } else {
                const userRecord = await User.findOne({
                  account_id: masterAccount.account_id,
                });
                token.userId = userRecord?.user_id;
                token.image = userRecord?.profile_image || profile.picture;
              }
            }
          } catch (error) {
            console.error("Error in jwt callback:", error);
          }
        }

        return token;
      },

      async session({ session, token }) {
        if (token) {
          session.user.id = token.id;
          session.user.email = token.email;
          session.user.name = token.name;
          session.user.role = token.role;
          session.user.accountId = token.accountId;
          session.user.userId = token.userId;
          session.user.organizerId = token.organizerId;
          session.user.image = token.image;
        }

        return session;
      },
    },

    pages: {
      signIn: "/",
      error: "/",
    },

    events: {
      async signIn({ user }) {
        console.log("User signed in:", user.email);
      },
      async signOut({ token }) {
        console.log("User signed out:", token.email);
      },
    },

    debug: process.env.NODE_ENV === "development",
  };
}

const authOptions = getAuthOptions();
const handler = NextAuth(authOptions);

/**
 * Custom handler wrapper to support dual authentication
 * Reads auth_type cookie and sets adapter auth type before OAuth flow
 */
async function customHandler(req, context) {
  try {
    // Check for auth_type cookie (set by organizer auth page)
    // Note: Next.js 15+ requires cookies() to be awaited
    const cookieStore = await cookies();
    const authTypeCookie = cookieStore.get("auth_type");

    console.log("Cookie check - auth_type:", authTypeCookie?.value);

    if (authTypeCookie?.value === "organizer") {
      // Set auth type for the adapter before OAuth redirect
      setAuthType("organizer");
      console.log("Auth type set to: organizer");
    } else if (authTypeCookie?.value === "user") {
      // Default to user
      setAuthType("user");
      console.log(" Auth type set to: user (default)");
    } else if (authTypeCookie?.value === "admin") {
      setAuthType("admin");
      console.log("Auth type set to: admin");
    }

    // Call the original NextAuth handler
    return await handler(req, context);
  } catch (error) {
    console.error("Error in custom auth handler:", error);
    return await handler(req, context);
  }
}

// Export custom handler for NextAuth (App Router)
export { customHandler as GET, customHandler as POST };

// Export authOptions for use in other parts of the app
export { authOptions };
