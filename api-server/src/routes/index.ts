import { Router, type IRouter } from "express";
import healthRouter from "./health";
import {
  getStorefrontSummary,
  listProducts,
  getProduct,
  createCustomer,
  getCustomer,
  updateCustomerProfile,
  getCart,
  addCartLine,
  updateCartLine,
  removeCartLine,
  checkout,
  listCustomerOrders,
  getOrder,
} from "../lib/store";

const router: IRouter = Router();

router.use(healthRouter);

// Storefront
router.get("/storefront/summary", async (_req, res) => {
  try {
    const summary = await getStorefrontSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch storefront summary" });
  }
});

// Products
router.get("/products", async (req, res) => {
  try {
    const { search, category, sort, limit } = req.query;
    const products = await listProducts({
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      sort: sort ? String(sort) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to list products" });
  }
});

router.get("/products/:productId", async (req, res) => {
  try {
    const product = await getProduct(req.params.productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Customers
router.post("/customers", async (req, res) => {
  try {
    const customer = await createCustomer(req.body);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: "Failed to create customer" });
  }
});

router.get("/customers/:customerId", async (req, res) => {
  try {
    const customer = await getCustomer(req.params.customerId);
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

router.patch("/customers/:customerId/profile", async (req, res) => {
  try {
    const customer = await updateCustomerProfile(req.params.customerId, req.body);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: "Failed to update profile" });
  }
});

// Cart
router.get("/customers/:customerId/cart", async (req, res) => {
  try {
    const cart = await getCart(req.params.customerId);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

router.post("/customers/:customerId/cart/lines", async (req, res) => {
  try {
    const cart = await addCartLine(req.params.customerId, req.body);
    res.json(cart);
  } catch (err) {
    res.status(400).json({ error: "Failed to add cart line" });
  }
});

router.patch("/customers/:customerId/cart/lines/:lineId", async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);
    const cart = await updateCartLine(req.params.customerId, req.params.lineId, quantity);
    res.json(cart);
  } catch (err) {
    res.status(400).json({ error: "Failed to update cart line" });
  }
});

router.delete("/customers/:customerId/cart/lines/:lineId", async (req, res) => {
  try {
    const cart = await removeCartLine(req.params.customerId, req.params.lineId);
    res.json(cart);
  } catch (err) {
    res.status(400).json({ error: "Failed to remove cart line" });
  }
});

// Checkout
router.post("/customers/:customerId/checkout", async (req, res) => {
  try {
    const result = await checkout(req.params.customerId, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: "Failed to process checkout" });
  }
});

// Orders
router.get("/customers/:customerId/orders", async (req, res) => {
  try {
    const orders = await listCustomerOrders(req.params.customerId);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to list orders" });
  }
});

router.get("/orders/:orderId", async (req, res) => {
  try {
    const order = await getOrder(req.params.orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

export default router;
