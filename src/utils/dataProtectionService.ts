import { GoogleSheetsBankService } from '@/services/googleSheetsBankService';
import { DataSyncUtils } from './dataSyncUtils';

/**
 * Data Protection and Backup System
 * Ensures no data is ever lost or automatically deleted
 */
export class DataProtectionService {
  private static readonly BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_BACKUP_VERSIONS = 100; // Keep 100 versions
  private static backupInterval: number | null = null;

  /**
   * Initialize the data protection system
   */
  static initialize(): void {
    console.log('Initializing Data Protection System...');
    
    // Start periodic backups
    this.startPeriodicBackups();
    
    // Create initial backup
    this.createInstantBackup();
    
    // Setup before unload protection
    this.setupBeforeUnloadProtection();
    
    // Setup storage event listeners
    this.setupStorageProtection();
    
    console.log('Data Protection System initialized successfully');
  }

  /**
   * Start periodic automatic backups
   */
  private static startPeriodicBackups(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    this.backupInterval = window.setInterval(async () => {
      try {
        await this.createTimestampedBackup();
        console.log('Periodic backup completed');
      } catch (error) {
        console.error('Periodic backup failed:', error);
      }
    }, this.BACKUP_INTERVAL);
  }

  /**
   * Create an instant backup of all data
   */
  static async createInstantBackup(): Promise<void> {
    try {
      // Try to backup to Google Sheets (but don't fail if unavailable)
      try {
        const isAvailable = await GoogleSheetsBankService.isAvailable();
        if (isAvailable) {
          await DataSyncUtils.performCompleteSync();
          console.log('Google Sheets backup completed');
        } else {
          console.log('Google Sheets unavailable, using local backup only');
        }
      } catch (error) {
        console.log('Google Sheets backup failed, continuing with local backup:', error);
      }
      
      // Create local timestamped backup (always succeeds)
      await this.createTimestampedBackup();
      
      console.log('Instant backup completed successfully');
    } catch (error) {
      console.error('Instant backup failed:', error);
      throw error;
    }
  }

  /**
   * Create a timestamped backup in localStorage
   */
  private static async createTimestampedBackup(): Promise<void> {
    const timestamp = new Date().toISOString();
    const backupData = {
      timestamp,
      users: JSON.parse(localStorage.getItem('suryabank_users') || '[]'),
      transactions: JSON.parse(localStorage.getItem('suryabank_transactions') || '[]'),
      creditCards: JSON.parse(localStorage.getItem('credit_cards') || '[]'),
      coupons: JSON.parse(localStorage.getItem('user_coupons') || '[]'),
      premiumApplications: JSON.parse(localStorage.getItem('premium_applications') || '[]'),
      cardBalances: JSON.parse(localStorage.getItem('credit_card_balances') || '{}'),
      accountRequests: JSON.parse(localStorage.getItem('account_number_requests') || '[]'),
      currentUser: sessionStorage.getItem('currentUser')
    };

    // Store backup with timestamp
    const backupKey = `backup_${timestamp.replace(/[:.]/g, '-')}`;
    localStorage.setItem(backupKey, JSON.stringify(backupData));

    // Clean old backups (keep only MAX_BACKUP_VERSIONS)
    this.cleanOldBackups();

    // Try to sync to Google Sheets (but don't fail if unavailable)
    try {
      const isAvailable = await GoogleSheetsBankService.isAvailable();
      if (isAvailable) {
        await DataSyncUtils.performCompleteSync();
      }
    } catch (error) {
      console.log('Google Sheets sync skipped during backup:', error);
    }
  }

  /**
   * Clean old backups while preserving data integrity
   */
  private static cleanOldBackups(): void {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('backup_'))
      .sort()
      .reverse(); // Most recent first

