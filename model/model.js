const mongoose = require("mongoose");
const dbConnect = require("../lib/mongo");
const { Schema } = mongoose;

dbConnect();

// ============================================
// ENUMS
// ============================================
const EventStatusType = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  LIVE: "live",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const PaymentStatusType = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
};

const RoleType = {
  USER: "user",
  ORGANIZER: "organizer",
  ADMIN: "admin",
};

const OrganizerStatusType = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const SenderTypeEnum = {
  SYSTEM: "system",
  ORGANIZER: "organizer",
};

// ============================================
// NESTED SCHEMAS (for embedded documents)
// ============================================

// Ticket Type Schema (embedded in Event Categories)
const TicketTypeSchema = new Schema(
  {
    ticket_type_id: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: String,
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    quantity_available: {
      type: Number,
      required: true,
    },
    max_per_order: {
      type: Number,
      default: 10,
    },
    banner: {
      type: String,
      maxlength: 255,
    },
    pdf_template: {
      type: String,
      maxlength: 255,
    },
  },
  { _id: false }
);

// Event Category Schema (embedded in Events)
const EventCategorySchema = new Schema(
  {
    category_id: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: String,
    category_type: {
      type: String,
      maxlength: 100,
    },
    ticket_types: [TicketTypeSchema],
  },
  { _id: false }
);

// Event Artist Schema (embedded reference)
const EventArtistSchema = new Schema(
  {
    artist_id: {
      type: Number,
      required: true,
      ref: "Artist",
    },
    name: {
      type: String,
      maxlength: 255,
    },
    bio: String,
    image: {
      type: String,
      maxlength: 255,
    },
  },
  { _id: false }
);

// ============================================
// MAIN SCHEMAS
// ============================================

