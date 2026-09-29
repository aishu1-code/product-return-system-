import { connectToDatabase, ProductModel, CategoryModel, CustomerModel, CartModel, OrderModel } from "./mongodb";

export interface Category {
  id: string;
  label: string;
  count: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice: number;
  image: string;
  rating: number;
  reviewCount: number;
  badge: string;
  inStock: boolean;
  quantityAvailable?: number;
}

export interface Customer {
  id: string;
  customerNumber: string;
  email: string;
  name: string;
  phone: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  createdAt: string;
}

export interface CartLine {
  id: string;
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  id: string;
  customerId: string;
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  items: CartLine[];
  total: number;
  trackingNumber?: string | null;
  createdAt: string;
}

// Default Seed Data
const DEFAULT_CATEGORIES: Category[] = [
  { id: "electronics", label: "Electronics & Audio", count: 4 },
  { id: "home", label: "Home Essentials", count: 3 },
  { id: "apparel", label: "Apparel & Wear", count: 3 },
  { id: "stationery", label: "Desk & Office", count: 2 },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p1",
    title: "Noise-Cancelling Wireless Headphones",
    description: "Immersive sound with active noise cancellation, 30-hour battery life, and ultra-soft memory foam earcups.",
    category: "electronics",
    price: 3499,
    compareAtPrice: 4999,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    rating: 4.8,
    reviewCount: 240,
    badge: "Best Seller",
    inStock: true,
    quantityAvailable: 15,
  },
  {
    id: "p2",
    title: "Minimalist Ergonomic Mechanical Keyboard",
    description: "Compact 75% wireless mechanical keyboard with hot-swappable switches and custom RGB backlight.",
    category: "electronics",
    price: 5299,
    compareAtPrice: 6999,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    rating: 4.9,
    reviewCount: 185,
    badge: "Staff Pick",
    inStock: true,
    quantityAvailable: 8,
  },
  {
    id: "p3",
    title: "Smart Ambient Desk Lamp with Wireless Charger",
    description: "Stepless dimming LED desk lamp featuring qi wireless charging pad and ambient color temperature adjustment.",
    category: "home",
    price: 1899,
    compareAtPrice: 2499,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
    rating: 4.7,
    reviewCount: 92,
    badge: "Popular",
    inStock: true,
    quantityAvailable: 20,
  },
  {
    id: "p4",
    title: "Ceramic Matte Coffee Mug (350ml)",
    description: "Handcrafted ceramic mug with heat-resistant matte glaze and ergonomic comfortable handle.",
    category: "home",
    price: 599,
    compareAtPrice: 899,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
    rating: 4.6,
    reviewCount: 150,
    badge: "Trending",
    inStock: true,
    quantityAvailable: 35,
  },
  {
    id: "p5",
    title: "Heavyweight Cotton Oversized Tee",
    description: "100% combed cotton 240 GSM pre-shrunk oversized fit t-shirt for daily relaxed wear.",
    category: "apparel",
    price: 999,
    compareAtPrice: 1499,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
    rating: 4.5,
    reviewCount: 310,
    badge: "Essential",
    inStock: true,
    quantityAvailable: 50,
  },
  {
    id: "p6",
    title: "Minimalist Hardcover Dotted Journal",
    description: "160 GSM bleedproof paper notebook with ribbon bookmark and expandable back pocket.",
    category: "stationery",
    price: 699,
    compareAtPrice: 999,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
    rating: 4.9,
    reviewCount: 88,
    badge: "Top Rated",
    inStock: true,
    quantityAvailable: 40,
  },
  {
    id: "p7",
    title: "Portable High-Fidelity Bluetooth Speaker",
    description: "IPX7 waterproof 20W stereo bass wireless speaker with 18 hours continuous playtime.",
    category: "electronics",
    price: 2799,
    compareAtPrice: 3999,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80",
    rating: 4.7,
    reviewCount: 112,
    badge: "New",
    inStock: true,
    quantityAvailable: 12,
  },
  {
    id: "p8",
    title: "Stainless Steel Insulated Water Bottle (750ml)",
    description: "Double-wall vacuum insulation keeps drinks cold for 24 hours and hot for 12 hours.",
    category: "home",
    price: 899,
    compareAtPrice: 1299,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    rating: 4.8,
    reviewCount: 195,
    badge: "Eco Pick",
    inStock: true,
    quantityAvailable: 30,
  },
];

