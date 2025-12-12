const { MasterAccount, User } = require("@/model/model");
const { getNextSequence } = require("@/lib/db-utils");

/**
 * Create a new user with associated master account
 * @param {Object} userData - User data including email, password, firstName, lastName, phoneNumber
 * @returns {Promise<Object>} Created user object
 */
async function createUser(userData) {
  const { email, password, firstName, lastName, phoneNumber } = userData;

  // Check if user already exists
  const existingAccount = await MasterAccount.findOne({ email });
  if (existingAccount) {
    throw new Error("User with this email already exists");
  }

  // Get next sequence IDs
  const accountId = await getNextSequence("account_id");
  const userId = await getNextSequence("user_id");

  // Create master account
  const masterAccount = await MasterAccount.create({
    account_id: accountId,
    email,
    password_hash: password, // Already hashed
    role_type: "user",
    role_id: userId,
    email_verified: false,
  });

  // Create user profile
  const user = await User.create({
    user_id: userId,
    account_id: accountId,
    first_name: firstName,
    last_name: lastName,
    phone_number: phoneNumber,
  });

  return {
    id: masterAccount._id.toString(),
    email: masterAccount.email,
    name: `${firstName} ${lastName}`,
    user_id: userId,
    account_id: accountId,
  };
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserByEmail(email) {
  const masterAccount = await MasterAccount.findOne({ email });
  if (!masterAccount) return null;

  const user = await User.findOne({ account_id: masterAccount.account_id });

  return {
    id: masterAccount._id.toString(),
    email: masterAccount.email,
    password: masterAccount.password_hash,
    name: user ? `${user.first_name} ${user.last_name}` : "",
    emailVerified: masterAccount.email_verified,
    role: masterAccount.role_type,
    accountId: masterAccount.account_id,
    userId: user?.user_id,
    image: user?.profile_image,
  };
}

/**
 * Create a new organizer with associated master account
 * @param {Object} organizerData - Organizer data including email, password, organizationName, phoneNumber, description, social links
 * @returns {Promise<Object>} Created organizer object
 */
async function createOrganizer(organizerData) {
  const {
    email,
    password,
    organizationName,
    phoneNumber,
    description,
    facebookLink,
    instaLink,
    webLink,
  } = organizerData;

  // Check if account already exists
  const existingAccount = await MasterAccount.findOne({ email });
  if (existingAccount) {
    throw new Error("An account with this email already exists");
  }

  // Import Organizer model
  const { Organizer } = require("@/model/model");

  // Get next sequence IDs
  const accountId = await getNextSequence("account_id");
  const organizerId = await getNextSequence("organizer_id");

  // Create master account
  const masterAccount = await MasterAccount.create({
    account_id: accountId,
    email,
    password_hash: password, // Already hashed
    role_type: "organizer",
    role_id: organizerId,
    email_verified: false,
  });

  // Create organizer profile
  const organizer = await Organizer.create({
    organizer_id: organizerId,
    account_id: accountId,
    organization_name: organizationName,
    phone_number: phoneNumber,
    description: description || null,
    facebook_link: facebookLink || null,
    insta_link: instaLink || null,
    web_link: webLink || null,
    status: "pending", // Requires admin approval
  });

  return {
    id: masterAccount._id.toString(),
    email: masterAccount.email,
    name: organizationName,
    organizer_id: organizerId,
    account_id: accountId,
  };
}

/**
 * Find organizer by email
 * @param {string} email - Organizer email
 * @returns {Promise<Object|null>} Organizer object or null
 */
async function findOrganizerByEmail(email) {
  const masterAccount = await MasterAccount.findOne({ email });
  if (!masterAccount) return null;

  // Import Organizer model
  const { Organizer } = require("@/model/model");

  const organizer = await Organizer.findOne({
    account_id: masterAccount.account_id,
  });

  return {
    id: masterAccount._id.toString(),
    email: masterAccount.email,
    password: masterAccount.password_hash,
    name: organizer?.organization_name || "",
    emailVerified: masterAccount.email_verified,
    role: masterAccount.role_type,
    accountId: masterAccount.account_id,
    organizerId: organizer?.organizer_id,
    image: organizer?.logo,
  };
}

async function createAdmin(adminData) {
  const { email, password, name } = adminData;

  const existingAccount = await MasterAccount.findOne({ email });
  if (existingAccount) {
    throw new Error("An account with this email already exists");
  }

  const { Admin } = require("@/model/model");

  // Get next sequence IDs
  const accountId = await getNextSequence("account_id");
  const adminId = await getNextSequence("admin_id");

  // Create master account
  const masterAccount = await MasterAccount.create({
    account_id: accountId,
    email,
    password_hash: password, // Already hashed
    role_type: "admin",
    role_id: adminId,
    email_verified: false,
  });

  // Create admin profile
  const admin = await Admin.create({
    admin_id: adminId,
    account_id: accountId,
    name: name,
  });

  return {
    id: masterAccount._id.toString(),
    email: masterAccount.email,
    name: admin.name,
    admin_id: adminId,
    account_id: accountId,
  };
}

async function findAdminByEmail(email) {
  const masterAccount = await MasterAccount.findOne({ email });
  if (!masterAccount) return null;

  const { Admin } = require("@/model/model");

  const admin = await Admin.findOne({
    account_id: masterAccount.account_id,
  });

  return {
    id: masterAccount._id.toString(),
    email: masterAccount.email,
    password: masterAccount.password_hash,
    name: admin ? admin.name : "",
    emailVerified: masterAccount.email_verified,
    role: masterAccount.role_type,
    accountId: masterAccount.account_id,
    adminId: admin?.admin_id,
  };
}

module.exports = {
  createUser,
  findUserByEmail,
  createOrganizer,
  findOrganizerByEmail,
  createAdmin,
  findAdminByEmail,
};
