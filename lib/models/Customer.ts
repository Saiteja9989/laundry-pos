import mongoose, { Schema } from "mongoose";

const CustomerSchema = new Schema({
  name: String,
  phone: { type: String, unique: true },
  email: String,
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastVisit: String,
  favoriteService: String,
  loyaltyPoints: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
