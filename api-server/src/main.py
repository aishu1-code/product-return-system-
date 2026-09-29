import json
import os
import re
import subprocess
import urllib.parse
import uuid
from datetime import datetime, timezone
from typing import Any

import requests
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.collection import Collection
from pydantic import BaseModel, Field


MONGODB_URI = os.environ.get("MONGODB_URI", "").strip().strip("\"'`")
if MONGODB_URI:
    uri_start = re.search(r"mongodb(?:\+srv)?://", MONGODB_URI)
    if uri_start:
        MONGODB_URI = MONGODB_URI[uri_start.start():].strip().strip("\"'`")
    elif "=" in MONGODB_URI:
        MONGODB_URI = MONGODB_URI.split("=", 1)[1].strip().strip("\"'`")
if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI must be set")

mongo = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=7000)
mongo.admin.command("ping")
database = mongo["a3_shopping_platform"]
products: Collection[dict[str, Any]] = database["products"]
customers: Collection[dict[str, Any]] = database["customers"]
carts: Collection[dict[str, Any]] = database["carts"]
orders: Collection[dict[str, Any]] = database["orders"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_svg(title: str, color: str, accent: str) -> str:
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 520">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="{color}"/><stop offset="1" stop-color="{accent}"/>
      </linearGradient></defs>
      <rect width="720" height="520" rx="40" fill="url(#g)"/>
      <circle cx="550" cy="120" r="110" fill="rgba(255,255,255,.14)"/>
      <circle cx="150" cy="430" r="150" fill="rgba(255,255,255,.1)"/>
      <path d="M250 150h220l32 220H218z" fill="rgba(255,255,255,.82)"/>
      <path d="M280 150c0-55 35-88 80-88s80 33 80 88" fill="none" stroke="{color}" stroke-width="20"/>
      <text x="360" y="430" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="28" font-weight="700">{title}</text>
    </svg>"""
    return "data:image/svg+xml," + urllib.parse.quote(svg)


SEED_PRODUCTS = [
    ("p_aura_lamp", "Aura Smart Table Lamp", "home", 1899, 2799, "The warm glow your desk has been missing.", "#f97316", "#7c2d12", "Bestseller", 4.7, 842),
    ("p_nord_bottle", "Nord Steel Bottle 750ml", "lifestyle", 799, 1199, "Cold for 24 hours. Built for every commute.", "#0ea5e9", "#1e3a8a", "Top rated", 4.8, 1264),
    ("p_cloud_hoodie", "Cloudline Everyday Hoodie", "fashion", 1499, 2199, "Soft, substantial, and ready for slow weekends.", "#8b5cf6", "#312e81", "Limited drop", 4.5, 386),
    ("p_pixel_earbuds", "PixelBeat Wireless Earbuds", "electronics", 2299, 3499, "Crisp sound with all-day comfort.", "#10b981", "#064e3b", "Deal", 4.4, 611),
    ("p_ceramic_set", "Mori Ceramic Breakfast Set", "home", 1249, 1899, "A calm start to very good mornings.", "#ec4899", "#831843", "Editor pick", 4.6, 219),
    ("p_move_sneaker", "Move One Everyday Sneakers", "fashion", 2499, 3999, "Lightweight cushioning for city miles.", "#f59e0b", "#78350f", "New", 4.3, 174),
    ("p_focus_keyboard", "Focus Low-Profile Keyboard", "electronics", 3299, 4499, "Quiet keys and a cleaner setup.", "#6366f1", "#1e1b4b", "Popular", 4.7, 93),
    ("p_silk_scraf", "Mysa Modal Scarf", "fashion", 699, 999, "A soft layer with a little color.", "#ef4444", "#7f1d1d", "Giftable", 4.5, 287),
]


def seed_products() -> None:
    for product_id, title, category, price, compare_at, description, color, accent, badge, rating, reviews in SEED_PRODUCTS:
        products.update_one(
            {"id": product_id},
            {
                "$setOnInsert": {
                    "id": product_id,
                    "title": title,
                    "description": description,
                    "category": category,
                    "price": price,
                    "compareAtPrice": compare_at,
                    "image": make_svg(title, color, accent),
                    "rating": rating,
                    "reviewCount": reviews,
                    "badge": badge,
                    "inStock": True,
                    "quantityAvailable": 20,
                    "shopifyVariantId": None,
                    "createdAt": now_iso(),
                }
            },
            upsert=True,
        )


seed_products()

app = FastAPI(title="A³ shopping platform API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CustomerInput(BaseModel):
    email: str
    name: str = Field(min_length=2)
    phone: str = ""


class ProfileInput(BaseModel):
    name: str = Field(min_length=2)
    phone: str = Field(min_length=7)
    addressLine1: str = Field(min_length=3)
    addressLine2: str = ""
    city: str = Field(min_length=2)
    state: str = Field(min_length=2)
    postalCode: str = Field(min_length=3)


class CartLineInput(BaseModel):
    productId: str
    quantity: int = Field(ge=1, le=20)


class CartLineUpdate(BaseModel):
    quantity: int = Field(ge=0, le=20)


class CheckoutInput(BaseModel):
    addressLine1: str = Field(min_length=3)
    addressLine2: str = ""
    city: str = Field(min_length=2)
    state: str = Field(min_length=2)
    postalCode: str = Field(min_length=3)
    note: str = ""


def clean(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if doc is None:
        return None
    result = dict(doc)
    result.pop("_id", None)
    return result


def public_product(product: dict[str, Any]) -> dict[str, Any]:
    return {
        key: product.get(key)
        for key in (
            "id",
            "title",
            "description",
            "category",
            "price",
            "compareAtPrice",
            "image",
            "rating",
            "reviewCount",
            "badge",
            "inStock",
            "quantityAvailable",
        )
    }


def customer_payload(customer: dict[str, Any]) -> dict[str, Any]:
    address = customer.get("address") or {
        "addressLine1": "",
        "addressLine2": "",
        "city": "",
        "state": "",
        "postalCode": "",
    }
    return {
        "id": customer["id"],
        "customerNumber": customer["customerNumber"],
        "email": customer["email"],
        "name": customer["name"],
        "phone": customer.get("phone", ""),
        "address": address,
        "createdAt": customer["createdAt"],
    }


def find_customer(customer_id: str) -> dict[str, Any]:
    customer = customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(404, "Customer not found")
    return customer


def make_cart(customer_id: str) -> dict[str, Any]:
    cart = carts.find_one({"customerId": customer_id})
    if not cart:
        cart = {"id": f"cart_{uuid.uuid4().hex[:12]}", "customerId": customer_id, "lines": [], "updatedAt": now_iso()}
        carts.insert_one(cart)
    return cart


def cart_payload(cart: dict[str, Any]) -> dict[str, Any]:
    output_lines: list[dict[str, Any]] = []
    subtotal = 0
    item_count = 0
    for line in cart.get("lines", []):
        product = products.find_one({"id": line["productId"]})
        if not product:
            continue
        quantity = int(line["quantity"])
        line_total = product["price"] * quantity
        item_count += quantity
        subtotal += line_total
        output_lines.append({
            "id": line["id"],
            "product": public_product(product),
            "quantity": quantity,
            "lineTotal": line_total,
        })
    shipping = 0 if subtotal >= 999 or subtotal == 0 else 79
    return {
        "id": cart["id"],
        "customerId": cart["customerId"],
        "lines": output_lines,
        "subtotal": subtotal,
        "shipping": shipping,
        "total": subtotal + shipping,
        "itemCount": item_count,
    }


def get_identity_token() -> str:
    if os.environ.get("REPLIT_IDENTITY"):
        return f"repl {os.environ['REPLIT_IDENTITY']}"
    if os.environ.get("WEB_REPL_RENEWAL"):
        return f"depl {os.environ['WEB_REPL_RENEWAL']}"
    try:
        token = subprocess.check_output(
            ["replit", "identity", "create", "--audience", "https://connectors.replit.com"],
            text=True,
            timeout=5,
        ).strip()
        if token:
            return token
    except (FileNotFoundError, subprocess.SubprocessError):
        pass
    return ""


def shopify_graphql(query: str, variables: dict[str, Any]) -> dict[str, Any] | None:
    hostname = os.environ.get("REPLIT_CONNECTORS_HOSTNAME", "connectors.replit.com")
    if hostname.startswith("http://") or hostname.startswith("https://"):
        base = hostname
    else:
        base = f"https://{hostname}"
    identity = get_identity_token()
    if not identity:
        return None
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Connector-Name": "shopify-store",
    }
    if identity.startswith("repl ") or identity.startswith("depl "):
        headers["X-Replit-Token"] = identity
    else:
        headers["Replit-Authentication"] = f"Bearer {identity}"
    try:
        response = requests.post(
            f"{base}/api/v2/proxy/admin/api/2026-04/graphql.json",
            headers=headers,
            json={"query": query, "variables": variables},
            timeout=20,
        )
        if response.status_code >= 400:
            return None
        payload = response.json()
        if payload.get("errors"):
            return None
        return payload.get("data")
    except (requests.RequestException, ValueError):
        return None


def create_shopify_cart(cart: dict[str, Any]) -> str | None:
    lines = []
    for line in cart.get("lines", []):
        product = products.find_one({"id": line["productId"]})
        variant_id = product.get("shopifyVariantId") if product else None
        if not variant_id:
            return None
        lines.append({"merchandiseId": variant_id, "quantity": int(line["quantity"])})
    if not lines:
        return None
    data = shopify_graphql(
        """mutation CartCreate($input: CartInput!) {
          cartCreate(input: $input) {
            cart { id checkoutUrl }
            userErrors { field message }
          }
        }""",
        {"input": {"lines": lines}},
    )
    result = (data or {}).get("cartCreate") or {}
    if result.get("userErrors") or not result.get("cart"):
        return None
    return result["cart"]["checkoutUrl"]


@app.get("/api")
@app.get("/api/healthz")
def healthz() -> dict[str, str]:
    mongo.admin.command("ping")
    return {"status": "ok", "database": "connected"}


@app.get("/api/storefront/summary")
def storefront_summary() -> dict[str, Any]:
    category_rows = products.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ])
    categories = [
        {"id": row["_id"], "label": str(row["_id"]).title(), "count": row["count"]}
        for row in category_rows
    ]
    featured = [public_product(product) for product in products.find().sort("rating", -1).limit(4)]
    return {
        "categories": categories,
        "featured": featured,
        "promo": {
            "eyebrow": "A³ welcome offer",
            "title": "Your first order, made a little brighter.",
            "description": "Save ₹200 on orders over ₹1,499 with free delivery included.",
            "code": "A3WELCOME",
        },
    }


@app.get("/api/products")
def list_products(
    search: str = "",
    category: str = "",
    sort: str = Query(default="featured"),
    limit: int = Query(default=24, ge=1, le=48),
) -> list[dict[str, Any]]:
    query: dict[str, Any] = {}
    if search.strip():
        query["$or"] = [
            {"title": {"$regex": search.strip(), "$options": "i"}},
            {"description": {"$regex": search.strip(), "$options": "i"}},
        ]
    if category.strip():
        query["category"] = category.strip().lower()
    sort_field = "rating" if sort == "rating" else "price" if sort in ("price-low", "price-high") else "createdAt"
    direction = 1 if sort == "price-low" else -1
    return [public_product(product) for product in products.find(query).sort(sort_field, direction).limit(limit)]


@app.get("/api/products/{product_id}")
def get_product(product_id: str) -> dict[str, Any]:
    product = products.find_one({"id": product_id})
    if not product:
        raise HTTPException(404, "Product not found")
    return public_product(product)


@app.post("/api/customers")
def create_customer(payload: CustomerInput) -> dict[str, Any]:
    email = str(payload.email).lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(400, "Please enter a valid email address")
    customer = customers.find_one({"email": email})
    if customer:
        customers.update_one({"id": customer["id"]}, {"$set": {"name": payload.name, "phone": payload.phone, "updatedAt": now_iso()}})
        customer = customers.find_one({"id": customer["id"]})
    else:
        customer = {
            "id": f"cus_{uuid.uuid4().hex[:12]}",
            "customerNumber": f"A3-{uuid.uuid4().hex[:8].upper()}",
            "email": email,
            "name": payload.name,
            "phone": payload.phone,
            "address": {"addressLine1": "", "addressLine2": "", "city": "", "state": "", "postalCode": ""},
            "createdAt": now_iso(),
        }
        customers.insert_one(customer)
        make_cart(customer["id"])
    return customer_payload(customer)


@app.get("/api/customers/{customer_id}")
def get_customer(customer_id: str) -> dict[str, Any]:
    return customer_payload(find_customer(customer_id))


@app.patch("/api/customers/{customer_id}/profile")
def update_customer_profile(customer_id: str, payload: ProfileInput) -> dict[str, Any]:
    find_customer(customer_id)
    address = payload.model_dump(exclude={"name", "phone"})
    customers.update_one(
        {"id": customer_id},
        {"$set": {"name": payload.name, "phone": payload.phone, "address": address, "updatedAt": now_iso()}},
    )
    return customer_payload(find_customer(customer_id))


@app.get("/api/customers/{customer_id}/cart")
def get_cart(customer_id: str) -> dict[str, Any]:
    find_customer(customer_id)
    return cart_payload(make_cart(customer_id))


@app.post("/api/customers/{customer_id}/cart/lines")
def add_cart_line(customer_id: str, payload: CartLineInput) -> dict[str, Any]:
    find_customer(customer_id)
    product = products.find_one({"id": payload.productId})
    if not product or not product.get("inStock"):
        raise HTTPException(404, "Product is not available")
    cart = make_cart(customer_id)
    lines = cart.get("lines", [])
    existing = next((line for line in lines if line["productId"] == payload.productId), None)
    if existing:
        existing["quantity"] = min(20, existing["quantity"] + payload.quantity)
    else:
        lines.append({"id": f"line_{uuid.uuid4().hex[:10]}", "productId": payload.productId, "quantity": payload.quantity})
    carts.update_one({"id": cart["id"]}, {"$set": {"lines": lines, "updatedAt": now_iso()}})
    return cart_payload(carts.find_one({"id": cart["id"]}))


@app.patch("/api/customers/{customer_id}/cart/lines/{line_id}")
def update_cart_line(customer_id: str, line_id: str, payload: CartLineUpdate) -> dict[str, Any]:
    find_customer(customer_id)
    cart = make_cart(customer_id)
    lines = [line for line in cart.get("lines", []) if line["id"] != line_id or payload.quantity > 0]
    for line in lines:
        if line["id"] == line_id:
            line["quantity"] = payload.quantity
    carts.update_one({"id": cart["id"]}, {"$set": {"lines": lines, "updatedAt": now_iso()}})
    return cart_payload(carts.find_one({"id": cart["id"]}))


@app.delete("/api/customers/{customer_id}/cart/lines/{line_id}")
def remove_cart_line(customer_id: str, line_id: str) -> dict[str, Any]:
    find_customer(customer_id)
    cart = make_cart(customer_id)
    lines = [line for line in cart.get("lines", []) if line["id"] != line_id]
    carts.update_one({"id": cart["id"]}, {"$set": {"lines": lines, "updatedAt": now_iso()}})
    return cart_payload(carts.find_one({"id": cart["id"]}))


@app.post("/api/customers/{customer_id}/checkout", status_code=201)
def checkout(customer_id: str, payload: CheckoutInput) -> dict[str, Any]:
    customer = find_customer(customer_id)
    cart = make_cart(customer_id)
    cart_view = cart_payload(cart)
    if not cart_view["lines"]:
        raise HTTPException(400, "Your cart is empty")
    customers.update_one(
        {"id": customer_id},
        {
            "$set": {
                "address": {
                    "addressLine1": payload.addressLine1,
                    "addressLine2": payload.addressLine2,
                    "city": payload.city,
                    "state": payload.state,
                    "postalCode": payload.postalCode,
                },
                "updatedAt": now_iso(),
            }
        },
    )
    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    order = {
        "id": order_id,
        "orderNumber": f"A3-{uuid.uuid4().hex[:8].upper()}",
        "customerId": customer_id,
        "status": "checkout_started",
        "paymentStatus": "pending",
        "deliveryStatus": "Preparing order",
        "items": cart_view["lines"],
        "total": cart_view["total"],
        "trackingNumber": None,
        "createdAt": now_iso(),
        "address": payload.model_dump(),
        "note": payload.note,
    }
    orders.insert_one(order)
    checkout_url = create_shopify_cart(cart)
    if checkout_url:
        orders.update_one({"id": order_id}, {"$set": {"checkoutUrl": checkout_url, "status": "awaiting_payment"}})
        return {"orderId": order_id, "checkoutUrl": checkout_url, "status": "awaiting_payment"}
    return {"orderId": order_id, "checkoutUrl": f"/orders/{order_id}", "status": "payment_setup_required"}


@app.get("/api/customers/{customer_id}/orders")
def list_customer_orders(customer_id: str) -> list[dict[str, Any]]:
    find_customer(customer_id)
    return [clean(order) for order in orders.find({"customerId": customer_id}).sort("createdAt", -1)]


@app.get("/api/orders/{order_id}")
def get_order(order_id: str) -> dict[str, Any]:
    order = clean(orders.find_one({"id": order_id}))
    if not order:
        raise HTTPException(404, "Order not found")
    return order


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")