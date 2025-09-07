
import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Initialize Google Sheets and migrate data if needed
  useEffect(() => {
    const initializeGoogleSheets = async () => {
      try {
        // Try to initialize Google Sheets
        await GoogleSheetsBankService.initializeSheets();
        
        // Check if we need to migrate from localStorage
        const localUsers = JSON.parse(localStorage.getItem('suryabank_users') || '[]');
        const localTransactions = JSON.parse(localStorage.getItem('suryabank_transactions') || '[]');
        
        if (localUsers.length > 0 || localTransactions.length > 0) {
          console.log('Migrating data from localStorage to Google Sheets...');
          await GoogleSheetsBankService.migrateFromLocalStorage();
          toast({
            title: "Data Migrated",
            description: "Your data has been successfully migrated to Google Sheets",
          });
        }
        
        setIsGoogleSheetsMode(true);
      } catch (error) {
        console.warn('Google Sheets not available, falling back to localStorage:', error);
        setIsGoogleSheetsMode(false);
        toast({
          title: "Offline Mode",
          description: "Using local storage. Connect Google Sheets for cloud sync.",
          variant: "destructive"
        });
      }
    };

    initializeGoogleSheets();
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
    setLoading(true);
    try {
      if (isGoogleSheetsMode && user) {
        const userTransactions = await GoogleSheetsBankService.getUserTransactions(user.accountNumber);
        setTransactions(userTransactions);
      } else {
        // Fallback to localStorage
        const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
        const userTransactions = allTransactions.filter((t: Transaction) => 
          t.fromAccount === user?.accountNumber || t.toAccount === user?.accountNumber
        );
        setTransactions(userTransactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      // Fallback to localStorage on error
      try {
        const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
        const userTransactions = allTransactions.filter((t: Transaction) => 
          t.fromAccount === user?.accountNumber || t.toAccount === user?.accountNumber
        );
        setTransactions(userTransactions);
      } catch (fallbackError) {
        toast({
          title: "Error",
          description: "Failed to load transactions",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Update user balance
  const updateUserBalance = async (accountNumber: string, newBalance: number): Promise<void> => {
    try {
      if (isGoogleSheetsMode) {
        await GoogleSheetsBankService.updateUserBalance(accountNumber, newBalance);
      }
      
      // Also update localStorage for fallback
      const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const updatedUsers = users.map((u: User) => {
        if (u.accountNumber === accountNumber) {
          return { ...u, balance: newBalance };
        }
        return u;
      });
      
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      
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

  // Create and save a new transaction
  const saveTransaction = async (
    type: 'deposit' | 'withdrawal' | 'transfer',
    amount: number,
    fromAccount?: string,
    toAccount?: string
  ): Promise<void> => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount,
      fromAccount,
      toAccount,
      description: getTransactionDescription(type, fromAccount, toAccount),
      timestamp: new Date()
    };
    
    try {
      if (isGoogleSheetsMode) {
        await GoogleSheetsBankService.addTransaction(newTransaction);
      }
      
      // Also save to localStorage for fallback
      const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
      allTransactions.push(newTransaction);
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(allTransactions));
      
      // Update local state
      setTransactions(prev => [...prev, newTransaction]);
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
