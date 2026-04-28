import mongoose, { Schema } from "mongoose";

const ItemSchema = new Schema({
  garment: String,
  service: String,
  qty: Number,
  price: Number,
});

const OrderSchema = new Schema({
  orderId: { type: String, unique: true },
  customer: {
    name: String,
    phone: String,
    email: String,
  },
  items: [ItemSchema],
  itemsSummary: String,
  primaryService: String,
  total: Number,
  status: { type: String, default: "Pending" },
  priority: { type: String, default: "Normal" },
  paymentMethod: { type: String, default: "Cash" },
  paymentStatus: { type: String, default: "Paid" },
  damageNotes: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