// Memory Store State
const memoryStore = {
  products: [...DEFAULT_PRODUCTS],
  categories: [...DEFAULT_CATEGORIES],
  customers: new Map<string, Customer>(),
  carts: new Map<string, { id: string; customerId: string; lines: Array<{ id: string; productId: string; quantity: number }> }>(),
  orders: new Map<string, Order>(),
};

// Seeding DB if connected
let hasSynced = false;
async function syncDatabase() {
  if (hasSynced) return;
  const isDb = await connectToDatabase();
  if (isDb) {
    try {
      hasSynced = true;
      const count = await ProductModel.countDocuments();
      if (count === 0) {
        await ProductModel.insertMany(DEFAULT_PRODUCTS);
        await CategoryModel.insertMany(DEFAULT_CATEGORIES);
        console.log("[MongoDB] Seeded initial products & categories into MongoDB Atlas.");
      }
    } catch (e) {
      console.error("[MongoDB] Seeding failed:", e);
    }
  }
}

export async function getStorefrontSummary() {
  const isDb = await connectToDatabase();
  if (isDb) {
    await syncDatabase();
  }
  let categories = DEFAULT_CATEGORIES;
  let products = DEFAULT_PRODUCTS;

  if (isDb) {
    try {
      const dbCats = await CategoryModel.find().lean();
      const dbProds = await ProductModel.find().lean();
      if (dbCats.length) categories = dbCats as any;
      if (dbProds.length) products = dbProds as any;
    } catch (e) {
      console.error("[MongoDB] Fetch error:", e);
    }
  }

  return {
    categories,
    featured: products.slice(0, 4),
    promo: {
      eyebrow: "Autumn Drop 2026",
      title: "Discover Everyday Greatness",
      description: "Carefully curated products designed to blend style, utility, and comfort in your everyday life.",
      code: "A3FRESH20",
    },
  };
}