// Master Accounts Schema
const MasterAccountSchema = new Schema(
  {
    account_id: {
      type: Number,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 255,
    },
    role_type: {
      type: String,
      enum: Object.values(RoleType),
      default: RoleType.USER,
    },
    role_id: Number,
    oauth_id: {
      type: String,
      maxlength: 255,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    last_login: Date,
    oauth_provider: {
      type: String,
      maxlength: 50,
    },
    password_hash: {
      type: String,
      maxlength: 255,
    },
    reset_token: {
      type: String,
      maxlength: 255,
    },
    reset_token_expires: Date,
    verification_token: {
      type: String,
      maxlength: 255,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// User Schema
const UserSchema = new Schema(
  {
    user_id: {
      type: Number,
      required: true,
      unique: true,
    },
    account_id: {
      type: Number,
      ref: "MasterAccount",
    },
    first_name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    last_name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    phone_number: {
      type: String,
      maxlength: 20,
    },
    profile_image: {
      type: String,
      maxlength: 255,
    },
    gender: {
      type: String,
      maxlength: 255,
    },
    dob: Date,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Admin Schema
const AdminSchema = new Schema({
  admin_id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    maxlength: 100,
  },
  account_id: {
    type: Number,
    unique: true,
    ref: "MasterAccount",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Organizer Schema
const OrganizerSchema = new Schema(
  {
    organizer_id: {
      type: Number,
      required: true,
      unique: true,
    },
    account_id: {
      type: Number,
      unique: true,
      ref: "MasterAccount",
    },
    organization_name: {
      type: String,
      required: true,
      maxlength: 255,
    },
    phone_number: {
      type: String,
      maxlength: 20,
    },
    logo: {
      type: String,
      maxlength: 255,
    },
    description: String,
    facebook_link: {
      type: String,
      maxlength: 255,
    },
    insta_link: {
      type: String,
      maxlength: 255,
    },
    web_link: {
      type: String,
      maxlength: 255,
    },
    status: {
      type: String,
      enum: Object.values(OrganizerStatusType),
      default: OrganizerStatusType.PENDING,
    },
    event_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Artist Schema
const ArtistSchema = new Schema({
  artist_id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    maxlength: 255,
  },
  bio: String,
  image: {
    type: String,
    maxlength: 255,
  },
});

// Genre Schema
const GenreSchema = new Schema({
  genre_id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100,
  },
  icon: {
    type: String,
    maxlength: 255,
  },
});

// Location Schema
const LocationSchema = new Schema({
  location_id: {
    type: Number,
    required: true,
    unique: true,
  },
  city: {
    type: String,
    required: true,
    maxlength: 100,
  },
  venue_name: {
    type: String,
    maxlength: 255,
  },
  address: String,
  map_link: {
    type: String,
    maxlength: 255,
  },
});

// Event Schema (with embedded categories and ticket types)
const EventSchema = new Schema(
  {
    event_id: {
      type: Number,
      required: true,
      unique: true,
    },
    organizer_id: {
      type: Number,
      required: true,
      ref: "Organizer",
    },
    title: {
      type: String,
      required: true,
      maxlength: 255,
    },
    description: String,
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    start_time: Date,
    banner_image: {
      type: String,
      maxlength: 255,
    },
    venue_name: {
      type: String,
      maxlength: 255,
    },
    location_id: {
      type: Number,
      ref: "Location",
    },
    genre_id: {
      type: Number,
      ref: "Genre",
    },
    tickets_sale_start: {
      type: Date,
      required: true,
    },
    tickets_sale_end: {
      type: Date,
      required: true,
    },
    event_policy: String,
    status: {
      type: String,
      enum: Object.values(EventStatusType),
      default: EventStatusType.DRAFT,
    },
    // Embedded Artists
    artists: [EventArtistSchema],
    // Embedded Categories with Ticket Types
    categories: [EventCategorySchema],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Indexes for Event Schema
EventSchema.index({ organizer_id: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ start_date: 1 });
EventSchema.index({ location_id: 1 });
EventSchema.index({ genre_id: 1 });
EventSchema.index({ "categories.category_id": 1 });
EventSchema.index({ "categories.ticket_types.ticket_type_id": 1 });

// Order Item Schema
const OrderItemSchema = new Schema(
  {
    order_item_id: {
      type: Number,
      required: true,
    },
    ticket_type_id: {
      type: Number,
      required: true,
    },
    event_id: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    unit_price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
  },
  { _id: false }
);

// Order Attendee Info Schema
const OrderAttendeeInfoSchema = new Schema(
  {
    ticket_type_id: {
      type: Number,
      required: true,
    },
    attendee_name: {
      type: String,
      required: true,
    },
    attendee_email: {
      type: String,
      required: true,
    },
    attendee_phone: {
      type: String,
      required: true,
    },
  },
  { _id: false, timestamps: true }
);

// Order Schema
const OrderSchema = new Schema({
  order_id: {
    type: Number,
    required: true,
    unique: true,
  },
  user_id: {
    type: Number,
    required: true,
    ref: "User",
  },
  total_amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  additional_fees: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.0,
  },
  payment_status: {
    type: String,
    enum: Object.values(PaymentStatusType),
    default: PaymentStatusType.PENDING,
  },
  payment_method: {
    type: String,
    maxlength: 50,
  },
  transaction_id: {
    type: String,
    maxlength: 255,
  },
  order_items: [OrderItemSchema],
  attendee_info: [OrderAttendeeInfoSchema],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

OrderSchema.index({ user_id: 1 });
OrderSchema.index({ payment_status: 1 });

// Ticket Schema
const TicketSchema = new Schema({
  ticket_id: {
    type: Number,
    required: true,
    unique: true,
  },
  order_id: {
    type: Number,
    required: true,
    ref: "Order",
  },
  event_id: {
    type: Number,
    required: true,
    ref: "Event",
  },
  ticket_type_id: {
    type: Number,
    required: true,
  },
  pass_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 255,
  },
  is_validated: {
    type: Boolean,
    default: false,
  },
  validation_time: Date,
  user_ticketpdf: {
    type: String,
    maxlength: 255,
  },
  attendee_email: {
    type: String,
    maxlength: 255,
  },
  attendee_name: {
    type: String,
    maxlength: 255,
  },
  attendee_phone: {
    type: String,
    maxlength: 255,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

TicketSchema.index({ order_id: 1 });
TicketSchema.index({ pass_id: 1 });
TicketSchema.index({ is_validated: 1 });

// Wishlist Schema
const WishlistSchema = new Schema({
  wishlist_id: {
    type: Number,
    required: true,
    unique: true,
  },
  user_id: {
    type: Number,
    required: true,
    ref: "User",
  },
  event_id: {
    type: Number,
    required: true,
    ref: "Event",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

WishlistSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

// Email Reminder Schema
const EmailReminderSchema = new Schema({
  reminder_id: {
    type: Number,
    required: true,
    unique: true,
  },
  user_id: {
    type: Number,
    required: true,
    ref: "User",
  },
  event_id: {
    type: Number,
    required: true,
    ref: "Event",
  },
  email_sent: {
    type: Boolean,
    default: false,
  },
  scheduled_date: {
    type: Date,
    required: true,
  },
  mail_text: {
    type: String,
    maxlength: 255,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Notification Schema
const NotificationSchema = new Schema({
  notification_id: {
    type: Number,
    required: true,
    unique: true,
  },
  sender_id: Number,
  sender_type: {
    type: String,
    enum: Object.values(SenderTypeEnum),
    default: SenderTypeEnum.SYSTEM,
  },
  recipient_id: {
    type: Number,
    required: true,
    ref: "User",
  },
  event_id: {
    type: Number,
    ref: "Event",
  },
  title: {
    type: String,
    required: true,
    maxlength: 255,
  },
  message: {
    type: String,
    required: true,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

NotificationSchema.index({ recipient_id: 1, is_read: 1 });

// Sales Analytics Schemas
const EventSalesSchema = new Schema({
  event_sales_id: {
    type: Number,
    required: true,
    unique: true,
  },
  event_id: {
    type: Number,
    ref: "Event",
  },
  organizer_id: {
    type: Number,
    ref: "Organizer",
  },
  tickets_sold: Number,
  total_revenue: mongoose.Schema.Types.Decimal128,
  last_updated: {
    type: Date,
    default: Date.now,
  },
});

const DailySalesSchema = new Schema({
  daily_sales_id: {
    type: Number,
    required: true,
    unique: true,
  },
  event_id: {
    type: Number,
    ref: "Event",
  },
  organizer_id: {
    type: Number,
    ref: "Organizer",
  },
  sale_date: Date,
  tickets_sold: Number,
  revenue: mongoose.Schema.Types.Decimal128,
});

DailySalesSchema.index({ event_id: 1, sale_date: 1 }, { unique: true });

const CategorySalesSchema = new Schema({
  category_sales_id: {
    type: Number,
    required: true,
    unique: true,
  },
  event_id: {
    type: Number,
    ref: "Event",
  },
  organizer_id: {
    type: Number,
    ref: "Organizer",
  },
  category_id: Number,
  tickets_sold: Number,
  revenue: mongoose.Schema.Types.Decimal128,
  last_updated: {
    type: Date,
    default: Date.now,
  },
});

const TicketTypeSalesSchema = new Schema({
  ticket_type_sales_id: {
    type: Number,
    required: true,
    unique: true,
  },
  event_id: {
    type: Number,
    ref: "Event",
  },
  organizer_id: {
    type: Number,
    ref: "Organizer",
  },
  ticket_type_id: Number,
  tickets_sold: Number,
  revenue: mongoose.Schema.Types.Decimal128,
  last_updated: {
    type: Date,
    default: Date.now,
  },
});

const OrganizerSalesSchema = new Schema({
  organizer_sales_id: {
    type: Number,
    required: true,
    unique: true,
  },
  organizer_id: {
    type: Number,
    ref: "Organizer",
  },
  total_events: Number,
  active_events: Number,
  total_tickets_sold: Number,
  total_revenue: mongoose.Schema.Types.Decimal128,
  last_updated: {
    type: Date,
    default: Date.now,
  },
});

// ============================================
// CREATE MODELS
// ============================================
// Use mongoose.models to prevent recompilation in Next.js hot reload
const MasterAccount =
  mongoose.models.MasterAccount ||
  mongoose.model("MasterAccount", MasterAccountSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
const Organizer =
  mongoose.models.Organizer || mongoose.model("Organizer", OrganizerSchema);
const Artist = mongoose.models.Artist || mongoose.model("Artist", ArtistSchema);
const Genre = mongoose.models.Genre || mongoose.model("Genre", GenreSchema);
const Location =
  mongoose.models.Location || mongoose.model("Location", LocationSchema);
const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
const Wishlist =
  mongoose.models.Wishlist || mongoose.model("Wishlist", WishlistSchema);
const EmailReminder =
  mongoose.models.EmailReminder ||
  mongoose.model("EmailReminder", EmailReminderSchema);
const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
const EventSales =
  mongoose.models.EventSales || mongoose.model("EventSales", EventSalesSchema);
const DailySales =
  mongoose.models.DailySales || mongoose.model("DailySales", DailySalesSchema);
const CategorySales =
  mongoose.models.CategorySales ||
  mongoose.model("CategorySales", CategorySalesSchema);
const TicketTypeSales =
  mongoose.models.TicketTypeSales ||
  mongoose.model("TicketTypeSales", TicketTypeSalesSchema);
const OrganizerSales =
  mongoose.models.OrganizerSales ||
  mongoose.model("OrganizerSales", OrganizerSalesSchema);

module.exports = {
  MasterAccount,
  User,
  Admin,
  Organizer,
  Artist,
  Genre,
  Location,
  Event,
  Order,
  Ticket,
  Wishlist,
  EmailReminder,
  Notification,
  EventSales,
  DailySales,
  CategorySales,
  TicketTypeSales,
  OrganizerSales,
  EventStatusType,
  PaymentStatusType,
  RoleType,
  OrganizerStatusType,
  SenderTypeEnum,
};
