import mongoose from "mongoose";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (err) {
  console.warn("[MongoDB] Failed to override DNS servers:", err);
}

let isConnected = false;

export async function connectToDatabase(): Promise<boolean> {
  if (isConnected) return true;
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.log("[MongoDB] No MONGODB_URI environment variable provided. Operating with in-memory store.");
    return false;
  }

  console.log("[MongoDB] Connecting to Atlas URI:", uri.replace(/:[^:@]+@/, ":****@"));

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("[MongoDB] Connected to MongoDB Atlas successfully.");
    return true;
  } catch (error) {
    console.error("[MongoDB] Connection error:", error);
    return false;
  }
}

// Schemas & Models
const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  count: { type: Number, required: true, default: 0 },
});

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  compareAtPrice: { type: Number, required: true },
  image: { type: String, required: true },
  rating: { type: Number, required: true },
  reviewCount: { type: Number, required: true },
  badge: { type: String, default: "" },
  inStock: { type: Boolean, default: true },
  quantityAvailable: { type: Number, default: 20 },
});

const CustomerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerNumber: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  address: {
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

const CartLineSchema = new mongoose.Schema({
  id: { type: String, required: true },
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const CartSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  lines: [CartLineSchema],
});

const OrderItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  productId: { type: String, required: true },
  productTitle: { type: String, required: true },
  productPrice: { type: Number, required: true },
  productImage: { type: String, default: "" },
  category: { type: String, default: "" },
  quantity: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  orderNumber: { type: String, required: true },
  customerId: { type: String, required: true },
  status: { type: String, default: "processing" },
  paymentStatus: { type: String, default: "paid" },
  deliveryStatus: { type: String, default: "on_the_way" },
  items: [OrderItemSchema],
  total: { type: Number, required: true },
  trackingNumber: { type: String, default: "TRK-A3-88492" },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export const CategoryModel = mongoose.models.Category || mongoose.model("Category", CategorySchema);
export const ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export const CustomerModel = mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
export const CartModel = mongoose.models.Cart || mongoose.model("Cart", CartSchema);
export const OrderModel = mongoose.models.Order || mongoose.model("Order", OrderSchema);
