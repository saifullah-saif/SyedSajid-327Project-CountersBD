require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dbConnect = require("../lib/mongo");

// Import your models (adjust path as needed)
const {
  MasterAccount,
  User,
  Admin,
  Organizer,
  Artist,
  Genre,
  Location,
  Event,
  Cart,
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
} = require("./model"); // Adjust the path to your models file

// ============================================
// DEMO DATA
// ============================================

const demoData = {
  // Master Accounts
  masterAccounts: [
    {
      account_id: 1,
      email: "john.doe@example.com",
      role_type: "user",
      role_id: 1,
      email_verified: true,
      password_hash:
        "$2a$10$rQ5K5yYbXWxvFn5gJxZ5YuK5qYxWZxWZxWZxWZxWZxWZxWZxWZxW", // hashed "password123"
      oauth_provider: null,
      last_login: new Date("2024-10-10"),
    },
    {
      account_id: 2,
      email: "jane.smith@example.com",
      role_type: "user",
      role_id: 2,
      email_verified: true,
      password_hash:
        "$2a$10$rQ5K5yYbXWxvFn5gJxZ5YuK5qYxWZxWZxWZxWZxWZxWZxWZxWZxW",
      oauth_provider: null,
      last_login: new Date("2024-10-15"),
    },
    {
      account_id: 3,
      email: "organizer1@events.com",
      role_type: "organizer",
      role_id: 1,
      email_verified: true,
      password_hash:
        "$2a$10$rQ5K5yYbXWxvFn5gJxZ5YuK5qYxWZxWZxWZxWZxWZxWZxWZxWZxW",
      oauth_provider: null,
      last_login: new Date("2024-10-16"),
    },
    {
      account_id: 4,
      email: "organizer2@concerts.com",
      role_type: "organizer",
      role_id: 2,
      email_verified: true,
      password_hash:
        "$2a$10$rQ5K5yYbXWxvFn5gJxZ5YuK5qYxWZxWZxWZxWZxWZxWZxWZxWZxW",
      oauth_provider: null,
      last_login: new Date("2024-10-14"),
    },
    {
      account_id: 5,
      email: "admin@platform.com",
      role_type: "admin",
      role_id: 1,
      email_verified: true,
      password_hash:
        "$2a$10$rQ5K5yYbXWxvFn5gJxZ5YuK5qYxWZxWZxWZxWZxWZxWZxWZxWZxW",
      oauth_provider: null,
      last_login: new Date("2024-10-17"),
    },
  ],

  // Users
  users: [
    {
      user_id: 1,
      account_id: 1,
      first_name: "John",
      last_name: "Doe",
      phone_number: "+8801712345678",
      profile_image: "https://example.com/images/john.jpg",
      gender: "Male",
      dob: new Date("1990-05-15"),
    },
    {
      user_id: 2,
      account_id: 2,
      first_name: "Jane",
      last_name: "Smith",
      phone_number: "+8801823456789",
      profile_image: "https://example.com/images/jane.jpg",
      gender: "Female",
      dob: new Date("1992-08-22"),
    },
  ],

  // Admins
  admins: [
    {
      admin_id: 1,
      name: "Platform Admin",
      account_id: 5,
    },
  ],

  // Organizers
  organizers: [
    {
      organizer_id: 1,
      account_id: 3,
      organization_name: "Prime Events Ltd.",
      phone_number: "+8801934567890",
      logo: "https://example.com/logos/prime-events.png",
      description:
        "Leading event organizer in Bangladesh specializing in concerts and festivals",
      facebook_link: "https://facebook.com/primeevents",
      insta_link: "https://instagram.com/primeevents",
      web_link: "https://primeevents.com",
      status: "approved",
    },
    {
      organizer_id: 2,
      account_id: 4,
      organization_name: "Concert Masters",
      phone_number: "+8801845678901",
      logo: "https://example.com/logos/concert-masters.png",
      description: "Premium concert and music event organizers",
      facebook_link: "https://facebook.com/concertmasters",
      insta_link: "https://instagram.com/concertmasters",
      web_link: "https://concertmasters.com",
      status: "approved",
    },
  ],

  // Artists
  artists: [
    {
      artist_id: 1,
      name: "The Rock Band",
      bio: "Legendary rock band with 20 years of experience",
      image: "https://example.com/artists/rock-band.jpg",
    },
    {
      artist_id: 2,
      name: "DJ Neon",
      bio: "International DJ and electronic music producer",
      image: "https://example.com/artists/dj-neon.jpg",
    },
    {
      artist_id: 3,
      name: "Classical Orchestra",
      bio: "Traditional classical music ensemble",
      image: "https://example.com/artists/orchestra.jpg",
    },
  ],

  // Genres
  genres: [
    {
      genre_id: 1,
      name: "Rock",
      icon: "https://example.com/icons/rock.svg",
    },
    {
      genre_id: 2,
      name: "Electronic",
      icon: "https://example.com/icons/electronic.svg",
    },
    {
      genre_id: 3,
      name: "Classical",
      icon: "https://example.com/icons/classical.svg",
    },
    {
      genre_id: 4,
      name: "Pop",
      icon: "https://example.com/icons/pop.svg",
    },
    {
      genre_id: 5,
      name: "Jazz",
      icon: "https://example.com/icons/jazz.svg",
    },
  ],

  // Locations
  locations: [
    {
      location_id: 1,
      city: "Dhaka",
      venue_name: "International Convention City Bashundhara",
      address: "Plot 3, Purbachal American City, Dhaka 1229",
      map_link: "https://maps.google.com/?q=ICCB",
    },
    {
      location_id: 2,
      city: "Chittagong",
      venue_name: "Chittagong Club",
      address: "Court Road, Chittagong",
      map_link: "https://maps.google.com/?q=ChittagongClub",
    },
    {
      location_id: 3,
      city: "Dhaka",
      venue_name: "Bangladesh Army Stadium",
      address: "Banani, Dhaka 1213",
      map_link: "https://maps.google.com/?q=ArmyStadium",
    },
  ],

  // Events (with embedded categories and ticket types)
  events: [
    {
      event_id: 1,
      organizer_id: 1,
      title: "Rock Fusion Night 2025",
      description:
        "The biggest rock concert of the year featuring top bands and artists",
      start_date: new Date("2025-11-15"),
      end_date: new Date("2025-11-15"),
      start_time: new Date("2025-11-15T18:00:00"),
      banner_image: "https://example.com/banners/rock-fusion.jpg",
      venue_name: "International Convention City Bashundhara",
      location_id: 1,
      genre_id: 1,
      tickets_sale_start: new Date("2025-10-01T00:00:00"),
      tickets_sale_end: new Date("2025-11-14T23:59:59"),
      event_policy: "No outside food or drinks. Age 16+. No refunds.",
      status: "live",
      artists: [
        {
          artist_id: 1,
          name: "The Rock Band",
          bio: "Legendary rock band with 20 years of experience",
          image: "https://example.com/artists/rock-band.jpg",
        },
      ],
      categories: [
        {
          category_id: 1,
          name: "Standard Seating",
          description: "Regular seating area with good view",
          category_type: "Seating",
          ticket_types: [
            {
              ticket_type_id: 1,
              name: "General Admission",
              description: "Standard entry ticket",
              price: mongoose.Types.Decimal128.fromString("1500.00"),
              quantity_available: 500,
              max_per_order: 10,
              banner: "https://example.com/tickets/general.jpg",
              pdf_template: "template1.pdf",
            },
            {
              ticket_type_id: 2,
              name: "Student Ticket",
              description: "Discounted ticket for students with valid ID",
              price: mongoose.Types.Decimal128.fromString("1000.00"),
              quantity_available: 200,
              max_per_order: 5,
              banner: "https://example.com/tickets/student.jpg",
              pdf_template: "template1.pdf",
            },
          ],
        },
        {
          category_id: 2,
          name: "VIP Section",
          description: "Premium seating with exclusive amenities",
          category_type: "VIP",
          ticket_types: [
            {
              ticket_type_id: 3,
              name: "VIP Pass",
              description: "VIP seating with complimentary drinks",
              price: mongoose.Types.Decimal128.fromString("5000.00"),
              quantity_available: 100,
              max_per_order: 5,
              banner: "https://example.com/tickets/vip.jpg",
              pdf_template: "template_vip.pdf",
            },
          ],
        },
      ],
    },
    {
      event_id: 2,
      organizer_id: 2,
      title: "Electronic Music Festival 2025",
      description: "Three-day electronic music extravaganza",
      start_date: new Date("2025-12-20"),
      end_date: new Date("2025-12-22"),
      start_time: new Date("2025-12-20T16:00:00"),
      banner_image: "https://example.com/banners/emf.jpg",
      venue_name: "Bangladesh Army Stadium",
      location_id: 3,
      genre_id: 2,
      tickets_sale_start: new Date("2025-10-15T00:00:00"),
      tickets_sale_end: new Date("2025-12-19T23:59:59"),
      event_policy:
        "Age 18+. Security check required. No refunds after purchase.",
      status: "live",
      artists: [
        {
          artist_id: 2,
          name: "DJ Neon",
          bio: "International DJ and electronic music producer",
          image: "https://example.com/artists/dj-neon.jpg",
        },
      ],
      categories: [
        {
          category_id: 3,
          name: "Day Pass",
          description: "Single day entry",
          category_type: "Daily",
          ticket_types: [
            {
              ticket_type_id: 4,
              name: "Friday Pass",
              description: "Entry for Friday only",
              price: mongoose.Types.Decimal128.fromString("2000.00"),
              quantity_available: 1000,
              max_per_order: 10,
              banner: "https://example.com/tickets/friday.jpg",
              pdf_template: "template2.pdf",
            },
            {
              ticket_type_id: 5,
              name: "Saturday Pass",
              description: "Entry for Saturday only",
              price: mongoose.Types.Decimal128.fromString("2500.00"),
              quantity_available: 1000,
              max_per_order: 10,
              banner: "https://example.com/tickets/saturday.jpg",
              pdf_template: "template2.pdf",
            },
          ],
        },
        {
          category_id: 4,
          name: "Festival Pass",
          description: "All three days access",
          category_type: "Multi-Day",
          ticket_types: [
            {
              ticket_type_id: 6,
              name: "3-Day Pass",
              description: "Full festival access",
              price: mongoose.Types.Decimal128.fromString("5500.00"),
              quantity_available: 500,
              max_per_order: 5,
              banner: "https://example.com/tickets/3day.jpg",
              pdf_template: "template2.pdf",
            },
          ],
        },
      ],
    },
    {
      event_id: 3,
      organizer_id: 1,
      title: "Classical Evening",
      description: "An enchanting night of classical music",
      start_date: new Date("2025-11-01"),
      end_date: new Date("2025-11-01"),
      start_time: new Date("2025-11-01T19:00:00"),
      banner_image: "https://example.com/banners/classical.jpg",
      venue_name: "Chittagong Club",
      location_id: 2,
      genre_id: 3,
      tickets_sale_start: new Date("2025-09-15T00:00:00"),
      tickets_sale_end: new Date("2025-10-31T23:59:59"),
      event_policy: "Formal attire recommended. Age 12+.",
      status: "approved",
      artists: [
        {
          artist_id: 3,
          name: "Classical Orchestra",
          bio: "Traditional classical music ensemble",
          image: "https://example.com/artists/orchestra.jpg",
        },
      ],
      categories: [
        {
          category_id: 5,
          name: "Orchestra Seating",
          description: "Close to the stage",
          category_type: "Premium",
          ticket_types: [
            {
              ticket_type_id: 7,
              name: "Front Row",
              description: "Best seats in the house",
              price: mongoose.Types.Decimal128.fromString("3000.00"),
              quantity_available: 50,
              max_per_order: 4,
              banner: "https://example.com/tickets/front.jpg",
              pdf_template: "template3.pdf",
            },
            {
              ticket_type_id: 8,
              name: "Orchestra",
              description: "Premium orchestra seating",
              price: mongoose.Types.Decimal128.fromString("2000.00"),
              quantity_available: 150,
              max_per_order: 8,
              banner: "https://example.com/tickets/orchestra.jpg",
              pdf_template: "template3.pdf",
            },
          ],
        },
        {
          category_id: 6,
          name: "Balcony",
          description: "Upper level seating",
          category_type: "Standard",
          ticket_types: [
            {
              ticket_type_id: 9,
              name: "Balcony Ticket",
              description: "Upper level view",
              price: mongoose.Types.Decimal128.fromString("1200.00"),
              quantity_available: 200,
              max_per_order: 10,
              banner: "https://example.com/tickets/balcony.jpg",
              pdf_template: "template3.pdf",
            },
          ],
        },
      ],
    },
  ],

  // Cart
  carts: [
    {
      cart_id: 1,
      user_id: 1,
      event_id: 1,
      ticket_type_id: 1,
      quantity: 2,
    },
    {
      cart_id: 2,
      user_id: 2,
      event_id: 2,
      ticket_type_id: 6,
      quantity: 1,
    },
  ],

  // Orders
  orders: [
    {
      order_id: 1,
      user_id: 1,
      total_amount: mongoose.Types.Decimal128.fromString("3100.00"),
      additional_fees: mongoose.Types.Decimal128.fromString("100.00"),
      payment_status: "completed",
      payment_method: "bkash",
      transaction_id: "TXN123456789",
      order_items: [
        {
          order_item_id: 1,
          ticket_type_id: 1,
          event_id: 1,
          quantity: 2,
          unit_price: mongoose.Types.Decimal128.fromString("1500.00"),
        },
      ],
      attendee_info: [
        {
          ticket_type_id: 1,
          attendee_name: "John Doe",
          attendee_email: "john.doe@example.com",
          attendee_phone: "+8801712345678",
        },
        {
          ticket_type_id: 1,
          attendee_name: "Sarah Doe",
          attendee_email: "sarah.doe@example.com",
          attendee_phone: "+8801712345679",
        },
      ],
      created_at: new Date("2024-10-10T10:30:00"),
    },
    {
      order_id: 2,
      user_id: 2,
      total_amount: mongoose.Types.Decimal128.fromString("5650.00"),
      additional_fees: mongoose.Types.Decimal128.fromString("150.00"),
      payment_status: "completed",
      payment_method: "nagad",
      transaction_id: "TXN987654321",
      order_items: [
        {
          order_item_id: 2,
          ticket_type_id: 6,
          event_id: 2,
          quantity: 1,
          unit_price: mongoose.Types.Decimal128.fromString("5500.00"),
        },
      ],
      attendee_info: [
        {
          ticket_type_id: 6,
          attendee_name: "Jane Smith",
          attendee_email: "jane.smith@example.com",
          attendee_phone: "+8801823456789",
        },
      ],
      created_at: new Date("2024-10-12T14:20:00"),
    },
  ],

  // Tickets
  tickets: [
    {
      ticket_id: 1,
      order_id: 1,
      event_id: 1,
      ticket_type_id: 1,
      pass_id: "QR1234567890ABCDEF",
      is_validated: false,
      user_ticketpdf: "https://example.com/tickets/ticket_1.pdf",
      attendee_email: "john.doe@example.com",
      attendee_name: "John Doe",
      attendee_phone: "+8801712345678",
    },
    {
      ticket_id: 2,
      order_id: 1,
      event_id: 1,
      ticket_type_id: 1,
      pass_id: "QR0987654321FEDCBA",
      is_validated: false,
      user_ticketpdf: "https://example.com/tickets/ticket_2.pdf",
      attendee_email: "sarah.doe@example.com",
      attendee_name: "Sarah Doe",
      attendee_phone: "+8801712345679",
    },
    {
      ticket_id: 3,
      order_id: 2,
      event_id: 2,
      ticket_type_id: 6,
      pass_id: "QR1122334455667788",
      is_validated: false,
      user_ticketpdf: "https://example.com/tickets/ticket_3.pdf",
      attendee_email: "jane.smith@example.com",
      attendee_name: "Jane Smith",
      attendee_phone: "+8801823456789",
    },
  ],

  // Wishlists
  wishlists: [
    {
      wishlist_id: 1,
      user_id: 1,
      event_id: 2,
    },
    {
      wishlist_id: 2,
      user_id: 2,
      event_id: 3,
    },
  ],

  // Email Reminders
  emailReminders: [
    {
      reminder_id: 1,
      user_id: 1,
      event_id: 1,
      email_sent: true,
      scheduled_date: new Date("2025-11-14"),
      mail_text: "Reminder: Rock Fusion Night tomorrow!",
    },
    {
      reminder_id: 2,
      user_id: 2,
      event_id: 2,
      email_sent: false,
      scheduled_date: new Date("2025-12-19"),
      mail_text: "Reminder: Electronic Music Festival starts tomorrow!",
    },
  ],

  // Notifications
  notifications: [
    {
      notification_id: 1,
      sender_id: null,
      sender_type: "system",
      recipient_id: 1,
      event_id: 1,
      title: "Order Confirmed",
      message:
        "Your order #1 has been confirmed. Check your email for tickets.",
      is_read: true,
      created_at: new Date("2024-10-10T10:35:00"),
    },
    {
      notification_id: 2,
      sender_id: 1,
      sender_type: "organizer",
      recipient_id: 2,
      event_id: 2,
      title: "Event Update",
      message: "Electronic Music Festival lineup has been updated!",
      is_read: false,
      created_at: new Date("2024-10-15T16:00:00"),
    },
  ],

  // Event Sales
  eventSales: [
    {
      event_sales_id: 1,
      event_id: 1,
      organizer_id: 1,
      tickets_sold: 2,
      total_revenue: mongoose.Types.Decimal128.fromString("3000.00"),
      last_updated: new Date("2024-10-10T10:35:00"),
    },
    {
      event_sales_id: 2,
      event_id: 2,
      organizer_id: 2,
      tickets_sold: 1,
      total_revenue: mongoose.Types.Decimal128.fromString("5500.00"),
      last_updated: new Date("2024-10-12T14:25:00"),
    },
  ],

  // Daily Sales
  dailySales: [
    {
      daily_sales_id: 1,
      event_id: 1,
      organizer_id: 1,
      sale_date: new Date("2024-10-10"),
      tickets_sold: 2,
      revenue: mongoose.Types.Decimal128.fromString("3000.00"),
    },
    {
      daily_sales_id: 2,
      event_id: 2,
      organizer_id: 2,
      sale_date: new Date("2024-10-12"),
      tickets_sold: 1,
      revenue: mongoose.Types.Decimal128.fromString("5500.00"),
    },
  ],

  // Category Sales
  categorySales: [
    {
      category_sales_id: 1,
      event_id: 1,
      organizer_id: 1,
      category_id: 1,
      tickets_sold: 2,
      revenue: mongoose.Types.Decimal128.fromString("3000.00"),
      last_updated: new Date("2024-10-10T10:35:00"),
    },
  ],

  // Ticket Type Sales
  ticketTypeSales: [
    {
      ticket_type_sales_id: 1,
      event_id: 1,
      organizer_id: 1,
      ticket_type_id: 1,
      tickets_sold: 2,
      revenue: mongoose.Types.Decimal128.fromString("3000.00"),
      last_updated: new Date("2024-10-10T10:35:00"),
    },
    {
      ticket_type_sales_id: 2,
      event_id: 2,
      organizer_id: 2,
      ticket_type_id: 6,
      tickets_sold: 1,
      revenue: mongoose.Types.Decimal128.fromString("5500.00"),
      last_updated: new Date("2024-10-12T14:25:00"),
    },
  ],

  // Organizer Sales
  organizerSales: [
    {
      organizer_sales_id: 1,
      organizer_id: 1,
      total_events: 2,
      active_events: 2,
      total_tickets_sold: 2,
      total_revenue: mongoose.Types.Decimal128.fromString("3000.00"),
      last_updated: new Date("2024-10-17"),
    },
    {
      organizer_sales_id: 2,
      organizer_id: 2,
      total_events: 1,
      active_events: 1,
      total_tickets_sold: 1,
      total_revenue: mongoose.Types.Decimal128.fromString("5500.00"),
      last_updated: new Date("2024-10-17"),
    },
  ],
};

