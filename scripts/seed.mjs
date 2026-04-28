import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017/laundry-pos";

const customers = [
  { name: "Rahul Sharma",   phone: "9876543210", email: "rahul@gmail.com" },
  { name: "Priya Reddy",    phone: "9123456789", email: "priya@gmail.com" },
  { name: "Anil Kumar",     phone: "9988776655", email: "anil@gmail.com" },
  { name: "Sneha Patel",    phone: "9765432100", email: "sneha@gmail.com" },
  { name: "Vikram Nair",    phone: "9812345678", email: "vikram@gmail.com" },
  { name: "Deepa Singh",    phone: "9900112233", email: "deepa@gmail.com" },
  { name: "Suresh Rao",     phone: "9700123456", email: "suresh@gmail.com" },
  { name: "Meena Iyer",     phone: "9600345678", email: "meena@gmail.com" },
];

const garments = ["Shirt", "Trouser", "Saree", "Suit", "Kurta", "Lehenga", "Jacket", "Bedsheet", "Curtain"];
const services = ["Wash & Fold", "Dry Clean", "Steam Iron", "Wash & Iron", "Stain Removal"];
const statuses = ["Pending", "Processing", "Ready", "Delivered"];
const priorities = ["Normal", "Normal", "Normal", "Express"];

const PRICE_TABLE = {
  Shirt:    { "Wash & Fold": 50,  "Wash & Iron": 70,  "Dry Clean": 120, "Steam Iron": 40,  "Stain Removal": 100 },
  Trouser:  { "Wash & Fold": 60,  "Wash & Iron": 80,  "Dry Clean": 130, "Steam Iron": 50,  "Stain Removal": 110 },
  Saree:    { "Wash & Fold": 150, "Wash & Iron": 180, "Dry Clean": 250, "Steam Iron": 120, "Stain Removal": 200 },
  Suit:     { "Wash & Fold": 200, "Wash & Iron": 250, "Dry Clean": 400, "Steam Iron": 180, "Stain Removal": 300 },
  Kurta:    { "Wash & Fold": 60,  "Wash & Iron": 80,  "Dry Clean": 130, "Steam Iron": 50,  "Stain Removal": 100 },
  Lehenga:  { "Wash & Fold": 200, "Wash & Iron": 250, "Dry Clean": 450, "Steam Iron": 180, "Stain Removal": 350 },
  Jacket:   { "Wash & Fold": 150, "Wash & Iron": 180, "Dry Clean": 350, "Steam Iron": 140, "Stain Removal": 250 },
  Bedsheet: { "Wash & Fold": 100, "Wash & Iron": 130, "Dry Clean": 200, "Steam Iron": 80,  "Stain Removal": 150 },
  Curtain:  { "Wash & Fold": 120, "Wash & Iron": 150, "Dry Clean": 220, "Steam Iron": 100, "Stain Removal": 180 },
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(rand(8, 20), rand(0, 59));
  return d;
}

