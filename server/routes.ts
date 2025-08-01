import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCustomerSchema, insertOrderSchema, insertCategorySchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard Stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const products = await storage.getProducts(userId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/low-stock", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const products = await storage.getLowStockProducts(userId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct({ ...productData, userId });
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid product data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid product data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  });

  app.put("/api/products/:id/stock", async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const userId = "user-1"; // TODO: Get from session/auth
      
      const product = await storage.updateProductStock(id, quantity);
      
      // Create stock movement record
      await storage.createStockMovement({
        productId: id,
        userId,
        type: quantity > 0 ? "in" : "out",
        quantity: Math.abs(quantity).toString(),
        reason: "adjustment",
        notes: "Manual stock adjustment",
      });
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product stock" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory({ ...categoryData, userId });
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });

  // Customers
  app.get("/api/customers", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const customers = await storage.getCustomers(userId);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer({ ...customerData, userId });
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid customer data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create customer" });
      }
    }
  });

  app.get("/api/customers/phone/:phone", async (req, res) => {
    try {
      const { phone } = req.params;
      const userId = "user-1"; // TODO: Get from session/auth
      const customer = await storage.getCustomerByPhone(phone, userId);
      if (customer) {
        res.json(customer);
      } else {
        res.status(404).json({ error: "Customer not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const orders = await storage.getOrders(userId, limit);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const orderWithItems = await storage.getOrderWithItems(id);
      if (orderWithItems) {
        res.json(orderWithItems);
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const { order: orderData, items } = req.body;
      
      const validatedOrder = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder({ ...validatedOrder, userId }, items);
      
      // Create transaction record
      if (order.paymentStatus === "paid") {
        await storage.createTransaction({
          orderId: order.id,
          customerId: order.customerId,
          userId,
          type: "sale",
          amount: order.totalAmount,
          paymentMethod: order.paymentMethod || "cash",
          upiApp: order.upiApp,
          description: `Sale for order ${order.orderNumber}`,
        });
      }
      
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, orderData);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update order" });
      }
    }
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const userId = "user-1"; // TODO: Get from session/auth
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction({ ...transactionData, userId });
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid transaction data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create transaction" });
      }
    }
  });

  // UPI QR Code generation
  app.post("/api/upi/generate-qr", async (req, res) => {
    try {
      const { amount, description } = req.body;
      const userId = "user-1"; // TODO: Get from session/auth
      
      const user = await storage.getUser(userId);
      if (!user || !user.upiId) {
        return res.status(400).json({ error: "UPI ID not configured" });
      }

      const upiUrl = `upi://pay?pa=${user.upiId}&pn=${encodeURIComponent(user.shopName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(description || "Payment")}`;
      
      res.json({
        upiUrl,
        qrData: upiUrl,
        shopName: user.shopName,
        shopNameHindi: user.shopNameHindi,
        upiId: user.upiId,
        amount,
        description,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate UPI QR code" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
