import { z } from "zod";

export const HealthStatus = z.object({
  status: z.string(),
});
export type HealthStatus = z.infer<typeof HealthStatus>;

export const HealthCheckResponse = HealthStatus;
export type HealthCheckResponse = HealthStatus;

export const Category = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number().int(),
});
export type Category = z.infer<typeof Category>;

export const Product = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  price: z.number(),
  compareAtPrice: z.number(),
  image: z.string(),
  rating: z.number(),
  reviewCount: z.number().int(),
  badge: z.string(),
  inStock: z.boolean(),
  quantityAvailable: z.number().int().optional(),
});
export type Product = z.infer<typeof Product>;

export const StorefrontSummary = z.object({
  categories: z.array(Category),
  featured: z.array(Product),
  promo: z.object({
    eyebrow: z.string(),
    title: z.string(),
    description: z.string(),
    code: z.string(),
  }),
});
export type StorefrontSummary = z.infer<typeof StorefrontSummary>;

export const CustomerInput = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
});
export type CustomerInput = z.infer<typeof CustomerInput>;

export const CustomerProfileInput = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
});
export type CustomerProfileInput = z.infer<typeof CustomerProfileInput>;

export const Customer = z.object({
  id: z.string(),
  customerNumber: z.string(),
  email: z.string(),
  name: z.string(),
  phone: z.string(),
  address: z.object({
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
  }),
  createdAt: z.string(),
});
export type Customer = z.infer<typeof Customer>;

export const CartLineInput = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(20),
});
export type CartLineInput = z.infer<typeof CartLineInput>;

export const CartLineUpdate = z.object({
  quantity: z.number().int().min(0).max(20),
});
export type CartLineUpdate = z.infer<typeof CartLineUpdate>;

export const CartLine = z.object({
  id: z.string(),
  product: Product,
  quantity: z.number().int(),
  lineTotal: z.number(),
});
export type CartLine = z.infer<typeof CartLine>;

export const Cart = z.object({
  id: z.string(),
  customerId: z.string(),
  lines: z.array(CartLine),
  subtotal: z.number(),
  shipping: z.number(),
  total: z.number(),
  itemCount: z.number().int(),
});
export type Cart = z.infer<typeof Cart>;

export const CheckoutInput = z.object({
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  note: z.string().optional(),
  paymentMethod: z.string().optional(),
});
export type CheckoutInput = z.infer<typeof CheckoutInput>;

export const Checkout = z.object({
  orderId: z.string(),
  checkoutUrl: z.string().url(),
  status: z.string(),
});
export type Checkout = z.infer<typeof Checkout>;

export const Order = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  status: z.string(),
  paymentStatus: z.string(),
  deliveryStatus: z.string(),
  items: z.array(CartLine),
  total: z.number(),
  trackingNumber: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type Order = z.infer<typeof Order>;