// ============================================
// SEEDER FUNCTION
// ============================================

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...\n");

    // Connect to MongoDB
    await dbConnect();
    console.log("✅ Connected to MongoDB\n");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await MasterAccount.deleteMany({});
    await User.deleteMany({});
    await Admin.deleteMany({});
    await Organizer.deleteMany({});
    await Artist.deleteMany({});
    await Genre.deleteMany({});
    await Location.deleteMany({});
    await Event.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Ticket.deleteMany({});
    await Wishlist.deleteMany({});
    await EmailReminder.deleteMany({});
    await Notification.deleteMany({});
    await EventSales.deleteMany({});
    await DailySales.deleteMany({});
    await CategorySales.deleteMany({});
    await TicketTypeSales.deleteMany({});
    await OrganizerSales.deleteMany({});
    console.log("✅ Cleared existing data\n");

    // Insert data in order (respecting dependencies)
    console.log("📝 Inserting Master Accounts...");
    await MasterAccount.insertMany(demoData.masterAccounts);
    console.log(
      `✅ Inserted ${demoData.masterAccounts.length} master accounts\n`
    );

    console.log("📝 Inserting Users...");
    await User.insertMany(demoData.users);
    console.log(`✅ Inserted ${demoData.users.length} users\n`);

    console.log("📝 Inserting Admins...");
    await Admin.insertMany(demoData.admins);
    console.log(`✅ Inserted ${demoData.admins.length} admins\n`);

    console.log("📝 Inserting Organizers...");
    await Organizer.insertMany(demoData.organizers);
    console.log(`✅ Inserted ${demoData.organizers.length} organizers\n`);

    console.log("📝 Inserting Artists...");
    await Artist.insertMany(demoData.artists);
    console.log(`✅ Inserted ${demoData.artists.length} artists\n`);

    console.log("📝 Inserting Genres...");
    await Genre.insertMany(demoData.genres);
    console.log(`✅ Inserted ${demoData.genres.length} genres\n`);

    console.log("📝 Inserting Locations...");
    await Location.insertMany(demoData.locations);
    console.log(`✅ Inserted ${demoData.locations.length} locations\n`);

    console.log(
      "📝 Inserting Events (with embedded categories and ticket types)..."
    );
    await Event.insertMany(demoData.events);
    console.log(`✅ Inserted ${demoData.events.length} events\n`);

    console.log("📝 Inserting Carts...");
    await Cart.insertMany(demoData.carts);
    console.log(`✅ Inserted ${demoData.carts.length} cart items\n`);

    console.log("📝 Inserting Orders...");
    await Order.insertMany(demoData.orders);
    console.log(`✅ Inserted ${demoData.orders.length} orders\n`);

    console.log("📝 Inserting Tickets...");
    await Ticket.insertMany(demoData.tickets);
    console.log(`✅ Inserted ${demoData.tickets.length} tickets\n`);

    console.log("📝 Inserting Wishlists...");
    await Wishlist.insertMany(demoData.wishlists);
    console.log(`✅ Inserted ${demoData.wishlists.length} wishlist items\n`);

    console.log("📝 Inserting Email Reminders...");
    await EmailReminder.insertMany(demoData.emailReminders);
    console.log(
      `✅ Inserted ${demoData.emailReminders.length} email reminders\n`
    );

    console.log("📝 Inserting Notifications...");
    await Notification.insertMany(demoData.notifications);
    console.log(`✅ Inserted ${demoData.notifications.length} notifications\n`);

    console.log("📝 Inserting Event Sales...");
    await EventSales.insertMany(demoData.eventSales);
    console.log(
      `✅ Inserted ${demoData.eventSales.length} event sales records\n`
    );

    console.log("📝 Inserting Daily Sales...");
    await DailySales.insertMany(demoData.dailySales);
    console.log(
      `✅ Inserted ${demoData.dailySales.length} daily sales records\n`
    );

    console.log("📝 Inserting Category Sales...");
    await CategorySales.insertMany(demoData.categorySales);
    console.log(
      `✅ Inserted ${demoData.categorySales.length} category sales records\n`
    );

    console.log("📝 Inserting Ticket Type Sales...");
    await TicketTypeSales.insertMany(demoData.ticketTypeSales);
    console.log(
      `✅ Inserted ${demoData.ticketTypeSales.length} ticket type sales records\n`
    );

    console.log("📝 Inserting Organizer Sales...");
    await OrganizerSales.insertMany(demoData.organizerSales);
    console.log(
      `✅ Inserted ${demoData.organizerSales.length} organizer sales records\n`
    );

    console.log("🎉 Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Master Accounts: ${demoData.masterAccounts.length}`);
    console.log(`   - Users: ${demoData.users.length}`);
    console.log(`   - Admins: ${demoData.admins.length}`);
    console.log(`   - Organizers: ${demoData.organizers.length}`);
    console.log(`   - Artists: ${demoData.artists.length}`);
    console.log(`   - Genres: ${demoData.genres.length}`);
    console.log(`   - Locations: ${demoData.locations.length}`);
    console.log(`   - Events: ${demoData.events.length}`);
    console.log(`   - Cart Items: ${demoData.carts.length}`);
    console.log(`   - Orders: ${demoData.orders.length}`);
    console.log(`   - Tickets: ${demoData.tickets.length}`);
    console.log(`   - Wishlists: ${demoData.wishlists.length}`);
    console.log(`   - Email Reminders: ${demoData.emailReminders.length}`);
    console.log(`   - Notifications: ${demoData.notifications.length}`);
    console.log(
      `   - Sales Records: ${
        demoData.eventSales.length +
        demoData.dailySales.length +
        demoData.categorySales.length +
        demoData.ticketTypeSales.length +
        demoData.organizerSales.length
      }`
    );
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  }
}

