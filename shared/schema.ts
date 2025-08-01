import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  shopName: text("shop_name").notNull(),
  shopNameHindi: text("shop_name_hindi"),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  upiId: text("upi_id"),
  address: text("address"),
  gstNumber: text("gst_number"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameHindi: text("name_hindi"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameHindi: text("name_hindi"),
  categoryId: varchar("category_id").references(() => categories.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: decimal("stock", { precision: 10, scale: 3 }).notNull().default("0"),
  unit: text("unit").notNull().default("pcs"), // pcs, kg, L, etc.
  minStock: decimal("min_stock", { precision: 10, scale: 3 }).default("0"),
  barcode: text("barcode"),
  isPackaged: boolean("is_packaged").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  landmark: text("landmark"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).default("0"),
  outstandingAmount: decimal("outstanding_amount", { precision: 10, scale: 2 }).default("0"),
  whatsappNumber: text("whatsapp_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull(),
  customerId: varchar("customer_id").references(() => customers.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, partial
  paymentMethod: text("payment_method"), // cash, upi, card, credit
  upiApp: text("upi_app"), // phonepe, googlepay, paytm, bhim
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).default("0"),
  deliveryAddress: text("delivery_address"),
  deliveryLandmark: text("delivery_landmark"),
  notes: text("notes"),
  isOfflineOrder: boolean("is_offline_order").default(false),
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).default("0"),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  customerId: varchar("customer_id").references(() => customers.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // sale, purchase, credit_payment, expense
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  upiApp: text("upi_app"),
  upiTransactionId: text("upi_transaction_id"),
  description: text("description"),
  isOfflineTransaction: boolean("is_offline_transaction").default(false),
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // in, out, adjustment
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  reason: text("reason"), // sale, purchase, return, damage, adjustment
  orderId: varchar("order_id").references(() => orders.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  categories: many(categories),
  customers: many(customers),
  orders: many(orders),
  transactions: many(transactions),
  stockMovements: many(stockMovements),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, { fields: [products.userId], references: [users.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  orderItems: many(orderItems),
  stockMovements: many(stockMovements),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  orders: many(orders),
  transactions: many(transactions),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  orderItems: many(orderItems),
  transactions: many(transactions),
  stockMovements: many(stockMovements),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  customer: one(customers, { fields: [transactions.customerId], references: [customers.id] }),
  order: one(orders, { fields: [transactions.orderId], references: [orders.id] }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  user: one(users, { fields: [stockMovements.userId], references: [users.id] }),
  product: one(products, { fields: [stockMovements.productId], references: [products.id] }),
  order: one(orders, { fields: [stockMovements.orderId], references: [orders.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
  userId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
