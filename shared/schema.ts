import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const ipLogs = pgTable("ip_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  location: text("location"),
  status: text("status").notNull().default("success"),
  isVpn: text("is_vpn"), // 'yes', 'no', 'unknown'
  vpnLocation: text("vpn_location"), // VPN server location if detected
  realLocation: text("real_location"), // Estimated real location if VPN detected
  deviceType: text("device_type"), // 'mobile', 'desktop', 'tablet', 'unknown'
  browserName: text("browser_name"),
  operatingSystem: text("operating_system"),
  deviceBrand: text("device_brand"),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookUrl: text("webhook_url"),
  uploadedImageName: text("uploaded_image_name"),
  uploadedImageData: text("uploaded_image_data"), // base64 encoded
  uploadedImageType: text("uploaded_image_type"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertIpLogSchema = createInsertSchema(ipLogs).omit({
  id: true,
  timestamp: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertIpLog = z.infer<typeof insertIpLogSchema>;
export type IpLog = typeof ipLogs.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;