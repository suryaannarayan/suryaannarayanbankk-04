
import React, { createContext, useContext, useState, useEffect } from 'react';
import { BankContextType, Transaction, User } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getTransactionDescription } from '@/utils/bankUtils';

// Create a context for banking operations
const BankContext = createContext<BankContextType | undefined>(undefined);

// Storage keys
const TRANSACTIONS_STORAGE_KEY = 'suryabank_transactions';
const USERS_STORAGE_KEY = 'suryabank_users';

export const BankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Load transactions for the current user
  useEffect(() => {
    if (user) {
      getTransactions();
    } else {
      setTransactions([]);
    }
  }, [user]);

  // Get all transactions for the current user
  const getTransactions = async (): Promise<void> => {
    setLoading(true);
    try {
      const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
      // Filter transactions for the current user
      const userTransactions = allTransactions.filter((t: Transaction) => 
        t.fromAccount === user?.accountNumber || t.toAccount === user?.accountNumber
      );
      
      setTransactions(userTransactions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update user balance
  const updateUserBalance = (accountNumber: string, newBalance: number): void => {
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
  };

  // Create and save a new transaction
  const saveTransaction = (
    type: 'deposit' | 'withdrawal' | 'transfer',
    amount: number,
    fromAccount?: string,
    toAccount?: string
  ): void => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount,
      fromAccount,
      toAccount,
      description: getTransactionDescription(type, fromAccount, toAccount),
      timestamp: new Date()
    };
    
    const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
    allTransactions.push(newTransaction);
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(allTransactions));
    
    // Update local state
    setTransactions(prev => [...prev, newTransaction]);
  };

  // Deposit money into account
  const deposit = async (amount: number): Promise<void> => {
    setLoading(true);
    try {
      if (!user) throw new Error("User not authenticated");
      if (amount <= 0) throw new Error("Amount must be greater than zero");
      
      const newBalance = user.balance + amount;
      updateUserBalance(user.accountNumber, newBalance);
      saveTransaction('deposit', amount, undefined, user.accountNumber);
      
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
      updateUserBalance(user.accountNumber, newBalance);
      saveTransaction('withdrawal', amount, user.accountNumber, undefined);
      
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
      const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const recipientExists = users.some((u: User) => u.accountNumber === recipientAccountNumber);
      
      if (!recipientExists) throw new Error("Recipient account not found");
      
      // Update sender balance
      const senderNewBalance = user.balance - amount;
      updateUserBalance(user.accountNumber, senderNewBalance);
      
      // Update recipient balance
      const recipient = users.find((u: User) => u.accountNumber === recipientAccountNumber);
      const recipientNewBalance = recipient.balance + amount;
      updateUserBalance(recipientAccountNumber, recipientNewBalance);
      
      // Save transaction
      const description = note ? note : getTransactionDescription('transfer', user.accountNumber, recipientAccountNumber);
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'transfer',
        amount,
        fromAccount: user.accountNumber,
        toAccount: recipientAccountNumber,
        description,
        timestamp: new Date()
      };
      
      const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
      allTransactions.push(newTransaction);
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(allTransactions));
      
      // Update local state
      setTransactions(prev => [...prev, newTransaction]);
      
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
    <BankContext.Provider value={{ transactions, loading, deposit, withdraw, transfer, getTransactions }}>
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
