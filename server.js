const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const MONGODB_URI = process.env.MONGODB_URI || (process.env.NODE_ENV === "production" ? null : "mongodb://localhost:27017/hotel-db");
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required in production. Set the MONGODB_URI environment variable.");
  process.exit(1);
}

// Track database connection status
let isDatabaseConnected = false;

// Monitor database connection
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
  isDatabaseConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  isDatabaseConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  isDatabaseConnected = false;
});

let transporter = null;
if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
} else {
  console.warn("EMAIL_USER or EMAIL_PASS not set; booking confirmation emails will be disabled.");
}

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: isDatabaseConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
console.log("Attempting to connect to MongoDB at:", MONGODB_URI);
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");
    isDatabaseConnected = true;
    try {
      await seedDatabase();
    } catch (err) {
      console.error("Seed error:", err);
    }

    try {
      await updateInventoryCategories();
    } catch (err) {
      console.error("Category update error:", err);
    }

    startServer();
  })
  .catch((err) => {
    console.warn("MongoDB connection failed. Running in offline mode:", err.message);
    console.error(err);
    isDatabaseConnected = false;
    if (process.env.NODE_ENV === "production") {
      console.error("Production MongoDB connection failed. Exiting to allow platform restart.");
      process.exit(1);
    }
    startServer();
  });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
});

const bookingSchema = new mongoose.Schema({
  guestName: String,
  email: String,
  contact: String,
  roomId: String,
  checkIn: Date,
  checkOut: Date,
  paymentMethod: String,
  status: { type: String, default: "active" },
});

const roomSchema = new mongoose.Schema({
  number: Number,
  status: String,
  housekeepingStatus: String,
});

const inventorySchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  category: String,
});

const attendanceSchema = new mongoose.Schema({
  name: String,
  role: String,
  event: String,
  timestamp: { type: Date, default: Date.now },
});

const saleSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  category: String,
  paymentMethod: String,
  date: { type: Date, default: Date.now },
});

const equipmentSchema = new mongoose.Schema({
  name: String,
  quantity: { type: Number, default: 0 },
  category: { type: String, default: "Equipment" },
});

const stockSchema = new mongoose.Schema({
  name: String,
  quantity: { type: Number, default: 30 },
  category: String,
  lowThreshold: { type: Number, default: 10 },
});

const dineInReservationSchema = new mongoose.Schema({
  guestName: String,
  contact: String,
  tableNumber: Number,
  orderType: { type: String, enum: ["Dine-In", "Delivery"], default: "Dine-In" },
  deliveryRoom: String,
  reservationTime: Date,
  status: { type: String, default: "reserved" },
});

const contactMessageSchema = new mongoose.Schema({
  fromRole: String,
  toRole: String,
  message: String,
  regarding: String,
  roomId: String,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

const dishSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  description: String,
  available: { type: Boolean, default: true },
});

const posOrderSchema = new mongoose.Schema({
  orderId: String,
  items: [{ dish: String, quantity: Number, price: Number, subtotal: Number }],
  totalAmount: Number,
  paymentMethod: String,
  orderType: String,
  deliveryRoom: String,
  orderTime: { type: Date, default: Date.now },
  completedTime: Date,
  status: { type: String, enum: ["pending", "preparing", "completed", "cancelled"], default: "pending" },
  notes: String,
  createdBy: String,
});

const loginLogSchema = new mongoose.Schema({
  username: String,
  role: String,
  loginTime: { type: Date, default: Date.now },
  logoutTime: Date,
  ipAddress: String,
  duration: Number,
});

const clockInOutSchema = new mongoose.Schema({
  username: String,
  role: String,
  clockInTime: { type: Date, default: Date.now },
  clockOutTime: Date,
  duration: Number,
});

const User = mongoose.model("User", userSchema);
const Booking = mongoose.model("Booking", bookingSchema);
const Room = mongoose.model("Room", roomSchema);
const Inventory = mongoose.model("Inventory", inventorySchema);
const Attendance = mongoose.model("Attendance", attendanceSchema);
const Sale = mongoose.model("Sale", saleSchema);
const Equipment = mongoose.model("Equipment", equipmentSchema);
const Stock = mongoose.model("Stock", stockSchema);
const DineInReservation = mongoose.model("DineInReservation", dineInReservationSchema);
const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
const Dish = mongoose.model("Dish", dishSchema);
const POSOrder = mongoose.model("POSOrder", posOrderSchema);
const LoginLog = mongoose.model("LoginLog", loginLogSchema);
const ClockInOut = mongoose.model("ClockInOut", clockInOutSchema);

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing authorization header" });

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });
    req.user = payload;
    next();
  });
}

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  // Check if database is connected
  if (!isDatabaseConnected) {
    return res.status(503).json({ message: "Database connection unavailable. Please try again later." });
  }

  try {
    const user = await User.findOne({ username, password }).lean();
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: "8h" });

    // Log login
    LoginLog.create({
      username,
      role: user.role,
      loginTime: new Date(),
    }).catch(() => null);

    Attendance.create({
      name: username,
      role: user.role,
      event: "Login",
    }).catch(() => null);

    res.json({ token, role: user.role, username });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed due to server error" });
  }
});

app.post("/api/logout", authMiddleware, async (req, res) => {
  LoginLog.updateOne(
    { username: req.user.username, logoutTime: null },
    { logoutTime: new Date() }
  ).catch(() => null);
  res.json({ message: "Logged out" });
});

app.post("/api/attendance", authMiddleware, async (req, res) => {
  const { name, role, event } = req.body;
  if (!name || !role || !event) {
    return res.status(400).json({ message: "Name, role and event type are required" });
  }

  const attendance = await Attendance.create({ name, role, event });
  res.status(201).json(attendance);
});

app.get("/api/admin/attendance", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const logs = await Attendance.find().sort({ timestamp: -1 }).limit(50).lean();
  res.json(logs);
});

app.get("/api/inventory", authMiddleware, async (req, res) => {
  const category = req.query.category;
  const query = category ? { category } : {};
  const items = await Inventory.find(query).lean();
  res.json(items);
});

app.get("/api/sales", authMiddleware, async (req, res) => {
  const sales = await Sale.find().sort({ date: -1 }).lean();
  res.json(sales);
});

