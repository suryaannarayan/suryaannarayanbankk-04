import { GoogleSheetsService, GoogleSheetsUtils } from './googleSheetsService';
import { User, Transaction } from '@/lib/types';
import { formatDate } from '@/utils/bankUtils';

const SPREADSHEET_ID = '1aQ03-kaMJeQyyqVICBOLZO0UZxBOf4vbPLuc_9SnpO8';

export class GoogleSheetsBankService {
  // Sheet ranges
  private static USERS_RANGE = 'Users!A:H';
  private static TRANSACTIONS_RANGE = 'Transactions!A:H';
  
  /**
   * Initialize the spreadsheet with headers if empty
   */
  static async initializeSheets() {
    try {
      // Initialize Users sheet
      const usersData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, 'Users!A1:H1');
      if (!usersData?.values || usersData.values.length === 0) {
        const userHeaders = [
          ['ID', 'FirstName', 'LastName', 'Username', 'Email', 'AccountNumber', 'Balance', 'IsAdmin']
        ];
        await GoogleSheetsService.writeSheet(SPREADSHEET_ID, 'Users!A1:H1', userHeaders);
      }

      // Initialize Transactions sheet
      const transactionsData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, 'Transactions!A1:H1');
      if (!transactionsData?.values || transactionsData.values.length === 0) {
        const transactionHeaders = [
          ['ID', 'Type', 'Amount', 'FromAccount', 'ToAccount', 'Description', 'Timestamp', 'Status']
        ];
        await GoogleSheetsService.writeSheet(SPREADSHEET_ID, 'Transactions!A1:H1', transactionHeaders);
      }
    } catch (error) {
      console.error('Failed to initialize sheets:', error);
      throw error;
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
}