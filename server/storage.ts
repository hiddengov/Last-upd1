import { type User, type InsertUser, type IpLog, type InsertIpLog, type Settings, type InsertSettings, type AccessKey, type InsertAccessKey, type UserSession, type InsertUserSession } from "@shared/schema";
import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { users, ipLogs, settings, accessKeys, userSessions } from "@shared/schema/schema"; // Assuming your schema is in @shared/schema/schema

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTheme(userId: string, theme: string): Promise<void>;
  updateUserProfile(userId: string, profileData: { username?: string; profilePicture?: string }): Promise<User>;
  updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
  getAllUsers(requestingUserId?: string): Promise<any[]>;
  createUserByDev(data: any, createdBy: string): Promise<any>;
  banUser(userId: string, banReason: string, bannedBy: string): Promise<void>;
  unbanUser(userId: string, unbannedBy: string): Promise<void>;
  deleteUser(userId: string, deletedBy: string): Promise<void>;

  // Access key operations
  createAccessKey(key: InsertAccessKey): Promise<AccessKey>;
  getAccessKey(key: string): Promise<AccessKey | undefined>;
  useAccessKey(key: string): Promise<boolean>;
  getUserAccessKeys(userId: string): Promise<AccessKey[]>;
  deleteAccessKey(keyId: string, userId: string): Promise<boolean>;

  // Session operations
  createSession(session: InsertUserSession): Promise<UserSession>;
  getSession(token: string): Promise<UserSession | undefined>;
  deleteSession(token: string): Promise<void>;

  // IP Log operations
  createIpLog(ipLog: InsertIpLog): Promise<IpLog>;
  getIpLogs(userId?: string, limit?: number, offset?: number): Promise<IpLog[]>;
  getTotalIpLogs(userId?: string): Promise<number>;
  getUniqueIpCount(userId?: string): Promise<number>;
  getRecentLogs(userId?: string, hours?: number): Promise<IpLog[]>;

  // Settings operations
  getSettings(userId?: string): Promise<Settings | null>;
  createOrUpdateSettings(settings: InsertSettings): Promise<Settings>;
  getAnySettingsWithImage(): Promise<{ settings: Settings, userId: string } | null>;
  getAnySettingsWithWebhook(): Promise<{ settings: Settings, userId: string } | null>;
}

export class MemStorage implements IStorage {
  // In-memory storage simulation. In a real app, this would interact with a database.
  private users: Map<string, User>;
  private ipLogs: Map<string, IpLog>;
  private settings: Map<string, Settings>;
  private accessKeys: Map<string, AccessKey>;
  private sessions: Map<string, UserSession>;

  // Dummy database interaction placeholders
  private db: any; // Replace with your actual database client (e.g., drizzle-orm client)

  constructor() {
    this.users = new Map();
    this.ipLogs = new Map();
    this.settings = new Map();
    this.accessKeys = new Map();
    this.sessions = new Map();

    // Initialize with a developer account for testing purposes
    this.initializeDevAccount();
  }