app.get("/api/equipment", authMiddleware, async (req, res) => {
  const equipment = await Equipment.find().lean();
  res.json(equipment);
});

app.put("/api/equipment/:id", authMiddleware, async (req, res) => {
  const { quantity } = req.body;
  const equipment = await Equipment.findByIdAndUpdate(req.params.id, { quantity }, { new: true });
  res.json(equipment);
});

app.get("/api/stock", authMiddleware, async (req, res) => {
  const stock = await Stock.find().lean();
  const lowStock = stock.filter(item => item.quantity <= item.lowThreshold);
  res.json({ stock, lowStock });
});

app.put("/api/stock/:id", authMiddleware, async (req, res) => {
  const { quantity } = req.body;
  const stockItem = await Stock.findByIdAndUpdate(req.params.id, { quantity }, { new: true });
  res.json(stockItem);
});

app.post("/api/pos/receipt", authMiddleware, async (req, res) => {
  const { items, total, orderType, tableNumber, deliveryRoom, notes } = req.body;
  const serialNumber = Math.random().toString(36).substr(2, 9).toUpperCase();
  const receipt = {
    hotelName: "Hermoso Descanso",
    address: "123 Hotel Street, City, Country",
    serialNumber,
    dateIssued: new Date().toISOString(),
    orderType,
    tableNumber,
    deliveryRoom,
    notes,
    items,
    total,
  };
  res.json(receipt);
});

app.get("/api/dinein", authMiddleware, async (req, res) => {
  const reservations = await DineInReservation.find().sort({ reservationTime: 1 }).lean();
  res.json(reservations);
});

app.post("/api/dinein", authMiddleware, async (req, res) => {
  const { guestName, contact, tableNumber, orderType, deliveryRoom, reservationTime } = req.body;
  if (!guestName || !contact || !orderType || !reservationTime) {
    return res.status(400).json({ message: "Guest name, contact, order type, and reservation time are required" });
  }
  if (orderType === "Dine-In" && !tableNumber) {
    return res.status(400).json({ message: "Table number is required for Dine-In orders" });
  }
  if (orderType === "Delivery" && !deliveryRoom) {
    return res.status(400).json({ message: "Delivery room is required for Delivery orders" });
  }

  const reservation = await DineInReservation.create({ guestName, contact, tableNumber, orderType, deliveryRoom, reservationTime });
  res.status(201).json(reservation);
});

app.put("/api/dinein/:id/status", authMiddleware, async (req, res) => {
  const { status } = req.body;
  const reservation = await DineInReservation.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(reservation);
});

app.get("/api/admin/dashboard", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const totalBookings = await Booking.countDocuments();
  const totalRooms = await Room.countDocuments();

  const sales = await Sale.find().lean();
  const totalSales = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
  const salesReport = sales.slice(0, 10).map((sale) => ({
    description: sale.description,
    amount: sale.amount,
    category: sale.category,
    date: sale.date,
  }));

  const inventoryItems = await Inventory.find().lean();
  const inventorySummary = inventoryItems.reduce((result, item) => {
    const bucket = result.find((entry) => entry.category === item.category);
    if (bucket) {
      bucket.quantity += item.quantity || 0;
      bucket.count += 1;
    } else {
      result.push({ category: item.category, count: 1, quantity: item.quantity || 0 });
    }
    return result;
  }, []);

  const attendanceLogs = await Attendance.find().sort({ timestamp: -1 }).limit(20).lean();

  const salesByCategory = sales.reduce((result, sale) => {
    const bucket = result.find((entry) => entry.category === sale.category);
    if (bucket) {
      bucket.amount += sale.amount || 0;
    } else {
      result.push({ category: sale.category, amount: sale.amount || 0 });
    }
    return result;
  }, []);

  const revenueTrend = [
    { day: "Mon", revenue: 320 },
    { day: "Tue", revenue: 500 },
    { day: "Wed", revenue: 280 },
    { day: "Thu", revenue: 550 },
    { day: "Fri", revenue: 750 },
  ];

  res.json({
    totalBookings,
    totalRooms,
    totalSales,
    revenueTrend,
    salesReport,
    inventorySummary,
    attendanceLogs,
    salesByCategory,
  });
});

app.get("/api/bookings", authMiddleware, async (req, res) => {
  const bookings = await Booking.find().lean();
  res.json(bookings);
});

