import { type User, type InsertUser, type IpLog, type InsertIpLog, type Settings, type InsertSettings } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createIpLog(ipLog: InsertIpLog): Promise<IpLog>;
  getIpLogs(limit?: number, offset?: number): Promise<IpLog[]>;
  getTotalIpLogs(): Promise<number>;
  getUniqueIpCount(): Promise<number>;
  getRecentLogs(hours?: number): Promise<IpLog[]>;
  getSettings(): Promise<Settings | undefined>;
  createOrUpdateSettings(settings: InsertSettings): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private ipLogs: Map<string, IpLog>;
  private settings: Settings | null;

  constructor() {
    this.users = new Map();
    this.ipLogs = new Map();
    this.settings = null;
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createIpLog(insertIpLog: InsertIpLog): Promise<IpLog> {
    const id = randomUUID();
    const ipLog: IpLog = {
      ipAddress: insertIpLog.ipAddress,
      userAgent: insertIpLog.userAgent || null,
      referrer: insertIpLog.referrer || null,
      location: insertIpLog.location || null,
      status: insertIpLog.status || 'success',
      id,
      timestamp: new Date(),
    };
    this.ipLogs.set(id, ipLog);
    return ipLog;
  }

  async getIpLogs(limit: number = 50, offset: number = 0): Promise<IpLog[]> {
    const logs = Array.from(this.ipLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
    return logs;
  }

  async getTotalIpLogs(): Promise<number> {
    return this.ipLogs.size;
  }

  async getUniqueIpCount(): Promise<number> {
    const uniqueIps = new Set(Array.from(this.ipLogs.values()).map(log => log.ipAddress));
    return uniqueIps.size;
  }

  async getRecentLogs(hours: number = 1): Promise<IpLog[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.ipLogs.values())
      .filter(log => log.timestamp >= cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getSettings(): Promise<Settings | undefined> {
    return this.settings || undefined;
  }

  async createOrUpdateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const settings: Settings = {
      id: this.settings?.id || randomUUID(),
      webhookUrl: insertSettings.webhookUrl || null,
      uploadedImageName: insertSettings.uploadedImageName || null,
      uploadedImageData: insertSettings.uploadedImageData || null,
      uploadedImageType: insertSettings.uploadedImageType || null,
      createdAt: this.settings?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.settings = settings;
    return settings;
  }
}

export const storage = new MemStorage();