export async function listProducts(query: { search?: string; category?: string; sort?: string; limit?: number }) {
  const isDb = await connectToDatabase();
  let products: Product[] = DEFAULT_PRODUCTS;

  if (isDb) {
    try {
      const dbProds = await ProductModel.find().lean();
      if (dbProds.length) products = dbProds as any;
    } catch (e) {
      console.error("[MongoDB] Product list error:", e);
    }
  } else {
    products = memoryStore.products;
  }

  let filtered = [...products];

  if (query.category) {
    filtered = filtered.filter((p) => p.category.toLowerCase() === query.category?.toLowerCase());
  }

  if (query.search) {
    const s = query.search.toLowerCase();
    filtered = filtered.filter((p) => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
  }

  if (query.sort === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (query.sort === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (query.sort === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  if (query.limit && query.limit > 0) {
    filtered = filtered.slice(0, query.limit);
  }

  return filtered;
}

export async function getProduct(productId: string): Promise<Product | null> {
  const isDb = await connectToDatabase();
  if (isDb) {
    try {
      const found = await ProductModel.findOne({ id: productId }).lean();
      if (found) return found as any;
    } catch (e) {}
  }
  return memoryStore.products.find((p) => p.id === productId) ?? null;
}

export async function createCustomer(input: { email: string; name: string; phone?: string }): Promise<Customer> {
  const isDb = await connectToDatabase();
  const id = `cust_${Date.now()}`;
  const customerNumber = `A3-${Math.floor(100000 + Math.random() * 900000)}`;

  const customer: Customer = {
    id,
    customerNumber,
    email: input.email,
    name: input.name,
    phone: input.phone ?? "+91 9876543210",
    address: {
      addressLine1: "123 Innovation Way",
      addressLine2: "Suite 400",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
    },
    createdAt: new Date().toISOString(),
  };

  if (isDb) {
    try {
      await CustomerModel.create(customer);
    } catch (e) {}
  }

  memoryStore.customers.set(id, customer);
  return customer;
}

export async function getCustomer(customerId: string): Promise<Customer | null> {
  const isDb = await connectToDatabase();
  if (isDb) {
    try {
      const found = await CustomerModel.findOne({ id: customerId }).lean();
      if (found) return found as any;
    } catch (e) {}
  }
  return memoryStore.customers.get(customerId) ?? null;
}

export async function updateCustomerProfile(customerId: string, data: any): Promise<Customer> {
  const existing = await getCustomer(customerId);
  const updated: Customer = {
    id: customerId,
    customerNumber: existing?.customerNumber ?? `A3-${Math.floor(100000 + Math.random() * 900000)}`,
    email: existing?.email ?? "user@example.com",
    name: data.name ?? existing?.name ?? "User",
    phone: data.phone ?? existing?.phone ?? "",
    address: {
      addressLine1: data.addressLine1 ?? existing?.address.addressLine1 ?? "",
      addressLine2: data.addressLine2 ?? existing?.address.addressLine2 ?? "",
      city: data.city ?? existing?.address.city ?? "",
      state: data.state ?? existing?.address.state ?? "",
      postalCode: data.postalCode ?? existing?.address.postalCode ?? "",
    },
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  const isDb = await connectToDatabase();
  if (isDb) {
    try {
      await CustomerModel.updateOne({ id: customerId }, updated, { upsert: true });
    } catch (e) {}
  }

  memoryStore.customers.set(customerId, updated);
  return updated;
}

export async function getCart(customerId: string): Promise<Cart> {
  const isDb = await connectToDatabase();
  let rawCart = memoryStore.carts.get(customerId);

  if (isDb) {
    try {
      const found = await CartModel.findOne({ customerId }).lean();
      if (found) rawCart = found as any;
    } catch (e) {}
  }

  if (!rawCart) {
    rawCart = { id: `cart_${customerId}`, customerId, lines: [] };
  }

  const lines: CartLine[] = [];
  let subtotal = 0;

  for (const l of rawCart.lines) {
    const prod = await getProduct(l.productId);
    if (prod) {
      const lineTotal = prod.price * l.quantity;
      subtotal += lineTotal;
      lines.push({
        id: l.id,
        product: prod,
        quantity: l.quantity,
        lineTotal,
      });
    }
  }

  const shipping = subtotal > 1500 || subtotal === 0 ? 0 : 99;

  return {
    id: rawCart.id,
    customerId,
    lines,
    subtotal,
    shipping,
    total: subtotal + shipping,
    itemCount: lines.reduce((acc, item) => acc + item.quantity, 0),
  };
}

export async function addCartLine(customerId: string, input: { productId: string; quantity: number }): Promise<Cart> {
  let rawCart = memoryStore.carts.get(customerId);
  const isDb = await connectToDatabase();

  if (isDb) {
    try {
      const found = await CartModel.findOne({ customerId }).lean();
      if (found) rawCart = found as any;
    } catch (e) {}
  }

  if (!rawCart) {
    rawCart = { id: `cart_${customerId}`, customerId, lines: [] };
  }

  const existingLine = rawCart.lines.find((l) => l.productId === input.productId);
  if (existingLine) {
    existingLine.quantity += input.quantity;
  } else {
    rawCart.lines.push({
      id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productId: input.productId,
      quantity: input.quantity,
    });
  }

  if (isDb) {
    try {
      await CartModel.updateOne({ customerId }, rawCart, { upsert: true });
    } catch (e) {}
  }

  memoryStore.carts.set(customerId, rawCart);
  return getCart(customerId);
}

export async function updateCartLine(customerId: string, lineId: string, quantity: number): Promise<Cart> {
  let rawCart = memoryStore.carts.get(customerId);
  const isDb = await connectToDatabase();

  if (isDb) {
    try {
      const found = await CartModel.findOne({ customerId }).lean();
      if (found) rawCart = found as any;
    } catch (e) {}
  }

  if (rawCart) {
    if (quantity <= 0) {
      rawCart.lines = rawCart.lines.filter((l) => l.id !== lineId);
    } else {
      const line = rawCart.lines.find((l) => l.id === lineId);
      if (line) line.quantity = quantity;
    }

    if (isDb) {
      try {
        await CartModel.updateOne({ customerId }, rawCart);
      } catch (e) {}
    }

    memoryStore.carts.set(customerId, rawCart);
  }

  return getCart(customerId);
}

export async function removeCartLine(customerId: string, lineId: string): Promise<Cart> {
  return updateCartLine(customerId, lineId, 0);
}

function formatOrder(raw: any): Order {
  const items: CartLine[] = (raw.items || []).map((item: any) => {
    if (item.product && item.product.title) {
      return item;
    }
    return {
      id: item.id || `line_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      quantity: item.quantity || 1,
      lineTotal: item.lineTotal || (item.productPrice ? item.productPrice * (item.quantity || 1) : 0),
      product: {
        id: item.productId || item.id || "p1",
        title: item.productTitle || item.title || "Product Item",
        price: item.productPrice || item.price || 0,
        compareAtPrice: item.productPrice || item.price || 0,
        image: item.productImage || item.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
        category: item.category || "General",
        description: "",
        rating: 4.8,
        reviewCount: 50,
        badge: "",
        inStock: true,
      },
    };
  });

  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    customerId: raw.customerId,
    status: raw.status || "confirmed",
    paymentStatus: raw.paymentStatus || "paid",
    deliveryStatus: raw.deliveryStatus || "Dispatched",
    items,
    total: raw.total,
    trackingNumber: raw.trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export async function checkout(customerId: string, data: any) {
  const currentCart = await getCart(customerId);
  const orderId = `ord_${Date.now()}`;
  const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  const paymentMethod = data?.paymentMethod || "Card";
  const isCod = paymentMethod === "COD" || paymentMethod === "Cash on Delivery";

  const items: CartLine[] = (currentCart.lines || []).map((i) => ({
    id: i.id || `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    product: i.product || {
      id: "p1",
      title: "Store Item",
      price: 999,
      compareAtPrice: 1499,
      image: "",
      category: "General",
      description: "",
      rating: 4.8,
      reviewCount: 10,
      badge: "",
      inStock: true,
    },
    quantity: i.quantity || 1,
    lineTotal: i.lineTotal || (i.product?.price ? i.product.price * (i.quantity || 1) : 0),
  }));

  const order: Order = {
    id: orderId,
    orderNumber,
    customerId,
    status: "confirmed",
    paymentStatus: isCod ? "Pending (Cash on Delivery)" : "Paid",
    deliveryStatus: "Dispatched",
    items,
    total: currentCart.total,
    trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
  };

  const isDb = await connectToDatabase();
  if (isDb) {
    try {
      await OrderModel.create({
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.deliveryStatus,
        items: order.items.map((i) => ({
          id: i.id,
          productId: i.product?.id || "p1",
          productTitle: i.product?.title || "Item",
          productPrice: i.product?.price || 0,
          productImage: i.product?.image || "",
          category: i.product?.category || "General",
          quantity: i.quantity || 1,
          lineTotal: i.lineTotal || 0,
        })),
        total: order.total,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
      });

      // Clear DB cart
      await CartModel.updateOne({ customerId }, { lines: [] });
    } catch (e) {
      console.error("[MongoDB] Checkout DB error:", e);
    }
  }

  memoryStore.orders.set(orderId, order);
  memoryStore.carts.set(customerId, { id: `cart_${customerId}`, customerId, lines: [] });

  return {
    orderId,
    checkoutUrl: `/orders/${orderId}`,
    status: "success",
  };
}

export async function listCustomerOrders(customerId: string): Promise<Order[]> {
  const isDb = await connectToDatabase();
  let rawOrders: any[] = [];
  if (isDb) {
    try {
      const found = await OrderModel.find({ customerId }).lean();
      if (found.length) rawOrders = found;
    } catch (e) {}
  }

  if (!rawOrders.length) {
    rawOrders = Array.from(memoryStore.orders.values()).filter((o) => o.customerId === customerId);
  }

  return rawOrders.map(formatOrder);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const isDb = await connectToDatabase();
  if (isDb) {
    try {
      const found = await OrderModel.findOne({ id: orderId }).lean();
      if (found) return formatOrder(found);
    } catch (e) {}
  }

  const mem = memoryStore.orders.get(orderId);
  return mem ? formatOrder(mem) : null;
}