app.post("/api/bookings", authMiddleware, async (req, res) => {
  const { guestName, email, contact, roomId, checkIn, checkOut, paymentMethod } = req.body;

  if (!guestName || !email || !contact || !roomId || !checkIn || !checkOut || !paymentMethod) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if room is available
  const existingBooking = await Booking.findOne({
    roomId,
    status: "active",
    checkIn: { $lte: new Date(checkOut) },
    checkOut: { $gte: new Date(checkIn) }
  });

  if (existingBooking) {
    return res.status(400).json({ message: "Room is not available for the selected dates" });
  }

  const booking = new Booking({ guestName, email, contact, roomId, checkIn, checkOut, paymentMethod });
  await booking.save();

  // Create sale record for the booking
  await Sale.create({
    description: `Room ${roomId} booking for ${guestName}`,
    amount: 150, // Placeholder amount, can be updated with actual rate
    category: "Frontdesk",
    paymentMethod,
    date: new Date(),
  });

  // Update room status and notify housekeeping
  await Room.findOneAndUpdate(
    { number: parseInt(roomId) },
    { status: "Occupied", housekeepingStatus: "Pending" }
  );

  // Send confirmation email if configured
  if (transporter) {
    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: "Reservation Confirmation - Hermoso Descanso",
      html: `
        <h2>Reservation Confirmed</h2>
        <p>Dear ${guestName},</p>
        <p>Your reservation has been confirmed:</p>
        <ul>
          <li>Room: ${roomId}</li>
          <li>Check-in: ${new Date(checkIn).toLocaleDateString()}</li>
          <li>Check-out: ${new Date(checkOut).toLocaleDateString()}</li>
          <li>Payment Method: ${paymentMethod}</li>
          <li>Contact: ${contact}</li>
        </ul>
        <p>Thank you for choosing Hermoso Descanso!</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Email error:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  } else {
    console.log("Email not sent: EMAIL_USER/EMAIL_PASS not configured.");
  }

  res.status(201).json(booking);
});

app.post("/api/bookings/:id/checkout", authMiddleware, async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status: "checked_out" },
    { new: true }
  );

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  // Update room status
  await Room.findOneAndUpdate(
    { number: parseInt(booking.roomId) },
    { status: "Available", housekeepingStatus: "Pending" }
  );

  res.json(booking);
});

app.get("/api/inventory/kitchen", authMiddleware, async (req, res) => {
  const toolsItems = await Inventory.find({ category: "Kitchen Tools" }).lean();
  const ingredientsItems = await Inventory.find({ category: "Kitchen Ingredients" }).lean();
  res.json({ tools: toolsItems, ingredients: ingredientsItems });
});

app.get("/api/rooms", authMiddleware, async (req, res) => {
  const rooms = await Room.find().lean();
  res.json(rooms);
});

app.put("/api/rooms/:id", authMiddleware, async (req, res) => {
  const { housekeepingStatus } = req.body;
  const room = await Room.findByIdAndUpdate(req.params.id, { housekeepingStatus }, { new: true });
  res.json(room);
});

app.post("/api/rooms/:id/contact", authMiddleware, async (req, res) => {
  const { message } = req.body;
  // In a real app, this could send a message to the room or log it
  console.log(`Contact message for room ${req.params.id}: ${message}`);
  res.json({ message: "Contact sent" });
});

app.post("/api/contact", authMiddleware, async (req, res) => {
  const { toRole, message, regarding, roomId } = req.body;
  if (!toRole || !message) {
    return res.status(400).json({ message: "To role and message are required" });
  }

  const contact = await ContactMessage.create({
    fromRole: req.user.role,
    toRole,
    message,
    regarding,
    roomId,
  });
  res.status(201).json(contact);
});

app.get("/api/contact/messages", authMiddleware, async (req, res) => {
  const messages = await ContactMessage.find({ toRole: req.user.role })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();
  res.json(messages);
});

app.put("/api/contact/:id/read", authMiddleware, async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  res.json(message);
});

app.get("/api/sales/report", authMiddleware, async (req, res) => {
  const sales = await Sale.find().sort({ date: -1 }).lean();
  const salesByCategory = {};
  let totalSales = 0;

  sales.forEach(sale => {
    if (!salesByCategory[sale.category]) {
      salesByCategory[sale.category] = { amount: 0, count: 0 };
    }
    salesByCategory[sale.category].amount += sale.amount || 0;
    salesByCategory[sale.category].count += 1;
    totalSales += sale.amount || 0;
  });

  res.json({
    sales,
    salesByCategory,
    totalSales,
    reportDate: new Date(),
  });
});

// ========== Inventory Management (Updated) ==========
app.put("/api/inventory/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "kitchen" && req.user.role !== "housekeeping") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  const { quantity, name, category } = req.body;
  const updated = await Inventory.findByIdAndUpdate(req.params.id, { quantity, name, category }, { new: true });
  res.json(updated);
});

app.patch("/api/inventory/:id/adjust", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "kitchen" && req.user.role !== "housekeeping") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  const { quantity } = req.body;
  const item = await Inventory.findById(req.params.id);
  item.quantity = (item.quantity || 0) + quantity;
  await item.save();
  res.json(item);
});

// ========== POS System ==========
app.get("/api/dishes", authMiddleware, async (req, res) => {
  const dishes = await Dish.find({ available: true }).lean();
  res.json(dishes);
});

app.post("/api/dishes", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "kitchen") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  const { name, category, price, description } = req.body;
  const dish = await Dish.create({ name, category, price, description, available: true });
  res.status(201).json(dish);
});

app.put("/api/dishes/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "kitchen") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  const updated = await Dish.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.get("/api/pos/orders", authMiddleware, async (req, res) => {
  const orders = await POSOrder.find().sort({ orderTime: -1 }).limit(100).lean();
  res.json(orders);
});

app.post("/api/pos/orders", authMiddleware, async (req, res) => {
  const { items, paymentMethod, notes } = req.body;
  const orderId = "ORD-" + Date.now();
  let totalAmount = 0;
  items.forEach(item => {
    totalAmount += item.subtotal || 0;
  });
  
  const order = await POSOrder.create({
    orderId,
    items,
    totalAmount,
    paymentMethod,
    notes,
    createdBy: req.user.username,
    status: "pending",
  });

  // Create sale record
  await Sale.create({
    description: `POS Order ${orderId}`,
    amount: totalAmount,
    category: "Kitchen/POS",
    paymentMethod,
    date: new Date(),
  });

  res.status(201).json(order);
});

app.put("/api/pos/orders/:id/status", authMiddleware, async (req, res) => {
  if (req.user.role !== "kitchen" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  const { status } = req.body;
  const updated = await POSOrder.findByIdAndUpdate(req.params.id, { status, completedTime: status === "completed" ? new Date() : null }, { new: true });
  res.json(updated);
});

app.get("/api/pos/orders/:id/receipt", authMiddleware, async (req, res) => {
  const order = await POSOrder.findById(req.params.id).lean();
  if (!order) return res.status(404).json({ message: "Order not found" });
  
  let receipt = `
╔════════════════════════════════════╗
║       HERMOSO DESCANSO POS        ║
║          RECEIPT                   ║
╚════════════════════════════════════╝

Order ID: ${order.orderId}
Date & Time: ${new Date(order.orderTime).toLocaleString()}
Status: ${order.status.toUpperCase()}

────────────────────────────────────
ITEMS:
────────────────────────────────────
`;

  order.items.forEach(item => {
    receipt += `${item.dish}
  Qty: ${item.quantity} × $${item.price.toFixed(2)} = $${item.subtotal.toFixed(2)}\n`;
  });

  receipt += `
────────────────────────────────────
SUBTOTAL:          $${(order.totalAmount * 0.9).toFixed(2)}
TAX (10%):         $${(order.totalAmount * 0.1).toFixed(2)}
TOTAL:             $${order.totalAmount.toFixed(2)}
PAYMENT METHOD:    ${order.paymentMethod}
────────────────────────────────────

${order.notes ? `Notes: ${order.notes}\n` : ""}

Thank you for your order!
Completed: ${order.completedTime ? new Date(order.completedTime).toLocaleString() : "N/A"}
  `;

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", `attachment; filename="receipt-${order.orderId}.txt"`);
  res.send(receipt);
});

// ========== Clock In/Out System ==========
app.post("/api/attendance/clock-in", authMiddleware, async (req, res) => {
  const existing = await ClockInOut.findOne({ username: req.user.username, clockOutTime: null });
  if (existing) {
    return res.status(400).json({ message: "Already clocked in" });
  }
  const clockIn = await ClockInOut.create({ username: req.user.username, role: req.user.role, clockInTime: new Date() });
  res.status(201).json(clockIn);
});

app.post("/api/attendance/clock-out", authMiddleware, async (req, res) => {
  const clockIn = await ClockInOut.findOne({ username: req.user.username, clockOutTime: null });
  if (!clockIn) {
    return res.status(400).json({ message: "Not clocked in" });
  }
  const duration = Math.round((new Date() - clockIn.clockInTime) / 60000); // minutes
  clockIn.clockOutTime = new Date();
  clockIn.duration = duration;
  await clockIn.save();
  res.json(clockIn);
});

app.get("/api/attendance/clock-status", authMiddleware, async (req, res) => {
  const current = await ClockInOut.findOne({ username: req.user.username, clockOutTime: null });
  res.json({ clockedIn: !!current, clockIn: current });
});

app.get("/api/attendance/logs", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  const logs = await ClockInOut.find().sort({ clockInTime: -1 }).limit(100).lean();
  res.json(logs);
});

app.get("/api/login-logs", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  const logs = await LoginLog.find().sort({ loginTime: -1 }).limit(100).lean();
  res.json(logs);
});

// ========== Enhanced Messaging System ==========
app.get("/api/messages", authMiddleware, async (req, res) => {
  const messages = await ContactMessage.find({
    $or: [{ fromRole: req.user.role }, { toRole: req.user.role }],
  })
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();
  res.json(messages);
});

app.post("/api/messages", authMiddleware, async (req, res) => {
  const { toRole, message, regarding, roomNumber } = req.body;
  const msg = await ContactMessage.create({
    fromRole: req.user.role,
    toRole,
    message,
    regarding,
    roomId: roomNumber,
    timestamp: new Date(),
    read: false,
  });
  res.status(201).json(msg);
});

app.put("/api/messages/:id/read", authMiddleware, async (req, res) => {
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  res.json(msg);
});

app.get("/api/messages/unread/count", authMiddleware, async (req, res) => {
  const count = await ContactMessage.countDocuments({
    toRole: req.user.role,
    read: false,
  });
  res.json({ unread: count });
});

app.get("*", (req, res) => {
  res.sendFile(require("path").resolve(__dirname, "public/index.html"));
});

// Update inventory categories to add "Kitchen" prefix to ingredients
async function updateInventoryCategories() {
  try {
    // Ingredient categories that should have "Kitchen" prefix
    const ingredientCategories = [
      "Meat & Seafood",
      "Rice, Pasta & Bread",
      "Vegetables",
      "Fruits",
      "Dairy Products",
      "Baking Ingredients",
      "Soup & Sauce",
      "Seasonings & Spices",
      "Frozen & Ready-Made",
      "Garnish & Extras",
    ];

    for (const category of ingredientCategories) {
      await Inventory.updateMany(
        { category: category },
        { $set: { category: `Kitchen ${category}` } }
      );
    }

    console.log("Inventory categories updated successfully");
  } catch (err) {
    console.error("Error updating inventory categories:", err);
  }
}

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Please stop the process using that port or set a different PORT.`);
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });
}