  private async initializeDevAccount() {
    const devUser: User = {
      id: randomUUID(),
      username: "exnldev",
      password: "Av121988-", // In a real app, use hashed passwords
      theme: "default",
      isDev: true,
      accessKeyUsed: null,
      profilePicture: null,
      createdAt: new Date(),
      accountType: "developer", // Added for new schema
      isBanned: false,
      bannedAt: null,
      bannedBy: null,
      banReason: null,
      lastLoginAt: null,
    };
    this.users.set(devUser.id, devUser);

    // Create permanent dev access key
    const devKey: AccessKey = {
      id: randomUUID(),
      key: "Av121988",
      usageLimit: 999999, // Virtually unlimited for devs
      usedCount: 0,
      isActive: true,
      createdBy: devUser.id,
      createdAt: new Date()
    };
    this.accessKeys.set(devKey.key, devKey);

    // Create a permanent demo key for testing
    const permanentKey: AccessKey = {
      id: randomUUID(),
      key: "demo123",
      usageLimit: 999999,
      usedCount: 0,
      isActive: true,
      createdBy: devUser.id,
      createdAt: new Date()
    };
    this.accessKeys.set(permanentKey.key, permanentKey);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser & { accessKeyUsed?: string }): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      theme: "default",
      isDev: false,
      accessKeyUsed: insertUser.accessKeyUsed || null,
      profilePicture: null,
      createdAt: new Date(),
      accountType: insertUser.accountType || "user", // Default to 'user'
      isBanned: false,
      bannedAt: null,
      bannedBy: null,
      banReason: null,
      lastLoginAt: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserTheme(userId: string, theme: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, theme });
    }
  }

  async updateUserProfile(userId: string, profileData: { username?: string; profilePicture?: string }): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if username is being changed and if it's already taken
    if (profileData.username && profileData.username !== user.username) {
      const existingUser = await this.getUserByUsername(profileData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }
    }

    const updatedUser: User = {
      ...user,
      ...profileData,
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.password !== currentPassword) {
      throw new Error('Current password is incorrect');
    }

    this.users.set(userId, { ...user, password: newPassword });
  }

  async getAllUsers(requesterId?: string): Promise<any[]> {
    if (requesterId) {
      const requester = await this.getUser(requesterId);
      if (!requester?.isDev) {
        throw new Error('Access denied: Developer privileges required');
      }
    } else {
      // Allow access for internal system operations (like image serving)
      // but only return basic user info for security
      return Array.from(this.users.values()).map(user => ({
        id: user.id,
        username: user.username,
        password: '',
        theme: user.theme,
        isDev: user.isDev,
        profilePicture: user.profilePicture,
        accountType: user.accountType,
        accessKeyUsed: user.accessKeyUsed,
        isBanned: user.isBanned,
        banReason: user.banReason,
        bannedAt: user.bannedAt,
        bannedBy: user.bannedBy,
        createdAt: user.createdAt
      }));
    }

    return Array.from(this.users.values()).map(user => ({
      id: user.id,
      username: user.username,
      accountType: user.accountType,
      isDev: user.isDev,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      bannedAt: user.bannedAt,
      banReason: user.banReason,
      accessKeyUsed: user.accessKeyUsed
    }));
  }

  async createUserByDev(data: any, createdBy: string): Promise<any> {
    const creator = await this.getUser(createdBy);
    if (!creator?.isDev) {
      throw new Error('Access denied: Developer privileges required');
    }

    // In a real app, this would insert into the database:
    // const newUser = await this.db.insert(users).values(data).returning();
    // return newUser[0];

    const id = randomUUID();
    const newUser: User = {
      ...data,
      id,
      theme: "default",
      isDev: data.isDev || false,
      profilePicture: data.profilePicture || null,
      createdAt: new Date(),
      accountType: data.accountType || "user",
      isBanned: false,
      bannedAt: null,
      bannedBy: null,
      banReason: null,
      lastLoginAt: null,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async banUser(userId: string, banReason: string, bannedBy: string): Promise<void> {
    const banner = await this.getUser(bannedBy);
    if (!banner?.isDev) {
      throw new Error('Access denied: Developer privileges required');
    }

    // In a real app, this would update the database:
    // await this.db.update(users).set({
    //   isBanned: true,
    //   bannedAt: new Date(),
    //   bannedBy,
    //   banReason
    // }).where(eq(users.id, userId));
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, isBanned: true, bannedAt: new Date(), bannedBy, banReason });
    }
  }

  async unbanUser(userId: string, unbannedBy: string): Promise<void> {
    const unbanner = await this.getUser(unbannedBy);
    if (!unbanner?.isDev) {
      throw new Error('Access denied: Developer privileges required');
    }

    // In a real app, this would update the database:
    // await this.db.update(users).set({
    //   isBanned: false,
    //   bannedAt: null,
    //   bannedBy: null,
    //   banReason: null
    // }).where(eq(users.id, userId));
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, isBanned: false, bannedAt: null, bannedBy: null, banReason: null });
    }
  }

  async deleteUser(userId: string, deletedBy: string): Promise<void> {
    const deleter = await this.getUser(deletedBy);
    if (!deleter?.isDev) {
      throw new Error('Access denied: Developer privileges required');
    }

    // Don't allow deleting other developers
    const userToDelete = await this.getUser(userId);
    if (userToDelete?.isDev && userToDelete.id !== deletedBy) {
      throw new Error('Cannot delete other developer accounts');
    }

    // In a real app, this would perform database deletions:
    // // Delete user sessions first
    // await this.db.delete(userSessions).where(eq(userSessions.userId, userId));
    // // Delete user logs
    // await this.db.delete(ipLogs).where(eq(ipLogs.userId, userId));
    // // Delete user settings
    // await this.db.delete(settings).where(eq(settings.userId, userId));
    // // Finally delete the user
    // await this.db.delete(users).where(eq(users.id, userId));

    this.users.delete(userId);
    this.sessions.delete(userId); // Assuming session token is tied to userId or can be found
    this.settings.delete(userId);
    // For ipLogs, we'd need to iterate and remove logs associated with userId
    this.ipLogs = new Map(Array.from(this.ipLogs.entries()).filter(([key, value]) => value.userId !== userId));
    // For accessKeys, we'd need to iterate and remove keys created by userId
    this.accessKeys = new Map(Array.from(this.accessKeys.entries()).filter(([key, value]) => value.createdBy !== userId));
  }

  async createAccessKey(insertKey: InsertAccessKey): Promise<AccessKey> {
    const id = randomUUID();
    const accessKey: AccessKey = {
      id,
      key: insertKey.key,
      usageLimit: insertKey.usageLimit || 1,
      usedCount: 0,
      isActive: insertKey.isActive !== false,
      createdBy: insertKey.createdBy || null,
      createdAt: new Date()
    };
    this.accessKeys.set(insertKey.key, accessKey);
    return accessKey;
  }

  async getAccessKey(key: string): Promise<AccessKey | undefined> {
    return this.accessKeys.get(key);
  }

  async useAccessKey(key: string): Promise<boolean> {
    const accessKey = this.accessKeys.get(key);
    if (!accessKey || !accessKey.isActive || accessKey.usedCount >= accessKey.usageLimit) {
      return false;
    }
    this.accessKeys.set(key, { ...accessKey, usedCount: accessKey.usedCount + 1 });
    return true;
  }

  async getUserAccessKeys(userId: string): Promise<AccessKey[]> {
    return Array.from(this.accessKeys.values()).filter(key => key.createdBy === userId);
  }

  async deleteAccessKey(keyId: string, userId: string): Promise<boolean> {
    const accessKey = Array.from(this.accessKeys.values()).find(key => key.id === keyId && key.createdBy === userId);
    if (accessKey) {
      this.accessKeys.delete(accessKey.key);
      return true;
    }
    return false;
  }

  async createSession(insertSession: InsertUserSession): Promise<UserSession> {
    const id = randomUUID();
    const session: UserSession = {
      ...insertSession,
      id,
      createdAt: new Date()
    };
    this.sessions.set(insertSession.sessionToken, session);
    return session;
  }

  async getSession(token: string): Promise<UserSession | undefined> {
    const session = this.sessions.get(token);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.sessions.delete(token);
    }
    return undefined;
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async createIpLog(insertIpLog: InsertIpLog): Promise<IpLog> {
    const id = randomUUID();
    const ipLog: IpLog = {
      id,
      userId: insertIpLog.userId || null,
      ipAddress: insertIpLog.ipAddress,
      userAgent: insertIpLog.userAgent || null,
      referrer: insertIpLog.referrer || null,
      location: insertIpLog.location || null,
      status: insertIpLog.status || 'success',
      isVpn: insertIpLog.isVpn || null,
      vpnLocation: insertIpLog.vpnLocation || null,
      realLocation: insertIpLog.realLocation || null,
      deviceType: insertIpLog.deviceType || null,
      browserName: insertIpLog.browserName || null,
      operatingSystem: insertIpLog.operatingSystem || null,
      deviceBrand: insertIpLog.deviceBrand || null,
      timestamp: new Date(),
    };
    this.ipLogs.set(id, ipLog);
    return ipLog;
  }

  async getIpLogs(userId?: string, limit: number = 50, offset: number = 0): Promise<IpLog[]> {
    let logs = Array.from(this.ipLogs.values());
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  async getTotalIpLogs(userId?: string): Promise<number> {
    if (userId) {
      return Array.from(this.ipLogs.values()).filter(log => log.userId === userId).length;
    }
    return this.ipLogs.size;
  }

  async getUniqueIpCount(userId?: string): Promise<number> {
    let logs = Array.from(this.ipLogs.values());
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    const uniqueIps = new Set(logs.map(log => log.ipAddress));
    return uniqueIps.size;
  }

  async getRecentLogs(userId?: string, hours: number = 1): Promise<IpLog[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    let logs = Array.from(this.ipLogs.values()).filter(log => log.timestamp >= cutoff);
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getSettings(userId?: string): Promise<Settings | null> {
    if (!userId) {
      // This part of the logic seems to be intended for cases where you might want a default or first setting
      // if no specific userId is provided, which might be an edge case.
      // Returning null or throwing an error might be more appropriate if userId is always expected.
      // For now, keeping it as per original structure, but consider refining.
      const settingsArray = Array.from(this.settings.values());
      return settingsArray.length > 0 ? settingsArray[0] : null;
    }
    return this.settings.get(userId) || null;
  }

  async createOrUpdateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const existingSettings = this.settings.get(insertSettings.userId);
    const settings: Settings = {
      id: existingSettings?.id || randomUUID(),
      userId: insertSettings.userId,
      webhookUrl: insertSettings.webhookUrl || null,
      uploadedImageName: insertSettings.uploadedImageName || null,
      uploadedImageData: insertSettings.uploadedImageData || null,
      uploadedImageType: insertSettings.uploadedImageType || null,
      createdAt: existingSettings?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.settings.set(insertSettings.userId, settings);
    return settings;
  }

  async getAnySettingsWithImage(): Promise<{ settings: Settings, userId: string } | null> {
    for (const [userId, setting] of this.settings.entries()) {
      if (setting.uploadedImageData) {
        return { settings: setting, userId: userId };
      }
    }
    return null;
  }

  async getAnySettingsWithWebhook(): Promise<{ settings: Settings, userId: string } | null> {
    for (const [userId, setting] of this.settings.entries()) {
      if (setting.webhookUrl) {
        return { settings: setting, userId: userId };
      }
    }
    return null;
  }
}

export const storage = new MemStorage();