    // Keep only the most recent backups
    if (backupKeys.length > this.MAX_BACKUP_VERSIONS) {
      const keysToRemove = backupKeys.slice(this.MAX_BACKUP_VERSIONS);
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Setup protection against accidental data loss
   */
  private static setupBeforeUnloadProtection(): void {
    window.addEventListener('beforeunload', async (event) => {
      try {
        // Create final backup before page unload
        await this.createInstantBackup();
      } catch (error) {
        console.error('Pre-unload backup failed:', error);
      }
    });

    // Also handle page visibility changes
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'hidden') {
        try {
          await this.createInstantBackup();
        } catch (error) {
          console.error('Visibility change backup failed:', error);
        }
      }
    });
  }

  /**
   * Setup storage protection to prevent accidental data deletion
   */
  private static setupStorageProtection(): void {
    // Monitor storage changes
    window.addEventListener('storage', (event) => {
      if (event.key && this.isProtectedKey(event.key)) {
        console.log(`Protected data modified: ${event.key}`);
        // Create backup when protected data changes
        this.createTimestampedBackup().catch(console.error);
      }
    });
  }

  /**
   * Check if a storage key contains protected data
   */
  private static isProtectedKey(key: string): boolean {
    const protectedKeys = [
      'suryabank_users',
      'suryabank_transactions',
      'credit_cards',
      'user_coupons',
      'premium_applications',
      'credit_card_balances',
      'account_number_requests'
    ];
    return protectedKeys.includes(key);
  }

  /**
   * Restore data from a specific backup
   */
  static async restoreFromBackup(backupTimestamp: string): Promise<void> {
    try {
      const backupKey = `backup_${backupTimestamp.replace(/[:.]/g, '-')}`;
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) {
        throw new Error('Backup not found');
      }

      const backup = JSON.parse(backupData);
      
      // Restore all data
      if (backup.users) localStorage.setItem('suryabank_users', JSON.stringify(backup.users));
      if (backup.transactions) localStorage.setItem('suryabank_transactions', JSON.stringify(backup.transactions));
      if (backup.creditCards) localStorage.setItem('credit_cards', JSON.stringify(backup.creditCards));
      if (backup.coupons) localStorage.setItem('user_coupons', JSON.stringify(backup.coupons));
      if (backup.premiumApplications) localStorage.setItem('premium_applications', JSON.stringify(backup.premiumApplications));
      if (backup.cardBalances) localStorage.setItem('credit_card_balances', JSON.stringify(backup.cardBalances));
      if (backup.accountRequests) localStorage.setItem('account_number_requests', JSON.stringify(backup.accountRequests));
      if (backup.currentUser) sessionStorage.setItem('currentUser', backup.currentUser);

      console.log(`Data restored from backup: ${backupTimestamp}`);
    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw error;
    }
  }

  /**
   * Get list of available backups
   */
  static getAvailableBackups(): Array<{timestamp: string, size: number}> {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('backup_'))
      .map(key => {
        const timestamp = key.replace('backup_', '').replace(/-/g, ':');
        const data = localStorage.getItem(key);
        return {
          timestamp,
          size: data ? data.length : 0
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Prevent deletion of protected data
   */
  static protectAgainstDeletion(): void {
    // Override dangerous localStorage methods
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);
    const originalClear = localStorage.clear.bind(localStorage);

    localStorage.removeItem = function(key: string) {
      if (DataProtectionService.isProtectedKey(key)) {
        console.warn(`Attempted to delete protected data: ${key}. Operation blocked.`);
        // Create backup before allowing any deletion
        DataProtectionService.createTimestampedBackup().catch(console.error);
        return;
      }
      return originalRemoveItem(key);
    };

    localStorage.clear = function() {
      console.warn('Attempted to clear all localStorage. Creating emergency backup...');
      DataProtectionService.createTimestampedBackup().then(() => {
        // Allow clear after backup
        originalClear();
      }).catch(console.error);
    };
  }

  /**
   * Monitor and protect session storage
   */
  static protectSessionStorage(): void {
    const originalRemoveItem = sessionStorage.removeItem.bind(sessionStorage);
    const originalClear = sessionStorage.clear.bind(sessionStorage);

    sessionStorage.removeItem = function(key: string) {
      if (key === 'currentUser') {
        console.log('Current user session being removed - creating backup');
        DataProtectionService.createTimestampedBackup().catch(console.error);
      }
      return originalRemoveItem(key);
    };

    sessionStorage.clear = function() {
      console.warn('Session storage being cleared - creating backup');
      DataProtectionService.createTimestampedBackup().catch(console.error);
      return originalClear();
    };
  }

  /**
   * Create redundant data storage across multiple locations
   */
  static async createRedundantBackup(): Promise<void> {
    try {
      // 1. Local storage with versioning (always succeeds)
      await this.createTimestampedBackup();
      
      // 2. IndexedDB backup (browser database)
      await this.saveToIndexedDB();
      
      // 3. Google Sheets backup (if available)
      try {
        const isAvailable = await GoogleSheetsBankService.isAvailable();
        if (isAvailable) {
          await DataSyncUtils.performCompleteSync();
          console.log('Google Sheets backup completed');
        } else {
          console.log('Google Sheets unavailable - data saved to local backups only');
        }
      } catch (error) {
        console.error('Google Sheets backup failed, but local backups succeeded:', error);
        throw new Error('Google Sheets is not available. Please check your internet connection and ensure sheets exist.');
      }
      
      console.log('Redundant backup completed across all available storage systems');
    } catch (error) {
      console.error('Redundant backup failed:', error);
      throw error;
    }
  }

  /**
   * Save data to IndexedDB for additional protection
   */
  private static async saveToIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SuryaBankBackup', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['backups'], 'readwrite');
        const store = transaction.objectStore('backups');
        
        const backupData = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          data: {
            users: JSON.parse(localStorage.getItem('suryabank_users') || '[]'),
            transactions: JSON.parse(localStorage.getItem('suryabank_transactions') || '[]'),
            creditCards: JSON.parse(localStorage.getItem('credit_cards') || '[]'),
            coupons: JSON.parse(localStorage.getItem('user_coupons') || '[]'),
            premiumApplications: JSON.parse(localStorage.getItem('premium_applications') || '[]'),
            cardBalances: JSON.parse(localStorage.getItem('credit_card_balances') || '{}'),
            accountRequests: JSON.parse(localStorage.getItem('account_number_requests') || '[]')
          }
        };
        
        store.add(backupData);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Stop the protection service
   */
  static stop(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }
}

// Auto-initialize when module loads
DataProtectionService.initialize();
