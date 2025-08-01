import { 
  users, products, categories, customers, orders, orderItems, transactions, stockMovements,
  type User, type InsertUser, type Product, type InsertProduct, type Category, type InsertCategory,
  type Customer, type InsertCustomer, type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Transaction, type InsertTransaction, type StockMovement, type InsertStockMovement
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, lt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

  // Categories
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory & { userId: string }): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Products
  getProducts(userId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getLowStockProducts(userId: string): Promise<Product[]>;
  createProduct(product: InsertProduct & { userId: string }): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  updateProductStock(id: string, quantity: number): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Customers
  getCustomers(userId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string, userId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer & { userId: string }): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Orders
  getOrders(userId: string, limit?: number): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderWithItems(id: string): Promise<{ order: Order; items: (OrderItem & { product: Product })[] } | undefined>;
  createOrder(order: InsertOrder & { userId: string }, items: InsertOrderItem[]): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(id: string): Promise<void>;

  // Transactions
  getTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction>;
  getDailySales(userId: string, date: Date): Promise<{ total: number; upiTotal: number; count: number }>;

  // Stock Movements
  createStockMovement(movement: InsertStockMovement & { userId: string }): Promise<StockMovement>;
  getStockMovements(productId: string): Promise<StockMovement[]>;

  // Dashboard Stats
  getDashboardStats(userId: string): Promise<{
    todaySales: number;
    ordersCount: number;
    lowStockCount: number;
    upiCollection: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user;
  }

  async getCategories(userId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId));
  }

  async createCategory(category: InsertCategory & { userId: string }): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db.update(categories).set(categoryData).where(eq(categories.id, id)).returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getProducts(userId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.userId, userId));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getLowStockProducts(userId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(
        eq(products.userId, userId),
        sql`${products.stock} <= ${products.minStock}`
      ));
  }

  async createProduct(product: InsertProduct & { userId: string }): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db.update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async updateProductStock(id: string, quantity: number): Promise<Product> {
    const [product] = await db.update(products)
      .set({ 
        stock: sql`${products.stock} + ${quantity}`,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getCustomers(userId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.userId, userId));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByPhone(phone: string, userId: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.phone, phone), eq(customers.userId, userId)));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer & { userId: string }): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db.update(customers).set(customerData).where(eq(customers.id, id)).returning();
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getOrders(userId: string, limit: number = 50): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderWithItems(id: string): Promise<{ order: Order; items: (OrderItem & { product: Product })[] } | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      gstRate: orderItems.gstRate,
      product: products,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

    return { order, items };
  }

  async createOrder(order: InsertOrder & { userId: string }, items: InsertOrderItem[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values(order).returning();
      
      for (const item of items) {
        await tx.insert(orderItems).values({ ...item, orderId: newOrder.id });
        
        // Update product stock
        await tx.update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));

        // Create stock movement
        await tx.insert(stockMovements).values({
          productId: item.productId,
          userId: order.userId,
          type: "out",
          quantity: `-${item.quantity}`,
          reason: "sale",
          orderId: newOrder.id,
        });
      }

      return newOrder;
    });
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order> {
    const [order] = await db.update(orders)
      .set({ ...orderData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getDailySales(userId: string, date: Date): Promise<{ total: number; upiTotal: number; count: number }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const results = await db.select({
      total: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'sale' THEN ${transactions.amount} ELSE 0 END), 0)`,
      upiTotal: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'sale' AND ${transactions.paymentMethod} = 'upi' THEN ${transactions.amount} ELSE 0 END), 0)`,
      count: sql<number>`COUNT(CASE WHEN ${transactions.type} = 'sale' THEN 1 ELSE NULL END)`,
    })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      sql`${transactions.createdAt} >= ${startOfDay}`,
      sql`${transactions.createdAt} <= ${endOfDay}`
    ));

    return results[0] || { total: 0, upiTotal: 0, count: 0 };
  }

  async createStockMovement(movement: InsertStockMovement & { userId: string }): Promise<StockMovement> {
    const [newMovement] = await db.insert(stockMovements).values(movement).returning();
    return newMovement;
  }

  async getStockMovements(productId: string): Promise<StockMovement[]> {
    return await db.select().from(stockMovements)
      .where(eq(stockMovements.productId, productId))
      .orderBy(desc(stockMovements.createdAt));
  }

  async getDashboardStats(userId: string): Promise<{
    todaySales: number;
    ordersCount: number;
    lowStockCount: number;
    upiCollection: number;
  }> {
    const today = new Date();
    const dailySales = await this.getDailySales(userId, today);
    
    const lowStockProducts = await this.getLowStockProducts(userId);
    
    return {
      todaySales: dailySales.total,
      ordersCount: dailySales.count,
      lowStockCount: lowStockProducts.length,
      upiCollection: dailySales.upiTotal,
    };
  }
}

export const storage = new DatabaseStorage();