async function seedDatabase() {
  await User.updateOne({ username: "123admin" }, { username: "123admin", password: "password765", role: "admin" }, { upsert: true });
  await User.updateOne({ username: "123frontdesk" }, { username: "123frontdesk", password: "password123", role: "frontdesk" }, { upsert: true });
  await User.updateOne({ username: "123kitchen" }, { username: "123kitchen", password: "password456", role: "kitchen" }, { upsert: true });
  await User.updateOne({ username: "123housekeeping" }, { username: "123housekeeping", password: "password098", role: "housekeeping" }, { upsert: true });

  // Seed 150 rooms
  for (let i = 1; i <= 150; i++) {
    await Room.updateOne(
      { number: i },
      {
        $setOnInsert: {
          number: i,
          status: i % 3 === 0 ? "Occupied" : "Available",
          housekeepingStatus: i % 3 === 0 ? "Pending" : "Clean",
        },
      },
      { upsert: true }
    );
  }

  // Comprehensive inventory items - Kitchen Equipment & Tools
  const kitchenTools = [
    { name: "Chef's Knives", quantity: 6, category: "Kitchen Tools" },
    { name: "Paring Knives", quantity: 4, category: "Kitchen Tools" },
    { name: "Serrated Bread Knives", quantity: 2, category: "Kitchen Tools" },
    { name: "Cutting Boards", quantity: 8, category: "Kitchen Tools" },
    { name: "Mixing Bowls", quantity: 10, category: "Kitchen Tools" },
    { name: "Measuring Cups (sets)", quantity: 4, category: "Kitchen Tools" },
    { name: "Measuring Spoons (sets)", quantity: 4, category: "Kitchen Tools" },
    { name: "Whisks", quantity: 6, category: "Kitchen Tools" },
    { name: "Tongs", quantity: 10, category: "Kitchen Tools" },
    { name: "Spatulas", quantity: 8, category: "Kitchen Tools" },
    { name: "Wooden Spoons", quantity: 6, category: "Kitchen Tools" },
    { name: "Ladles", quantity: 6, category: "Kitchen Tools" },
    { name: "Peelers", quantity: 3, category: "Kitchen Tools" },
    { name: "Box Graters", quantity: 2, category: "Kitchen Tools" },
    { name: "Colanders", quantity: 3, category: "Kitchen Tools" },
    { name: "Fine Mesh Strainers", quantity: 3, category: "Kitchen Tools" },
    { name: "Sheet Pans", quantity: 20, category: "Kitchen Cookware" },
    { name: "Baking Trays", quantity: 10, category: "Kitchen Cookware" },
    { name: "Sauce Pans", quantity: 6, category: "Kitchen Cookware" },
    { name: "Stock Pots", quantity: 4, category: "Kitchen Cookware" },
    { name: "Frying Pans", quantity: 8, category: "Kitchen Cookware" },
    { name: "Sauté Pans", quantity: 6, category: "Kitchen Cookware" },
    { name: "Dutch Ovens", quantity: 2, category: "Kitchen Cookware" },
    { name: "Woks", quantity: 2, category: "Kitchen Cookware" },
    { name: "Food Storage Containers", quantity: 40, category: "Kitchen Storage" },
    { name: "Prep Tables", quantity: 3, category: "Kitchen Equipment" },
    { name: "Refrigerators", quantity: 2, category: "Kitchen Equipment" },
    { name: "Freezers", quantity: 1, category: "Kitchen Equipment" },
    { name: "Commercial Ovens", quantity: 2, category: "Kitchen Equipment" },
    { name: "Gas Ranges", quantity: 2, category: "Kitchen Equipment" },
    { name: "Deep Fryers", quantity: 2, category: "Kitchen Equipment" },
    { name: "Grills", quantity: 1, category: "Kitchen Equipment" },
    { name: "Salamander Broiler", quantity: 1, category: "Kitchen Equipment" },
    { name: "Rice Cookers", quantity: 2, category: "Kitchen Equipment" },
    { name: "Blenders", quantity: 2, category: "Kitchen Equipment" },
    { name: "Food Processors", quantity: 2, category: "Kitchen Equipment" },
    { name: "Stand Mixers", quantity: 1, category: "Kitchen Equipment" },
    { name: "Immersion Blenders", quantity: 2, category: "Kitchen Equipment" },
    { name: "Digital Kitchen Scales", quantity: 2, category: "Kitchen Equipment" },
    { name: "Thermometers", quantity: 4, category: "Kitchen Equipment" },
    { name: "Heat-Resistant Gloves (pairs)", quantity: 4, category: "Kitchen Supplies" },
    { name: "Aprons", quantity: 12, category: "Kitchen Supplies" },
    { name: "Dish Racks", quantity: 6, category: "Kitchen Supplies" },
    { name: "Commercial Sink Stations", quantity: 3, category: "Kitchen Supplies" },
    { name: "Dishwashing Machine", quantity: 1, category: "Kitchen Equipment" },
    { name: "Trash Bins", quantity: 6, category: "Kitchen Supplies" },
    { name: "Fire Extinguishers", quantity: 3, category: "Safety Equipment" },
    { name: "Shelving Racks", quantity: 5, category: "Kitchen Storage" },
    { name: "Ingredient Bins", quantity: 10, category: "Kitchen Storage" },
    { name: "Serving Trays", quantity: 12, category: "Kitchen Supplies" },
  ];

  // Ingredients
  const ingredients = [
    // Meat & Seafood
    { name: "Chicken", quantity: 80, category: "Kitchen Meat & Seafood" },
    { name: "Beef", quantity: 70, category: "Kitchen Meat & Seafood" },
    { name: "Pork", quantity: 45, category: "Kitchen Meat & Seafood" },
    { name: "Lamb", quantity: 35, category: "Kitchen Meat & Seafood" },
    { name: "Fish Fillet", quantity: 50, category: "Kitchen Meat & Seafood" },
    { name: "Shrimp", quantity: 35, category: "Kitchen Meat & Seafood" },
    { name: "Seafood Mix", quantity: 30, category: "Kitchen Meat & Seafood" },
    { name: "Ground Beef", quantity: 20, category: "Kitchen Meat & Seafood" },
    // Rice, Pasta & Bread
    { name: "Rice", quantity: 90, category: "Kitchen Rice, Pasta & Bread" },
    { name: "Pasta Noodles", quantity: 35, category: "Kitchen Rice, Pasta & Bread" },
    { name: "Spaghetti Pasta", quantity: 25, category: "Kitchen Rice, Pasta & Bread" },
    { name: "Garlic Bread Loaves", quantity: 25, category: "Kitchen Rice, Pasta & Bread" },
    { name: "Burger Buns", quantity: 100, category: "Kitchen Rice, Pasta & Bread" },
    { name: "Bread Loaves", quantity: 15, category: "Kitchen Rice, Pasta & Bread" },
    { name: "Bread Crumbs", quantity: 10, category: "Kitchen Rice, Pasta & Bread" },
    // Vegetables
    { name: "Broccoli", quantity: 20, category: "Kitchen Vegetables" },
    { name: "Carrots", quantity: 25, category: "Kitchen Vegetables" },
    { name: "Potatoes", quantity: 35, category: "Kitchen Vegetables" },
    { name: "Tomatoes", quantity: 30, category: "Kitchen Vegetables" },
    { name: "Lettuce", quantity: 15, category: "Kitchen Vegetables" },
    { name: "Cucumbers", quantity: 10, category: "Kitchen Vegetables" },
    { name: "Bell Peppers", quantity: 12, category: "Kitchen Vegetables" },
    { name: "Mushrooms", quantity: 18, category: "Kitchen Vegetables" },
    { name: "Pumpkin", quantity: 20, category: "Kitchen Vegetables" },
    { name: "Basil", quantity: 3, category: "Kitchen Vegetables" },
    { name: "Garlic", quantity: 8, category: "Kitchen Vegetables" },
    { name: "Onions", quantity: 15, category: "Kitchen Vegetables" },
    { name: "Green Beans", quantity: 10, category: "Kitchen Vegetables" },
    { name: "Cabbage", quantity: 12, category: "Kitchen Vegetables" },
    { name: "Spring Onions", quantity: 4, category: "Kitchen Vegetables" },
    // Fruits
    { name: "Mangoes", quantity: 20, category: "Kitchen Fruits" },
    { name: "Bananas", quantity: 18, category: "Kitchen Fruits" },
    { name: "Mixed Fruits", quantity: 35, category: "Kitchen Fruits" },
    { name: "Lemons", quantity: 5, category: "Kitchen Fruits" },
    // Dairy Products
    { name: "Milk", quantity: 40, category: "Kitchen Dairy Products" },
    { name: "Heavy Cream", quantity: 25, category: "Kitchen Dairy Products" },
    { name: "Butter", quantity: 15, category: "Kitchen Dairy Products" },
    { name: "Cheese", quantity: 18, category: "Kitchen Dairy Products" },
    { name: "Yogurt", quantity: 20, category: "Kitchen Dairy Products" },
    { name: "Eggs", quantity: 500, category: "Kitchen Dairy Products" },
    // Baking Ingredients
    { name: "Flour", quantity: 40, category: "Kitchen Baking Ingredients" },
    { name: "Sugar", quantity: 30, category: "Kitchen Baking Ingredients" },
    { name: "Cocoa Powder", quantity: 5, category: "Kitchen Baking Ingredients" },
    { name: "Baking Powder", quantity: 2, category: "Kitchen Baking Ingredients" },
    { name: "Vanilla Extract", quantity: 2, category: "Kitchen Baking Ingredients" },
    // Soup & Sauce Ingredients
    { name: "Chicken Stock", quantity: 50, category: "Kitchen Soup & Sauce" },
    { name: "Beef Stock", quantity: 40, category: "Kitchen Soup & Sauce" },
    { name: "Seafood Stock", quantity: 30, category: "Kitchen Soup & Sauce" },
    { name: "Tomato Sauce", quantity: 25, category: "Kitchen Soup & Sauce" },
    { name: "Soy Sauce", quantity: 15, category: "Kitchen Soup & Sauce" },
    { name: "Vinegar", quantity: 10, category: "Kitchen Soup & Sauce" },
    { name: "Cooking Oil", quantity: 40, category: "Kitchen Soup & Sauce" },
    { name: "Oyster Sauce", quantity: 8, category: "Kitchen Soup & Sauce" },
    { name: "Gravy Mix", quantity: 6, category: "Kitchen Soup & Sauce" },
    // Seasonings & Spices
    { name: "Salt", quantity: 10, category: "Kitchen Seasonings & Spices" },
    { name: "Black Pepper", quantity: 3, category: "Kitchen Seasonings & Spices" },
    { name: "Paprika", quantity: 2, category: "Kitchen Seasonings & Spices" },
    { name: "Italian Seasoning", quantity: 2, category: "Kitchen Seasonings & Spices" },
    { name: "Chili Flakes", quantity: 1, category: "Kitchen Seasonings & Spices" },
    { name: "Brown Sugar", quantity: 5, category: "Kitchen Seasonings & Spices" },
    // Frozen & Ready-Made
    { name: "Dumpling Wrappers", quantity: 500, category: "Kitchen Frozen & Ready-Made" },
    { name: "Spring Roll Wrappers", quantity: 500, category: "Kitchen Frozen & Ready-Made" },
    { name: "French Fries", quantity: 30, category: "Kitchen Frozen & Ready-Made" },
    { name: "Soft Drinks", quantity: 100, category: "Kitchen Frozen & Ready-Made" },
    { name: "Juice Drinks", quantity: 100, category: "Kitchen Frozen & Ready-Made" },
    // Garnish & Extras
    { name: "Parsley", quantity: 2, category: "Kitchen Garnish & Extras" },
    { name: "Mayonnaise", quantity: 8, category: "Kitchen Garnish & Extras" },
    { name: "Vinaigrette Dressing", quantity: 10, category: "Kitchen Garnish & Extras" },
    { name: "Dipping Sauces", quantity: 12, category: "Kitchen Garnish & Extras" },
    { name: "Whipped Cream", quantity: 8, category: "Kitchen Garnish & Extras" },
    // Housekeeping
    { name: "Shampoo", quantity: 120, category: "Housekeeping Supplies" },
    { name: "Bath Towels", quantity: 80, category: "Housekeeping Supplies" },
    { name: "Hand Soap", quantity: 100, category: "Housekeeping Supplies" },
    { name: "Toilet Paper", quantity: 150, category: "Housekeeping Supplies" },
    { name: "Bed Sheets", quantity: 60, category: "Housekeeping Supplies" },
    { name: "Pillowcases", quantity: 80, category: "Housekeeping Supplies" },
    { name: "Office Supplies", quantity: 22, category: "Admin Supplies" },
    { name: "Guest Welcome Kits", quantity: 18, category: "Admin Supplies" },
  ];

  // Upsert all kitchen tools
  for (const item of kitchenTools) {
    await Inventory.updateOne({ name: item.name }, { $set: item }, { upsert: true });
  }

  // Upsert all ingredients
  for (const item of ingredients) {
    await Inventory.updateOne({ name: item.name }, { $set: item }, { upsert: true });
  }

  // Seed sample dishes for POS system
  const sampleDishes = [
    { name: "Grilled Chicken", category: "Main Course", price: 18.99, description: "Juicy grilled chicken breast" },
    { name: "Beef Steak", category: "Main Course", price: 28.99, description: "Premium beef steak" },
    { name: "Fish Fillet", category: "Main Course", price: 22.99, description: "Fresh fish fillet" },
    { name: "Pasta Carbonara", category: "Main Course", price: 16.99, description: "Classic Italian pasta" },
    { name: "Fried Rice", category: "Main Course", price: 12.99, description: "Homemade fried rice" },
    { name: "Caesar Salad", category: "Appetizer", price: 8.99, description: "Fresh garden salad" },
    { name: "Spring Rolls", category: "Appetizer", price: 6.99, description: "Crispy spring rolls" },
    { name: "Miso Soup", category: "Appetizer", price: 5.99, description: "Traditional miso soup" },
    { name: "Chocolate Cake", category: "Dessert", price: 7.99, description: "Rich chocolate cake" },
    { name: "Ice Cream", category: "Dessert", price: 4.99, description: "Vanilla ice cream" },
    { name: "Iced Tea", category: "Beverage", price: 3.99, description: "Cold iced tea" },
    { name: "Fresh Juice", category: "Beverage", price: 4.99, description: "Fresh orange juice" },
  ];

  for (const dish of sampleDishes) {
    await Dish.updateOne({ name: dish.name }, { $set: dish }, { upsert: true });
  }

  // Seed sample bookings
  const bookingsCount = await Booking.countDocuments();
  if (bookingsCount === 0) {
    await Booking.create([
      { guestName: "Alice Gomez", roomId: "101", checkIn: new Date(), checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: "active" },
      { guestName: "Jacob Reed", roomId: "203", checkIn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: "active" },
    ]);
  }

  // Seed sample sales
  const salesCount = await Sale.countDocuments();
  if (salesCount === 0) {
    await Sale.create([
      { description: "Room 101 booking", amount: 180, category: "Frontdesk", paymentMethod: "Card", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { description: "Kitchen POS order", amount: 45, category: "Kitchen/POS", paymentMethod: "Cash", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { description: "Housekeeping services", amount: 60, category: "Housekeeping", paymentMethod: "GCash", date: new Date() },
    ]);
  }

  // Equipment seeding temporarily disabled to avoid syntax issues while keeping the rest of the seed flow working.
  // Re-add equipment seeding when the server syntax is stabilized.

  const stockCount = await Stock.countDocuments();
  if (stockCount === 0) {
    const stockList = [
      // Frozen
      { name: "Frozen chicken", quantity: 30, category: "Frozen" },
      { name: "Frozen beef", quantity: 30, category: "Frozen" },
      { name: "Frozen pork", quantity: 30, category: "Frozen" },
      { name: "Frozen lamb", quantity: 30, category: "Frozen" },
      { name: "Frozen fish", quantity: 30, category: "Frozen" },
      { name: "Frozen shrimp", quantity: 30, category: "Frozen" },
      { name: "Frozen crab", quantity: 30, category: "Frozen" },
      { name: "Frozen squid", quantity: 30, category: "Frozen" },
      { name: "Frozen vegetables", quantity: 30, category: "Frozen" },
      { name: "Frozen peas", quantity: 30, category: "Frozen" },
      { name: "Frozen corn", quantity: 30, category: "Frozen" },
      { name: "Frozen berries", quantity: 30, category: "Frozen" },
      { name: "Frozen fries", quantity: 30, category: "Frozen" },
      { name: "Frozen dumplings", quantity: 30, category: "Frozen" },
      { name: "Frozen pastry dough", quantity: 30, category: "Frozen" },
      { name: "Frozen pizza", quantity: 30, category: "Frozen" },
      // Chilled
      { name: "Milk", quantity: 30, category: "Chilled" },
      { name: "Evaporated milk", quantity: 30, category: "Chilled" },
      { name: "Condensed milk", quantity: 30, category: "Chilled" },
      { name: "Cream", quantity: 30, category: "Chilled" },
      { name: "Heavy cream", quantity: 30, category: "Chilled" },
      { name: "Half-and-half", quantity: 30, category: "Chilled" },
      { name: "Buttermilk", quantity: 30, category: "Chilled" },
      { name: "Yogurt", quantity: 30, category: "Chilled" },
      { name: "Cheese", quantity: 30, category: "Chilled" },
      { name: "Butter", quantity: 30, category: "Chilled" },
      { name: "Eggs", quantity: 30, category: "Chilled" },
      { name: "Fresh chicken", quantity: 30, category: "Chilled" },
      { name: "Fresh beef", quantity: 30, category: "Chilled" },
      { name: "Fresh pork", quantity: 30, category: "Chilled" },
      { name: "Fresh fish", quantity: 30, category: "Chilled" },
      { name: "Fresh shrimp", quantity: 30, category: "Chilled" },
      { name: "Fresh crab", quantity: 30, category: "Chilled" },
      { name: "Fresh squid", quantity: 30, category: "Chilled" },
      { name: "Tofu", quantity: 30, category: "Chilled" },
      { name: "Fresh pasta", quantity: 30, category: "Chilled" },
      { name: "Leafy greens", quantity: 30, category: "Chilled" },
      { name: "Lettuce", quantity: 30, category: "Chilled" },
      { name: "Spinach", quantity: 30, category: "Chilled" },
      { name: "Kale", quantity: 30, category: "Chilled" },
      { name: "Broccoli", quantity: 30, category: "Chilled" },
      { name: "Cauliflower", quantity: 30, category: "Chilled" },
      { name: "Carrots", quantity: 30, category: "Chilled" },
      { name: "Zucchini", quantity: 30, category: "Chilled" },
      { name: "Eggplant", quantity: 30, category: "Chilled" },
      { name: "Mushrooms", quantity: 30, category: "Chilled" },
      { name: "Bell peppers", quantity: 30, category: "Chilled" },
      { name: "Tomatoes", quantity: 30, category: "Chilled" },
      { name: "Apples", quantity: 30, category: "Chilled" },
      { name: "Grapes", quantity: 30, category: "Chilled" },
      { name: "Berries", quantity: 30, category: "Chilled" },
      { name: "Strawberries", quantity: 30, category: "Chilled" },
      { name: "Blueberries", quantity: 30, category: "Chilled" },
      // Room Temperature
      { name: "Salt", quantity: 30, category: "Room Temperature" },
      { name: "Black pepper", quantity: 30, category: "Room Temperature" },
      { name: "White pepper", quantity: 30, category: "Room Temperature" },
      { name: "Sugar", quantity: 30, category: "Room Temperature" },
      { name: "Brown sugar", quantity: 30, category: "Room Temperature" },
      { name: "Powdered sugar", quantity: 30, category: "Room Temperature" },
      { name: "Honey", quantity: 30, category: "Room Temperature" },
      { name: "Maple syrup", quantity: 30, category: "Room Temperature" },
      { name: "Molasses", quantity: 30, category: "Room Temperature" },
      { name: "Flour", quantity: 30, category: "Room Temperature" },
      { name: "Bread flour", quantity: 30, category: "Room Temperature" },
      { name: "Cake flour", quantity: 30, category: "Room Temperature" },
      { name: "All-purpose flour", quantity: 30, category: "Room Temperature" },
      { name: "Whole wheat flour", quantity: 30, category: "Room Temperature" },
      { name: "Cornstarch", quantity: 30, category: "Room Temperature" },
      { name: "Baking powder", quantity: 30, category: "Room Temperature" },
      { name: "Baking soda", quantity: 30, category: "Room Temperature" },
      { name: "Yeast", quantity: 30, category: "Room Temperature" },
      { name: "Olive oil", quantity: 30, category: "Room Temperature" },
      { name: "Vegetable oil", quantity: 30, category: "Room Temperature" },
      { name: "Canola oil", quantity: 30, category: "Room Temperature" },
      { name: "Sunflower oil", quantity: 30, category: "Room Temperature" },
      { name: "Sesame oil", quantity: 30, category: "Room Temperature" },
      { name: "Margarine", quantity: 30, category: "Room Temperature" },
      { name: "Lard", quantity: 30, category: "Room Temperature" },
      { name: "Shortening", quantity: 30, category: "Room Temperature" },
      { name: "Rice", quantity: 30, category: "Room Temperature" },
      { name: "Pasta", quantity: 30, category: "Room Temperature" },
      { name: "Noodles", quantity: 30, category: "Room Temperature" },
      { name: "Quinoa", quantity: 30, category: "Room Temperature" },
      { name: "Barley", quantity: 30, category: "Room Temperature" },
      { name: "Oats", quantity: 30, category: "Room Temperature" },
      { name: "Onions", quantity: 30, category: "Room Temperature" },
      { name: "Garlic", quantity: 30, category: "Room Temperature" },
      { name: "Ginger", quantity: 30, category: "Room Temperature" },
      { name: "Potatoes", quantity: 30, category: "Room Temperature" },
      { name: "Sweet potatoes", quantity: 30, category: "Room Temperature" },
      { name: "Cabbage", quantity: 30, category: "Room Temperature" },
      { name: "Corn", quantity: 30, category: "Room Temperature" },
      { name: "Peas", quantity: 30, category: "Room Temperature" },
      { name: "Green beans", quantity: 30, category: "Room Temperature" },
      { name: "Bananas", quantity: 30, category: "Room Temperature" },
      { name: "Oranges", quantity: 30, category: "Room Temperature" },
      { name: "Lemons", quantity: 30, category: "Room Temperature" },
      { name: "Limes", quantity: 30, category: "Room Temperature" },
      { name: "Pineapple", quantity: 30, category: "Room Temperature" },
      { name: "Mango", quantity: 30, category: "Room Temperature" },
      { name: "Papaya", quantity: 30, category: "Room Temperature" },
      { name: "Coconut", quantity: 30, category: "Room Temperature" },
      { name: "Basil", quantity: 30, category: "Room Temperature" },
      { name: "Parsley", quantity: 30, category: "Room Temperature" },
      { name: "Cilantro", quantity: 30, category: "Room Temperature" },
      { name: "Thyme", quantity: 30, category: "Room Temperature" },
      { name: "Rosemary", quantity: 30, category: "Room Temperature" },
      { name: "Oregano", quantity: 30, category: "Room Temperature" },
      { name: "Bay leaves", quantity: 30, category: "Room Temperature" },
      { name: "Dill", quantity: 30, category: "Room Temperature" },
      { name: "Chives", quantity: 30, category: "Room Temperature" },
      { name: "Cumin", quantity: 30, category: "Room Temperature" },
      { name: "Coriander", quantity: 30, category: "Room Temperature" },
      { name: "Turmeric", quantity: 30, category: "Room Temperature" },
      { name: "Paprika", quantity: 30, category: "Room Temperature" },
      { name: "Chili powder", quantity: 30, category: "Room Temperature" },
      { name: "Cayenne pepper", quantity: 30, category: "Room Temperature" },
      { name: "Cinnamon", quantity: 30, category: "Room Temperature" },
      { name: "Nutmeg", quantity: 30, category: "Room Temperature" },
      { name: "Cloves", quantity: 30, category: "Room Temperature" },
      { name: "Allspice", quantity: 30, category: "Room Temperature" },
      { name: "Cardamom", quantity: 30, category: "Room Temperature" },
      { name: "Soy sauce", quantity: 30, category: "Room Temperature" },
      { name: "Fish sauce", quantity: 30, category: "Room Temperature" },
      { name: "Oyster sauce", quantity: 30, category: "Room Temperature" },
      { name: "Vinegar", quantity: 30, category: "Room Temperature" },
      { name: "Balsamic vinegar", quantity: 30, category: "Room Temperature" },
      { name: "Apple cider vinegar", quantity: 30, category: "Room Temperature" },
      { name: "Rice vinegar", quantity: 30, category: "Room Temperature" },
      { name: "Ketchup", quantity: 30, category: "Room Temperature" },
      { name: "Mustard", quantity: 30, category: "Room Temperature" },
      { name: "Mayonnaise", quantity: 30, category: "Room Temperature" },
      { name: "Hot sauce", quantity: 30, category: "Room Temperature" },
      { name: "Chocolate", quantity: 30, category: "Room Temperature" },
      { name: "Cocoa powder", quantity: 30, category: "Room Temperature" },
      { name: "Vanilla extract", quantity: 30, category: "Room Temperature" },
      { name: "Almond extract", quantity: 30, category: "Room Temperature" },
      { name: "Nuts", quantity: 30, category: "Room Temperature" },
      { name: "Almonds", quantity: 30, category: "Room Temperature" },
      { name: "Cashews", quantity: 30, category: "Room Temperature" },
      { name: "Peanuts", quantity: 30, category: "Room Temperature" },
      { name: "Walnuts", quantity: 30, category: "Room Temperature" },
      { name: "Hazelnuts", quantity: 30, category: "Room Temperature" },
      { name: "Dried fruits", quantity: 30, category: "Room Temperature" },
      { name: "Raisins", quantity: 30, category: "Room Temperature" },
      { name: "Dates", quantity: 30, category: "Room Temperature" },
      { name: "Apricots", quantity: 30, category: "Room Temperature" },
      { name: "Stock cubes", quantity: 30, category: "Room Temperature" },
      { name: "Chicken stock", quantity: 30, category: "Room Temperature" },
      { name: "Beef stock", quantity: 30, category: "Room Temperature" },
      { name: "Vegetable stock", quantity: 30, category: "Room Temperature" },
      { name: "Broth", quantity: 30, category: "Room Temperature" },
    ];
    await Stock.insertMany(stockList);
  }

  const attendanceCount = await Attendance.countDocuments();
  if (attendanceCount === 0) {
    await Attendance.create([
      { name: "Admin", role: "admin", event: "Login", timestamp: new Date(Date.now() - 3600 * 1000) },
      { name: "Frontdesk", role: "frontdesk", event: "Clock In", timestamp: new Date(Date.now() - 3500 * 1000) },
      { name: "Kitchen", role: "kitchen", event: "Clock In", timestamp: new Date(Date.now() - 3400 * 1000) },
      { name: "Housekeeping", role: "housekeeping", event: "Clock Out", timestamp: new Date(Date.now() - 1800 * 1000) },
    ]);
  }

  console.log("Seed data checked or created.");
}