// ============================================
// VERIFICATION QUERIES
// ============================================

async function verifyData() {
  try {
    console.log("\n🔍 Verifying inserted data...\n");

    await dbConnect();

    // Verify events with nested data
    console.log("📋 Sample Event with Nested Categories and Ticket Types:");
    const sampleEvent = await Event.findOne({ event_id: 1 }).lean();
    console.log(JSON.stringify(sampleEvent, null, 2));

    // Count documents
    const counts = {
      masterAccounts: await MasterAccount.countDocuments(),
      users: await User.countDocuments(),
      admins: await Admin.countDocuments(),
      organizers: await Organizer.countDocuments(),
      artists: await Artist.countDocuments(),
      genres: await Genre.countDocuments(),
      locations: await Location.countDocuments(),
      events: await Event.countDocuments(),
      carts: await Cart.countDocuments(),
      orders: await Order.countDocuments(),
      tickets: await Ticket.countDocuments(),
      wishlists: await Wishlist.countDocuments(),
      emailReminders: await EmailReminder.countDocuments(),
      notifications: await Notification.countDocuments(),
    };

    console.log("\n📊 Document Counts:");
    Object.entries(counts).forEach(([collection, count]) => {
      console.log(`   ${collection}: ${count}`);
    });

    await mongoose.connection.close();
    console.log("\n✅ Verification complete");
  } catch (error) {
    console.error("❌ Error verifying data:", error);
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Function to clear all data
async function clearDatabase() {
  try {
    console.log("🗑️  Clearing all data from database...\n");

    dbConnect();

    await MasterAccount.deleteMany({});
    await User.deleteMany({});
    await Admin.deleteMany({});
    await Organizer.deleteMany({});
    await Artist.deleteMany({});
    await Genre.deleteMany({});
    await Location.deleteMany({});
    await Event.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Ticket.deleteMany({});
    await Wishlist.deleteMany({});
    await EmailReminder.deleteMany({});
    await Notification.deleteMany({});
    await EventSales.deleteMany({});
    await DailySales.deleteMany({});
    await CategorySales.deleteMany({});
    await TicketTypeSales.deleteMany({});
    await OrganizerSales.deleteMany({});

    console.log("✅ All data cleared successfully");

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    throw error;
  }
}

// Export functions
module.exports = {
  seedDatabase,
  verifyData,
  clearDatabase,
  demoData,
};

// ============================================
// RUN SEEDER (if called directly)
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "seed":
      seedDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error);
          process.exit(1);
        });
      break;

    case "verify":
      verifyData()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error);
          process.exit(1);
        });
      break;

    case "clear":
      clearDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error);
          process.exit(1);
        });
      break;

    default:
      console.log("Usage:");
      console.log(
        "  node seeder.js seed    - Seed the database with demo data"
      );
      console.log("  node seeder.js verify  - Verify the inserted data");
      console.log("  node seeder.js clear   - Clear all data from database");
      process.exit(0);
  }
}
