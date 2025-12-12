const dbConnect = require("@/lib/mongo");
const { MasterAccount, User, Organizer } = require("@/model/model");
const { getNextSequence } = require("@/lib/db-utils");

/**
 * Custom MongoDB Adapter for NextAuth.js
 * Integrates with existing database schema (masteraccounts and user/organizer collections)
 */

// Global variable to store auth type during OAuth flow
let currentAuthType = "user";

export const CustomMongoDBAdapter = () => {
  return {
    async createUser(user) {
      try {
        await dbConnect();

        console.log("createUser called with:", {
          email: user.email,
          name: user.name,
          currentAuthType,
        });

        // Check if account already exists by email
        const existingAccount = await MasterAccount.findOne({
          email: user.email,
        });

        if (existingAccount) {
          console.log("✅ Found existing account:", {
            accountId: existingAccount.account_id,
            roleType: existingAccount.role_type,
          });

          // CRITICAL: Validate role_type matches currentAuthType
          if (existingAccount.role_type !== currentAuthType) {
            const errorMsg = `This email is already registered as a ${existingAccount.role_type}. Please use a different email to register as ${currentAuthType}, or sign in to your existing ${existingAccount.role_type} account.`;
            console.error("❌ Role type mismatch:", {
              existing: existingAccount.role_type,
              requested: currentAuthType,
            });
            throw new Error(errorMsg);
          }

          // Fetch existing user/organizer data based on role type
          if (existingAccount.role_type === "organizer") {
            const existingOrganizer = await Organizer.findOne({
              account_id: existingAccount.account_id,
            });

            return {
              id: existingAccount._id.toString(),
              email: existingAccount.email,
              emailVerified: existingAccount.email_verified
                ? new Date(existingAccount.email_verified)
                : null,
              name: existingOrganizer?.organization_name || user.name || "",
              image: existingOrganizer?.logo || user.image || null,
              accountId: existingAccount.account_id,
              organizerId: existingOrganizer?.organizer_id,
              role: existingAccount.role_type,
            };
          } else {
            // Default to user
            const existingUser = await User.findOne({
              account_id: existingAccount.account_id,
            });

            return {
              id: existingAccount._id.toString(),
              email: existingAccount.email,
              emailVerified: existingAccount.email_verified
                ? new Date(existingAccount.email_verified)
                : null,
              name: existingUser
                ? `${existingUser.first_name} ${existingUser.last_name}`
                : user.name || "",
              image: existingUser?.profile_image || user.image || null,
              accountId: existingAccount.account_id,
              userId: existingUser?.user_id,
              role: existingAccount.role_type,
            };
          }
        }

        // Create new account based on auth type
        const accountId = await getNextSequence("account_id");
        const isOrganizer = currentAuthType === "organizer";
        const roleType = isOrganizer ? "organizer" : "user";
        const roleId = await getNextSequence(
          isOrganizer ? "organizer_id" : "user_id"
        );

        console.log("🆕 Creating new account:", {
          accountId,
          roleType,
          roleId,
          isOrganizer,
        });

        // Create master account
        const masterAccount = await MasterAccount.create({
          account_id: accountId,
          email: user.email,
          role_type: roleType,
          role_id: roleId,
          email_verified: user.emailVerified ? true : false,
          oauth_provider: "google",
          oauth_id: user.id, // Store OAuth provider ID
          last_login: new Date(),
        });

        console.log("✅ MasterAccount created:", masterAccount.account_id);

        if (isOrganizer) {
          // Create organizer profile
          const newOrganizer = await Organizer.create({
            organizer_id: roleId,
            account_id: accountId,
            organization_name: user.name || "New Organization",
            logo: user.image || null,
            status: "pending", // Requires admin approval
          });

          console.log("✅ Organizer created:", {
            organizerId: newOrganizer.organizer_id,
            organizationName: newOrganizer.organization_name,
          });

          return {
            id: masterAccount._id.toString(),
            email: masterAccount.email,
            emailVerified: masterAccount.email_verified ? new Date() : null,
            name: newOrganizer.organization_name,
            image: user.image || null,
            accountId: accountId,
            organizerId: roleId,
            role: roleType,
          };
        } else {
          // Create user profile
          const nameParts = (user.name || "").split(" ");
          const firstName = nameParts[0] || "User";
          const lastName = nameParts.slice(1).join(" ") || "";

          const newUser = await User.create({
            user_id: roleId,
            account_id: accountId,
            first_name: firstName,
            last_name: lastName,
            profile_image: user.image || null,
          });

          console.log("✅ User created:", {
            userId: newUser.user_id,
            name: `${firstName} ${lastName}`,
          });

          return {
            id: masterAccount._id.toString(),
            email: masterAccount.email,
            emailVerified: masterAccount.email_verified ? new Date() : null,
            name: `${firstName} ${lastName}`,
            image: user.image || null,
            accountId: accountId,
            userId: roleId,
            role: roleType,
          };
        }
      } catch (error) {
        console.error("❌ Error in createUser:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
        });
        throw error;
      }
    },

    async getUser(id) {
      try {
        await dbConnect();
        const masterAccount = await MasterAccount.findById(id);

        if (!masterAccount) return null;

        if (masterAccount.role_type === "organizer") {
          const organizer = await Organizer.findOne({
            account_id: masterAccount.account_id,
          });

          return {
            id: masterAccount._id.toString(),
            email: masterAccount.email,
            emailVerified: masterAccount.email_verified
              ? new Date(masterAccount.email_verified)
              : null,
            name: organizer?.organization_name || "",
            image: organizer?.logo || null,
            accountId: masterAccount.account_id,
            organizerId: organizer?.organizer_id,
            role: masterAccount.role_type,
          };
        } else {
          const user = await User.findOne({
            account_id: masterAccount.account_id,
          });

          return {
            id: masterAccount._id.toString(),
            email: masterAccount.email,
            emailVerified: masterAccount.email_verified
              ? new Date(masterAccount.email_verified)
              : null,
            name: user ? `${user.first_name} ${user.last_name}` : "",
            image: user?.profile_image || null,
            accountId: masterAccount.account_id,
            userId: user?.user_id,
            role: masterAccount.role_type,
          };
        }
      } catch (error) {
        console.error("Error in getUser:", error);
        return null;
      }
    },

    async getUserByEmail(email) {
      try {
        await dbConnect();
        const masterAccount = await MasterAccount.findOne({ email });

        if (!masterAccount) return null;

        // CRITICAL: Check if role_type matches currentAuthType during OAuth flow
        // If there's a mismatch, return null to prevent linking OAuth to wrong account type
        if (masterAccount.role_type !== currentAuthType) {
          console.log("⚠️ getUserByEmail: role_type mismatch", {
            found: masterAccount.role_type,
            expected: currentAuthType,
            email: email,
          });
          // Return null so NextAuth will call createUser, which will throw appropriate error
          return null;
        }

        if (masterAccount.role_type === "organizer") {
          const organizer = await Organizer.findOne({
            account_id: masterAccount.account_id,
          });

          return {
            id: masterAccount._id.toString(),
            email: masterAccount.email,
            emailVerified: masterAccount.email_verified
              ? new Date(masterAccount.email_verified)
              : null,
            name: organizer?.organization_name || "",
            image: organizer?.logo || null,
            accountId: masterAccount.account_id,
            organizerId: organizer?.organizer_id,
            role: masterAccount.role_type,
          };
        } else {
          const user = await User.findOne({
            account_id: masterAccount.account_id,
          });

          return {
            id: masterAccount._id.toString(),
            email: masterAccount.email,
            emailVerified: masterAccount.email_verified
              ? new Date(masterAccount.email_verified)
              : null,
            name: user ? `${user.first_name} ${user.last_name}` : "",
            image: user?.profile_image || null,
            accountId: masterAccount.account_id,
            userId: user?.user_id,
            role: masterAccount.role_type,
          };
        }
      } catch (error) {
        console.error("Error in getUserByEmail:", error);
        return null;
      }
    },

    async getUserByAccount({ providerAccountId, provider }) {
      try {
        await dbConnect();

        const masterAccount = await MasterAccount.findOne({
          oauth_id: providerAccountId,
          oauth_provider: provider,
        });

        if (!masterAccount) return null;

        if (masterAccount.role_type === "organizer") {
          const organizer = await Organizer.findOne({
            account_id: masterAccount.account_id,
          });

          return {
            id: masterAccount._id.toString(),
            email: masterAccount.email,
            emailVerified: masterAccount.email_verified
              ? new Date(masterAccount.email_verified)
              : null,
            name: organizer?.organization_name || "",
            image: organizer?.logo || null,
            accountId: masterAccount.account_id,
            organizerId: organizer?.organizer_id,
            role: masterAccount.role_type,
          };
        } else {
          const user = await User.findOne({
            account_id: masterAccount.account_id,
          });

          return {
            id: masterAccount._id.toString(),
            email: masterAccount.email,
            emailVerified: masterAccount.email_verified
              ? new Date(masterAccount.email_verified)
              : null,
            name: user ? `${user.first_name} ${user.last_name}` : "",
            image: user?.profile_image || null,
            accountId: masterAccount.account_id,
            userId: user?.user_id,
            role: masterAccount.role_type,
          };
        }
      } catch (error) {
        console.error("Error in getUserByAccount:", error);
        return null;
      }
    },

    async updateUser(user) {
      try {
        await dbConnect();

        const updates = {};
        if (user.email) updates.email = user.email;
        if (user.emailVerified !== undefined)
          updates.email_verified = user.emailVerified;
        updates.last_login = new Date();

        const masterAccount = await MasterAccount.findByIdAndUpdate(
          user.id,
          updates,
          { new: true }
        );

        if (!masterAccount) throw new Error("User not found");

        if (masterAccount.role_type === "organizer") {
          const organizer = await Organizer.findOne({
            account_id: masterAccount.account_id,
          });

          if (organizer && (user.name || user.image)) {
            const organizerUpdates = {};
            if (user.name) organizerUpdates.organization_name = user.name;
            if (user.image) organizerUpdates.logo = user.image;

            await Organizer.findOneAndUpdate(
              { account_id: masterAccount.account_id },
              organizerUpdates,
              { new: true }
            );
          }

          const updatedOrganizer = await Organizer.findOne({
            account_id: masterAccount.account_id,
          });

          return {
            id: masterAccount._id.toString(),
            email: masterAccount.email,
            emailVerified: masterAccount.email_verified
              ? new Date(masterAccount.email_verified)
              : null,
            name: updatedOrganizer?.organization_name || "",
            image: updatedOrganizer?.logo || null,
            accountId: masterAccount.account_id,
            organizerId: updatedOrganizer?.organizer_id,
            role: masterAccount.role_type,
          };
        } else {
          if (user.name || user.image) {
            const userUpdates = {};
            if (user.name) {
              const nameParts = user.name.split(" ");
              userUpdates.first_name = nameParts[0] || "User";
              userUpdates.last_name = nameParts.slice(1).join(" ") || "";
            }
            if (user.image) userUpdates.profile_image = user.image;

            await User.findOneAndUpdate(
              { account_id: masterAccount.account_id },
              userUpdates,
              { new: true }
            );
          }

          const updatedUser = await User.findOne({
            account_id: masterAccount.account_id,
          });

          return {
            id: masterAccount._id.toString(),
            email: masterAccount.email,
            emailVerified: masterAccount.email_verified
              ? new Date(masterAccount.email_verified)
              : null,
            name: updatedUser
              ? `${updatedUser.first_name} ${updatedUser.last_name}`
              : "",
            image: updatedUser?.profile_image || null,
            accountId: masterAccount.account_id,
            userId: updatedUser?.user_id,
            role: masterAccount.role_type,
          };
        }
      } catch (error) {
        console.error("Error in updateUser:", error);
        throw error;
      }
    },

    async linkAccount(account) {
      try {
        await dbConnect();

        // Find the user by their MongoDB ID
        const masterAccount = await MasterAccount.findById(account.userId);

        if (!masterAccount) {
          throw new Error("User not found for linking account");
        }

        // Update the master account with OAuth details
        masterAccount.oauth_id = account.providerAccountId;
        masterAccount.oauth_provider = account.provider;
        masterAccount.email_verified = true;
        masterAccount.last_login = new Date();

        await masterAccount.save();

        return {
          id: masterAccount._id.toString(),
          userId: masterAccount._id.toString(),
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
        };
      } catch (error) {
        console.error("Error in linkAccount:", error);
        throw error;
      }
    },

    async createSession({ sessionToken, userId, expires }) {
      try {
        await dbConnect();

        await MasterAccount.findByIdAndUpdate(userId, {
          last_login: new Date(),
        });

        return {
          sessionToken,
          userId,
          expires,
        };
      } catch (error) {
        console.error("Error in createSession:", error);
        throw error;
      }
    },

    // Method to set auth type before OAuth flow
    setAuthType(type) {
      currentAuthType = type;
    },
  };
};

// Export setter for auth type
export const setAuthType = (type) => {
  currentAuthType = type;
};
