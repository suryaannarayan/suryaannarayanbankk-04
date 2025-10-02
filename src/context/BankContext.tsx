
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BankContextType, Transaction, User } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getTransactionDescription } from '@/utils/bankUtils';
import { GoogleSheetsBankService } from '@/services/googleSheetsBankService';

// Create a context for banking operations
const BankContext = createContext<BankContextType | undefined>(undefined);

// Storage keys
const TRANSACTIONS_STORAGE_KEY = 'suryabank_transactions';
const USERS_STORAGE_KEY = 'suryabank_users';

export const BankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isGoogleSheetsMode, setIsGoogleSheetsMode] = useState<boolean>(true);
  const { toast } = useToast();

  // Initialize storage and Google Sheets connection
  useEffect(() => {
    const initializeDataSources = async () => {
      // Always ensure local storage has proper structure
      if (!localStorage.getItem(USERS_STORAGE_KEY)) {
        localStorage.setItem(USERS_STORAGE_KEY, '[]');
      }
      if (!localStorage.getItem(TRANSACTIONS_STORAGE_KEY)) {
        localStorage.setItem(TRANSACTIONS_STORAGE_KEY, '[]');
      }

      // Try to connect to Google Sheets for cloud sync
      try {
        console.log('Attempting to connect to Google Sheets...');
        await GoogleSheetsBankService.initializeSheets();
        setIsGoogleSheetsMode(true);
        console.log('Google Sheets connected successfully');
        
        // Check if we need to migrate local data
        const localUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
        const localTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
        
        if (localUsers.length > 0 || localTransactions.length > 0) {
          console.log('Local data found, will sync to cloud when admin migrates');
        }
      } catch (error) {
        console.warn('Google Sheets connection failed, running in offline mode:', error);
        setIsGoogleSheetsMode(false);
      }
    };

    initializeDataSources();
  }, []);

  // Load transactions for the current user
  useEffect(() => {
    if (user) {
      getTransactions();
    } else {
      setTransactions([]);
    }
  }, [user, isGoogleSheetsMode]);

  // Get all transactions for the current user
  const getTransactions = async (): Promise<void> => {
    if (!user) return;
    
    setLoading(true);
    try {
      let userTransactions: Transaction[] = [];
      
      if (isGoogleSheetsMode) {
        try {
          userTransactions = await GoogleSheetsBankService.getUserTransactions(user.accountNumber);
          console.log(`Loaded ${userTransactions.length} transactions from Google Sheets`);
        } catch (error) {
          console.warn('Failed to load from Google Sheets, falling back to localStorage:', error);
          setIsGoogleSheetsMode(false);
          // Fall through to localStorage loading
        }
      }
      
      if (!isGoogleSheetsMode || userTransactions.length === 0) {
        // Load from localStorage
        const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
        userTransactions = allTransactions.filter((t: Transaction) => 
          t.fromAccount === user.accountNumber || t.toAccount === user.accountNumber
        );
        console.log(`Loaded ${userTransactions.length} transactions from localStorage`);
      }
      
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Update user balance in both Google Sheets and localStorage
  const updateUserBalance = async (accountNumber: string, newBalance: number): Promise<void> => {
    try {
      // Always update localStorage first for reliability
      const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const updatedUsers = users.map((u: User) => {
        if (u.accountNumber === accountNumber) {
          return { ...u, balance: newBalance };
        }
        return u;
      });
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      
      // Try to sync with Google Sheets if available
      if (isGoogleSheetsMode) {
        try {
          await GoogleSheetsBankService.updateUserBalance(accountNumber, newBalance);
          console.log('Balance synced to Google Sheets');
        } catch (error) {
          console.warn('Failed to sync balance to Google Sheets, continuing with local storage:', error);
          // Don't throw error, local storage update succeeded
        }
      }
      
      // Update current user session if it's the logged-in user
      if (user && user.accountNumber === accountNumber) {
        const updatedUser = { ...user, balance: newBalance };
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to update user balance:', error);
      throw error;
    }
  };

  // Create and save a new transaction in both Google Sheets and localStorage
  const saveTransaction = async (
    type: 'deposit' | 'withdrawal' | 'transfer',
    amount: number,
    fromAccount?: string,
    toAccount?: string
  ): Promise<void> => {
    const newTransaction: Transaction = {
      id: uuidv4(),
      type,
      amount,
      fromAccount,
      toAccount,
      description: getTransactionDescription(type, fromAccount, toAccount),
      timestamp: new Date()
    };
    
    try {
      // Always save to localStorage first for reliability
      const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
      allTransactions.push(newTransaction);
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(allTransactions));
      
      // Update local state immediately
      setTransactions(prev => [...prev, newTransaction]);
      
      // Try to sync with Google Sheets if available
      if (isGoogleSheetsMode) {
        try {
          await GoogleSheetsBankService.addTransaction(newTransaction);
          console.log('Transaction synced to Google Sheets');
        } catch (error) {
          console.warn('Failed to sync transaction to Google Sheets, continuing with local storage:', error);
          // Don't throw error, local storage save succeeded
        }
      }
    } catch (error) {
      console.error('Failed to save transaction:', error);
      throw error;
    }
  };

  // Deposit money into account
  const deposit = async (amount: number): Promise<void> => {
    setLoading(true);
    try {
      if (!user) throw new Error("User not authenticated");
      if (amount <= 0) throw new Error("Amount must be greater than zero");
      
      const newBalance = user.balance + amount;
      await updateUserBalance(user.accountNumber, newBalance);
      await saveTransaction('deposit', amount, undefined, user.accountNumber);
      
      toast({
        title: "Deposit Successful",
        description: `${formatCurrency(amount)} has been added to your account`,
      });
    } catch (error: any) {
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Withdraw money from account
  const withdraw = async (amount: number): Promise<void> => {
    setLoading(true);
    try {
      if (!user) throw new Error("User not authenticated");
      if (amount <= 0) throw new Error("Amount must be greater than zero");
      if (user.balance < amount) throw new Error("Insufficient balance");
      
      const newBalance = user.balance - amount;
      await updateUserBalance(user.accountNumber, newBalance);
      await saveTransaction('withdrawal', amount, user.accountNumber, undefined);
      
      toast({
        title: "Withdrawal Successful",
        description: `${formatCurrency(amount)} has been withdrawn from your account`,
      });
    } catch (error: any) {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Transfer money to another account
  const transfer = async (amount: number, recipientAccountNumber: string, note?: string): Promise<void> => {
    setLoading(true);
    try {
      if (!user) throw new Error("User not authenticated");
      if (amount <= 0) throw new Error("Amount must be greater than zero");
      if (user.balance < amount) throw new Error("Insufficient balance");
      if (user.accountNumber === recipientAccountNumber) throw new Error("Cannot transfer to your own account");
      
      // Check if recipient exists
      let recipient: User | null = null;
      if (isGoogleSheetsMode) {
        recipient = await GoogleSheetsBankService.getUserByAccountNumber(recipientAccountNumber);
      } else {
        const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
        recipient = users.find((u: User) => u.accountNumber === recipientAccountNumber) || null;
      }
      
      if (!recipient) throw new Error("Recipient account not found");
      
      // Update sender balance
      const senderNewBalance = user.balance - amount;
      await updateUserBalance(user.accountNumber, senderNewBalance);
      
      // Update recipient balance
      const recipientNewBalance = recipient.balance + amount;
      await updateUserBalance(recipientAccountNumber, recipientNewBalance);
      
      // Save transaction
      const description = note ? note : getTransactionDescription('transfer', user.accountNumber, recipientAccountNumber);
      await saveTransaction('transfer', amount, user.accountNumber, recipientAccountNumber);
      
      toast({
        title: "Transfer Successful",
        description: `${formatCurrency(amount)} has been sent to ${recipientAccountNumber}`,
      });
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <BankContext.Provider value={{ 
      transactions, 
      loading, 
      deposit, 
      withdraw, 
      transfer, 
      getTransactions,
      isGoogleSheetsMode 
    }}>
      {children}
    </BankContext.Provider>
  );
};

export const useBank = () => {
  const context = useContext(BankContext);
  if (context === undefined) {
    throw new Error('useBank must be used within a BankProvider');
  }
  return context;
};
