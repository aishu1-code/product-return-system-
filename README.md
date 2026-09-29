# A³ Market - Full Stack E-Commerce Shopping Platform

A modern, responsive e-commerce web application featuring real-time product discovery, interactive shopping cart management, seamless multi-channel checkout (UPI, Cards, Net Banking, COD), and MongoDB Atlas database integration.

## 🚀 Features

- **Storefront & Product Discovery**: Featured collections, department filtering, search, and sorting options.
- **Cart & Order Management**: Real-time cart updates and customer order history.
- **Multi-Option Checkout**: Integrated payment options (UPI / GPay, Credit/Debit Card, Net Banking, Cash on Delivery).
- **MongoDB Atlas Integration**: Live persistent backend data store for products, customers, carts, and orders.
- **Responsive Modern UI**: Modern dark/light styling built with Tailwind CSS, Radix UI, and Lucide Icons.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Wouter (Client-side Router), TanStack Query, Tailwind CSS.
- **Backend API**: Node.js, Express 5, Mongoose.
- **Database**: MongoDB Atlas.
- **Monorepo**: pnpm Workspaces, TypeScript.

## 📦 Getting Started

### 1. Installation

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://akshayprogrammingstudy_db_user:zYudTesuxa3OlV93@cluster0.y7blwhd.mongodb.net/a3-shopping?retryWrites=true&w=majority
PORT=5000
```

### 3. Run Locally

Start the backend API server:
```bash
pnpm --filter @workspace/api-server run start
```

Start the Vite frontend development server:
```bash
pnpm --filter @workspace/a3-shopping-platform run dev
```

Visit `http://localhost:5173/` in your browser.