const ordersData = [
  // Today - mix of statuses
  { customer: customers[0], garment: "Shirt",    qty: 3, service: "Wash & Iron",  status: "Ready",      priority: "Normal",  daysAgo: 0 },
  { customer: customers[1], garment: "Saree",    qty: 2, service: "Dry Clean",    status: "Processing", priority: "Express", daysAgo: 0 },
  { customer: customers[2], garment: "Trouser",  qty: 4, service: "Wash & Fold",  status: "Pending",    priority: "Normal",  daysAgo: 0 },
  { customer: customers[3], garment: "Suit",     qty: 1, service: "Dry Clean",    status: "Ready",      priority: "Express", daysAgo: 0 },
  // Yesterday
  { customer: customers[4], garment: "Lehenga",  qty: 1, service: "Dry Clean",    status: "Ready",      priority: "Normal",  daysAgo: 1 },
  { customer: customers[5], garment: "Kurta",    qty: 5, service: "Wash & Iron",  status: "Delivered",  priority: "Normal",  daysAgo: 1 },
  { customer: customers[6], garment: "Shirt",    qty: 6, service: "Wash & Fold",  status: "Delivered",  priority: "Normal",  daysAgo: 1 },
  { customer: customers[7], garment: "Bedsheet", qty: 3, service: "Wash & Fold",  status: "Processing", priority: "Normal",  daysAgo: 1 },
  // 2 days ago
  { customer: customers[0], garment: "Jacket",   qty: 2, service: "Dry Clean",    status: "Delivered",  priority: "Express", daysAgo: 2 },
  { customer: customers[1], garment: "Shirt",    qty: 4, service: "Steam Iron",   status: "Delivered",  priority: "Normal",  daysAgo: 2 },
  { customer: customers[2], garment: "Trouser",  qty: 3, service: "Wash & Iron",  status: "Delivered",  priority: "Normal",  daysAgo: 2 },
  // 3 days ago
  { customer: customers[3], garment: "Saree",    qty: 3, service: "Dry Clean",    status: "Delivered",  priority: "Normal",  daysAgo: 3 },
  { customer: customers[4], garment: "Suit",     qty: 2, service: "Dry Clean",    status: "Delivered",  priority: "Express", daysAgo: 3 },
  { customer: customers[5], garment: "Curtain",  qty: 4, service: "Wash & Fold",  status: "Delivered",  priority: "Normal",  daysAgo: 3 },
  // 4 days ago
  { customer: customers[6], garment: "Shirt",    qty: 5, service: "Stain Removal",status: "Delivered",  priority: "Normal",  daysAgo: 4 },
  { customer: customers[7], garment: "Kurta",    qty: 4, service: "Wash & Iron",  status: "Delivered",  priority: "Normal",  daysAgo: 4 },
  // 5 days ago
  { customer: customers[0], garment: "Bedsheet", qty: 2, service: "Wash & Fold",  status: "Delivered",  priority: "Normal",  daysAgo: 5 },
  { customer: customers[1], garment: "Lehenga",  qty: 1, service: "Dry Clean",    status: "Delivered",  priority: "Express", daysAgo: 5 },
  // 6 days ago
  { customer: customers[2], garment: "Shirt",    qty: 7, service: "Wash & Fold",  status: "Delivered",  priority: "Normal",  daysAgo: 6 },
  { customer: customers[3], garment: "Trouser",  qty: 3, service: "Dry Clean",    status: "Delivered",  priority: "Normal",  daysAgo: 6 },
];

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("✅ Connected to MongoDB");

  const db = client.db("laundry-pos");
  const ordersCol = db.collection("orders");
  const customersCol = db.collection("customers");

  // Clear old data
  await ordersCol.deleteMany({});
  await customersCol.deleteMany({});
  console.log("🗑️  Cleared old data");

  // Build orders
  const orders = ordersData.map((o, i) => {
    const price = PRICE_TABLE[o.garment]?.[o.service] ?? 100;
    const total = price * o.qty;
    return {
      orderId: `ORD-${String(i + 1).padStart(3, "0")}`,
      customer: { name: o.customer.name, phone: o.customer.phone, email: o.customer.email },
      items: [{ garment: o.garment, service: o.service, qty: o.qty, price }],
      itemsSummary: `${o.qty}x ${o.garment}`,
      primaryService: o.service,
      total,
      status: o.status,
      priority: o.priority,
      damageNotes: "",
      createdAt: daysAgo(o.daysAgo),
    };
  });

  await ordersCol.insertMany(orders);
  console.log(`📦 Inserted ${orders.length} orders`);

  // Build customers from order history
  const customerMap = new Map();
  for (const order of orders) {
    const phone = order.customer.phone;
    if (!customerMap.has(phone)) {
      customerMap.set(phone, {
        name: order.customer.name,
        phone,
        email: order.customer.email,
        totalOrders: 0,
        totalSpent: 0,
        lastVisit: order.createdAt.toISOString().split("T")[0],
        favoriteService: order.primaryService,
        loyaltyPoints: 0,
        createdAt: new Date(),
      });
    }
    const c = customerMap.get(phone);
    c.totalOrders++;
    c.totalSpent += order.total;
    c.loyaltyPoints += Math.floor(order.total / 10);
    if (order.createdAt > new Date(c.lastVisit)) {
      c.lastVisit = order.createdAt.toISOString().split("T")[0];
    }
  }

  await customersCol.insertMany([...customerMap.values()]);
  console.log(`👥 Inserted ${customerMap.size} customers`);

  // Summary
  console.log("\n📊 Summary:");
  for (const status of ["Pending", "Processing", "Ready", "Delivered"]) {
    const count = orders.filter(o => o.status === status).length;
    console.log(`   ${status}: ${count} orders`);
  }
  const totalRevenue = orders.filter(o => o.status === "Delivered").reduce((s, o) => s + o.total, 0);
  console.log(`   Total Revenue (delivered): ₹${totalRevenue}`);

  await client.close();
  console.log("\n✅ Seed complete! Refresh your browser.");
}

seed().catch(console.error);
