import { GoogleSheetsService, GoogleSheetsUtils } from './googleSheetsService';
import { User, Transaction } from '@/lib/types';
import { formatDate } from '@/utils/bankUtils';

const SPREADSHEET_ID = '1aQ03-kaMJeQyyqVICBOLZO0UZxBOf4vbPLuc_9SnpO8';

export class GoogleSheetsBankService {
  // Sheet ranges
  private static USERS_RANGE = 'Users!A:H';
  private static TRANSACTIONS_RANGE = 'Transactions!A:H';
  private static CREDIT_CARDS_RANGE = 'CreditCards!A:M';
  private static COUPONS_RANGE = 'Coupons!A:H';
  private static PREMIUM_APPLICATIONS_RANGE = 'PremiumApplications!A:J';
  
  /**
   * Check if Google Sheets is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      await GoogleSheetsService.readSheet(SPREADSHEET_ID, 'Users!A1:A1');
      return true;
    } catch (error) {
      console.log('Google Sheets unavailable, using offline mode');
      return false;
    }
  }

  /**
   * Initialize the spreadsheet with headers if empty
   */
  static async initializeSheets() {
    try {
      // Try to initialize each sheet, ignore errors if sheet doesn't exist
      try {
        const usersData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, 'Users!A1:H1');
        if (!usersData?.values || usersData.values.length === 0) {
          const userHeaders = [
            ['ID', 'FirstName', 'LastName', 'Username', 'Email', 'AccountNumber', 'Balance', 'IsAdmin']
          ];
          await GoogleSheetsService.writeSheet(SPREADSHEET_ID, 'Users!A1:H1', userHeaders);
        }
      } catch (error) {
        console.log('Users sheet may not exist or has errors, skipping...');
      }

      try {
        const transactionsData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, 'Transactions!A1:H1');
        if (!transactionsData?.values || transactionsData.values.length === 0) {
          const transactionHeaders = [
            ['ID', 'Type', 'Amount', 'FromAccount', 'ToAccount', 'Description', 'Timestamp', 'Status']
          ];
          await GoogleSheetsService.writeSheet(SPREADSHEET_ID, 'Transactions!A1:H1', transactionHeaders);
        }
      } catch (error) {
        console.log('Transactions sheet may not exist or has errors, skipping...');
      }

      try {
        const creditCardsData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, 'CreditCards!A1:M1');
        if (!creditCardsData?.values || creditCardsData.values.length === 0) {
          const creditCardHeaders = [
            ['ID', 'UserId', 'CardNumber', 'CardholderName', 'CVV', 'ExpiryDate', 'PIN', 'IsActive', 'IsBlocked', 'FailedAttempts', 'PermanentlyBlocked', 'ValidityYears', 'IsPremium']
          ];
          await GoogleSheetsService.writeSheet(SPREADSHEET_ID, 'CreditCards!A1:M1', creditCardHeaders);
        }
      } catch (error) {
        console.log('CreditCards sheet may not exist or has errors, skipping...');
      }

      try {
        const couponsData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, 'Coupons!A1:H1');
        if (!couponsData?.values || couponsData.values.length === 0) {
          const couponHeaders = [
            ['Code', 'Type', 'Discount', 'Value', 'ExpiryDate', 'UserId', 'CreatedAt', 'Fee']
          ];
          await GoogleSheetsService.writeSheet(SPREADSHEET_ID, 'Coupons!A1:H1', couponHeaders);
        }
      } catch (error) {
        console.log('Coupons sheet may not exist or has errors, skipping...');
      }

      try {
        const premiumAppsData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, 'PremiumApplications!A1:J1');
        if (!premiumAppsData?.values || premiumAppsData.values.length === 0) {
          const premiumHeaders = [
            ['ID', 'UserId', 'Username', 'AccountNumber', 'CustomCard', 'CustomCardNumber', 'CustomCVV', 'FeesPaid', 'Status', 'AppliedAt']
          ];
          await GoogleSheetsService.writeSheet(SPREADSHEET_ID, 'PremiumApplications!A1:J1', premiumHeaders);
        }
      } catch (error) {
        console.log('PremiumApplications sheet may not exist or has errors, skipping...');
      }

      console.log('Sheets initialization completed');
    } catch (error) {
      console.error('Failed to initialize sheets:', error);
      // Don't throw - allow offline mode to continue
    }
  }

  /**
   * Get all users from Google Sheets
   */
  static async getUsers(): Promise<User[]> {
    try {
      const result = await GoogleSheetsService.readSheet(SPREADSHEET_ID, this.USERS_RANGE);
      if (!result?.values || result.values.length <= 1) return [];
      
      const objects = GoogleSheetsUtils.sheetValuesToObjects(result.values);
      return objects.map(obj => ({
        id: obj.ID,
        firstName: obj.FirstName,
        lastName: obj.LastName,
        username: obj.Username,
        email: obj.Email,
        accountNumber: obj.AccountNumber,
        balance: parseFloat(obj.Balance) || 0,
        isAdmin: obj.IsAdmin === 'true',
        createdAt: new Date()
      }));
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  /**
   * Get user by account number
   */
  static async getUserByAccountNumber(accountNumber: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(user => user.accountNumber === accountNumber) || null;
  }

  /**
   * Update user balance
   */
  static async updateUserBalance(accountNumber: string, newBalance: number): Promise<void> {
    try {
      const users = await this.getUsers();
      const userIndex = users.findIndex(user => user.accountNumber === accountNumber);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // Update balance in the array
      users[userIndex].balance = newBalance;
      
      // Convert back to sheet format
      const sheetData = GoogleSheetsUtils.objectsToSheetValues(users.map(user => ({
        ID: user.id,
        FirstName: user.firstName,
        LastName: user.lastName,
        Username: user.username,
        Email: user.email,
        AccountNumber: user.accountNumber,
        Balance: user.balance.toString(),
        IsAdmin: user.isAdmin.toString()
      })));

      // Write back to sheet (starting from row 1 to include headers)
      await GoogleSheetsService.writeSheet(SPREADSHEET_ID, this.USERS_RANGE, sheetData);
    } catch (error) {
      console.error('Failed to update user balance:', error);
      throw error;
    }
  }

  /**
   * Add new user
   */
  static async addUser(user: User): Promise<void> {
    try {
      const users = await this.getUsers();
      users.push(user);
      
      const sheetData = GoogleSheetsUtils.objectsToSheetValues(users.map(u => ({
        ID: u.id,
        FirstName: u.firstName,
        LastName: u.lastName,
        Username: u.username,
        Email: u.email,
        AccountNumber: u.accountNumber,
        Balance: u.balance.toString(),
        IsAdmin: u.isAdmin.toString()
      })));

      await GoogleSheetsService.writeSheet(SPREADSHEET_ID, this.USERS_RANGE, sheetData);
    } catch (error) {
      console.error('Failed to add user:', error);
      throw error;
    }
  }

  /**
   * Get all transactions
   */
  static async getTransactions(): Promise<Transaction[]> {
    try {
      const result = await GoogleSheetsService.readSheet(SPREADSHEET_ID, this.TRANSACTIONS_RANGE);
      if (!result?.values || result.values.length <= 1) return [];
      
      const objects = GoogleSheetsUtils.sheetValuesToObjects(result.values);
      return objects.map(obj => ({
        id: obj.ID,
        type: obj.Type as 'deposit' | 'withdrawal' | 'transfer',
        amount: parseFloat(obj.Amount) || 0,
        fromAccount: obj.FromAccount || undefined,
        toAccount: obj.ToAccount || undefined,
        description: obj.Description,
        timestamp: new Date(obj.Timestamp)
      }));
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  }

  /**
   * Get transactions for a specific user
   */
  static async getUserTransactions(accountNumber: string): Promise<Transaction[]> {
    const allTransactions = await this.getTransactions();
    return allTransactions.filter(transaction => 
      transaction.fromAccount === accountNumber || transaction.toAccount === accountNumber
    );
  }

  /**
   * Add new transaction
   */
  static async addTransaction(transaction: Transaction): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      transactions.push(transaction);
      
      const sheetData = GoogleSheetsUtils.objectsToSheetValues(transactions.map(t => ({
        ID: t.id,
        Type: t.type,
        Amount: t.amount.toString(),
        FromAccount: t.fromAccount || '',
        ToAccount: t.toAccount || '',
        Description: t.description,
        Timestamp: t.timestamp.toISOString(),
        Status: 'completed'
      })));

      await GoogleSheetsService.writeSheet(SPREADSHEET_ID, this.TRANSACTIONS_RANGE, sheetData);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  }

  /**
   * Sync user from localStorage to Google Sheets
   */
  static async syncUserFromLocalStorage(user: User): Promise<void> {
    try {
      const existingUsers = await this.getUsers();
      const existingUser = existingUsers.find(u => u.accountNumber === user.accountNumber);
      
      if (!existingUser) {
        await this.addUser(user);
      } else {
        // Update balance if different
        if (existingUser.balance !== user.balance) {
          await this.updateUserBalance(user.accountNumber, user.balance);
        }
      }
    } catch (error) {
      console.error('Failed to sync user from localStorage:', error);
      throw error;
    }
  }

  /**
   * Migrate all data from localStorage to Google Sheets
   */
  static async migrateFromLocalStorage(): Promise<void> {
    try {
      console.log('Starting migration from localStorage to Google Sheets...');
      
      // Get data from localStorage
      const localUsers = JSON.parse(localStorage.getItem('suryabank_users') || '[]');
      const localTransactions = JSON.parse(localStorage.getItem('suryabank_transactions') || '[]');
      const localCreditCards = JSON.parse(localStorage.getItem('suryabank_credit_cards') || '[]');

      console.log(`Found ${localUsers.length} users, ${localTransactions.length} transactions, ${localCreditCards.length} credit cards in localStorage`);

      // Initialize sheets first
      await this.initializeSheets();
      console.log('Sheets initialized successfully');

      // Migrate users
      if (localUsers.length > 0) {
        const users: User[] = localUsers.map((u: any) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          username: u.username,
          email: u.email,
          accountNumber: u.accountNumber,
          balance: u.balance,
          isAdmin: u.isAdmin || false,
          createdAt: new Date(u.createdAt)
        }));

        const userSheetData = GoogleSheetsUtils.objectsToSheetValues(users.map(user => ({
          ID: user.id,
          FirstName: user.firstName,
          LastName: user.lastName,
          Username: user.username,
          Email: user.email,
          AccountNumber: user.accountNumber,
          Balance: user.balance.toString(),
          IsAdmin: user.isAdmin.toString()
        })));

        await GoogleSheetsService.writeSheet(SPREADSHEET_ID, this.USERS_RANGE, userSheetData);
      }

      // Migrate transactions
      if (localTransactions.length > 0) {
        const transactions: Transaction[] = localTransactions.map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          fromAccount: t.fromAccount,
          toAccount: t.toAccount,
          description: t.description,
          timestamp: new Date(t.timestamp)
        }));

        const transactionSheetData = GoogleSheetsUtils.objectsToSheetValues(transactions.map(t => ({
          ID: t.id,
          Type: t.type,
          Amount: t.amount.toString(),
          FromAccount: t.fromAccount || '',
          ToAccount: t.toAccount || '',
          Description: t.description,
          Timestamp: t.timestamp.toISOString(),
          Status: 'completed'
        })));

        await GoogleSheetsService.writeSheet(SPREADSHEET_ID, this.TRANSACTIONS_RANGE, transactionSheetData);
      }

      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Sync all credit card data to Google Sheets
   */
  static async syncCreditCardsToSheets(): Promise<void> {
    try {
      const localCreditCards = JSON.parse(localStorage.getItem('credit_cards') || '[]');
      
      if (localCreditCards.length > 0) {
        const creditCardSheetData = GoogleSheetsUtils.objectsToSheetValues(localCreditCards.map((card: any) => ({
          ID: card.id,
          UserId: card.userId,
          CardNumber: card.cardNumber,
          CardholderName: card.cardholderName,
          CVV: card.cvv,
          ExpiryDate: new Date(card.expiryDate).toISOString(),
          PIN: card.pin,
          IsActive: card.isActive.toString(),
          IsBlocked: card.isBlocked.toString(),
          FailedAttempts: card.failedAttempts.toString(),
          PermanentlyBlocked: card.permanentlyBlocked.toString(),
          ValidityYears: card.validityYears.toString(),
          IsPremium: (card.isPremium || false).toString()
        })));

        await GoogleSheetsService.writeSheet(SPREADSHEET_ID, this.CREDIT_CARDS_RANGE, creditCardSheetData);
      }
    } catch (error) {
      console.error('Failed to sync credit cards to sheets:', error);
      throw error;
    }
  }

  /**
   * Sync all coupon data to Google Sheets
   */
  static async syncCouponsToSheets(): Promise<void> {
    try {
      const localCoupons = JSON.parse(localStorage.getItem('user_coupons') || '[]');
      
      if (localCoupons.length > 0) {
        const couponSheetData = GoogleSheetsUtils.objectsToSheetValues(localCoupons.map((coupon: any) => ({
          Code: coupon.code,
          Type: coupon.type || 'discount',
          Discount: coupon.discount || '',
          Value: coupon.value || '',
          ExpiryDate: coupon.expiryDate,
          UserId: coupon.userId,
          CreatedAt: coupon.createdAt,
          Fee: coupon.fee || 0
        })));

        await GoogleSheetsService.writeSheet(SPREADSHEET_ID, this.COUPONS_RANGE, couponSheetData);
      }
    } catch (error) {
      console.error('Failed to sync coupons to sheets:', error);
      throw error;
    }
  }

  /**
   * Sync all premium application data to Google Sheets
   */
  static async syncPremiumApplicationsToSheets(): Promise<void> {
    try {
      const localApplications = JSON.parse(localStorage.getItem('premium_applications') || '[]');
      
      if (localApplications.length > 0) {
        const applicationSheetData = GoogleSheetsUtils.objectsToSheetValues(localApplications.map((app: any) => ({
          ID: app.id,
          UserId: app.userId,
          Username: app.username,
          AccountNumber: app.accountNumber,
          CustomCard: app.customCard ? 'true' : 'false',
          CustomCardNumber: app.customCardNumber || '',
          CustomCVV: app.customCVV || '',
          FeesPaid: app.feesPaid || 0,
          Status: app.status || 'pending',
          AppliedAt: app.appliedAt
        })));

        await GoogleSheetsService.writeSheet(SPREADSHEET_ID, this.PREMIUM_APPLICATIONS_RANGE, applicationSheetData);
      }
    } catch (error) {
      console.error('Failed to sync premium applications to sheets:', error);
      throw error;
    }
  }

  /**
   * Complete migration and sync of all data to Google Sheets
   */
  static async fullDataSync(): Promise<void> {
    try {
      console.log('Starting complete data sync to Google Sheets...');
      
      // Check if Google Sheets is available
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        console.log('Google Sheets is not available, sync cancelled');
        throw new Error('Google Sheets is not available. Please check your internet connection and sheet access.');
      }
      
      // Initialize all sheets first
      await this.initializeSheets();
      
      // Sync all data types
      await this.migrateFromLocalStorage(); // Users and transactions
      await this.syncCreditCardsToSheets();
      await this.syncCouponsToSheets();
      await this.syncPremiumApplicationsToSheets();
      
      console.log('Complete data sync finished successfully');
    } catch (error) {
      console.error('Complete data sync failed:', error);
      throw error;
    }
  }
}