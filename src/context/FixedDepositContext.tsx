
import React, { createContext, useContext, useState, useEffect } from 'react';
import { FixedDeposit, FDInterestRate, FixedDepositContextType } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useBank } from '@/context/BankContext';
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from '@/utils/bankUtils';

// Create a context for fixed deposit operations
const FixedDepositContext = createContext<FixedDepositContextType | undefined>(undefined);

// Storage keys
const FD_STORAGE_KEY = 'suryabank_fixed_deposits';
const FD_RATES_STORAGE_KEY = 'suryabank_fd_rates';

export const FixedDepositProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { withdraw } = useBank();
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
  const [interestRates, setInterestRates] = useState<FDInterestRate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Initialize default interest rates if none exist
  useEffect(() => {
    const storedRates = localStorage.getItem(FD_RATES_STORAGE_KEY);
    
    if (!storedRates) {
      const defaultRates: FDInterestRate[] = [
        { id: '1', tenureMin: 1, tenureMax: 3, rate: 5.5, specialRate: 6.0, minAmount: 1000 },
        { id: '2', tenureMin: 3, tenureMax: 6, rate: 6.0, specialRate: 6.5, minAmount: 1000 },
        { id: '3', tenureMin: 6, tenureMax: 12, rate: 6.5, specialRate: 7.0, minAmount: 1000 },
        { id: '4', tenureMin: 12, tenureMax: 24, rate: 7.0, specialRate: 7.5, minAmount: 1000 },
        { id: '5', tenureMin: 24, tenureMax: 36, rate: 7.25, specialRate: 7.75, minAmount: 1000 },
        { id: '6', tenureMin: 36, tenureMax: 60, rate: 7.5, specialRate: 8.0, minAmount: 1000 },
        { id: '7', tenureMin: 60, tenureMax: 120, rate: 7.75, specialRate: 8.25, minAmount: 1000 },
      ];
      
      localStorage.setItem(FD_RATES_STORAGE_KEY, JSON.stringify(defaultRates));
      setInterestRates(defaultRates);
    } else {
      setInterestRates(JSON.parse(storedRates));
    }
  }, []);

  // Load user's fixed deposits
  useEffect(() => {
    if (user) {
      getUserFixedDeposits();
    } else {
      setFixedDeposits([]);
    }
  }, [user]);

  // Get fixed deposits for the current user
  const getUserFixedDeposits = async (): Promise<void> => {
    if (!user) return;
    
    setLoading(true);
    try {
      const allFixedDeposits = JSON.parse(localStorage.getItem(FD_STORAGE_KEY) || '[]');
      // Filter FDs for the current user
      const userFixedDeposits = allFixedDeposits.filter((fd: FixedDeposit) => 
        fd.userId === user.id
      );
      
      // Convert date strings to Date objects
      const formattedFDs = userFixedDeposits.map((fd: any) => ({
        ...fd,
        startDate: new Date(fd.startDate),
        maturityDate: new Date(fd.maturityDate),
        createdAt: new Date(fd.createdAt),
        lastUpdated: fd.lastUpdated ? new Date(fd.lastUpdated) : undefined
      }));
      
      setFixedDeposits(formattedFDs);
    } catch (error) {
      console.error('Error fetching fixed deposits:', error);
      toast({
        title: "Error",
        description: "Failed to load fixed deposits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get applicable interest rate based on amount and tenure
  const getApplicableRate = (amount: number, tenure: number): number => {
    const applicableRate = interestRates.find(rate => 
      amount >= rate.minAmount && 
      (!rate.maxAmount || amount <= rate.maxAmount) &&
      tenure >= rate.tenureMin &&
      tenure <= rate.tenureMax
    );
    
    return applicableRate?.rate || 5.5; // Default rate if none matches
  };

  // Calculate maturity amount based on principal, tenure, interest rate and payout option
  const calculateMaturityAmount = (
    amount: number, 
    tenure: number, 
    interestRate: number, 
    payoutOption: 'cumulative' | 'non-cumulative'
  ): number => {
    if (payoutOption === 'cumulative') {
      // Compound interest calculation (annually compounded)
      const years = tenure / 12;
      const maturityAmount = amount * Math.pow(1 + (interestRate / 100), years);
      return maturityAmount;
    } else {
      // Simple interest for non-cumulative option
      const interestAmount = (amount * interestRate * tenure) / (100 * 12);
      return amount + interestAmount;
    }
  };

  // Create a new fixed deposit
  const createFixedDeposit = async (
    amount: number, 
    tenure: number, 
    payoutOption: 'cumulative' | 'non-cumulative',
    payoutFrequency?: 'monthly' | 'quarterly',
    autoRenewal: boolean = false
  ): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Validate inputs
      if (amount <= 0) throw new Error("Amount must be greater than zero");
      if (tenure <= 0) throw new Error("Tenure must be greater than zero");
      if (user.balance < amount) throw new Error("Insufficient balance");
      
      // Get applicable interest rate
      const interestRate = getApplicableRate(amount, tenure);
      
      // Calculate maturity date
      const startDate = new Date();
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + tenure);
      
      // Calculate interest and maturity amount
      const maturityAmount = calculateMaturityAmount(amount, tenure, interestRate, payoutOption);
      const interestEarned = maturityAmount - amount;
      
      // Create FD object
      const newFD: FixedDeposit = {
        id: Date.now().toString(),
        userId: user.id,
        accountNumber: user.accountNumber,
        principalAmount: amount,
        interestRate,
        tenure,
        startDate,
        maturityDate,
        interestEarned,
        maturityAmount,
        status: 'active',
        payoutOption,
        payoutFrequency: payoutOption === 'non-cumulative' ? payoutFrequency : undefined,
        autoRenewal,
        createdAt: new Date()
      };
      
      // Withdraw amount from user's account
      await withdraw(amount);
      
      // Save FD to storage
      const allFixedDeposits = JSON.parse(localStorage.getItem(FD_STORAGE_KEY) || '[]');
      allFixedDeposits.push(newFD);
      localStorage.setItem(FD_STORAGE_KEY, JSON.stringify(allFixedDeposits));
      
      // Update state
      setFixedDeposits(prev => [...prev, newFD]);
      
      toast({
        title: "Fixed Deposit Created",
        description: `Your fixed deposit of ${formatCurrency(amount)} has been created successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create fixed deposit",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Withdraw a fixed deposit
  const withdrawFixedDeposit = async (fdId: string, isPremature: boolean): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Find the FD
      const allFixedDeposits = JSON.parse(localStorage.getItem(FD_STORAGE_KEY) || '[]');
      const fdIndex = allFixedDeposits.findIndex((fd: FixedDeposit) => fd.id === fdId);
      
      if (fdIndex === -1) throw new Error("Fixed deposit not found");
      
      const fd = allFixedDeposits[fdIndex];
      
      // Verify ownership
      if (fd.userId !== user.id) throw new Error("Unauthorized access");
      
      // Calculate withdrawal amount based on premature or normal
      let withdrawalAmount = fd.maturityAmount;
      
      if (isPremature) {
        // Apply penalty for premature withdrawal (e.g., 1% of principal)
        const penaltyRate = 1.0;
        const penalty = (fd.principalAmount * penaltyRate) / 100;
        withdrawalAmount = fd.principalAmount + (fd.interestEarned / 2) - penalty;
      }
      
      // Update user balance
      const users = JSON.parse(localStorage.getItem('suryabank_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      
      if (userIndex === -1) throw new Error("User not found");
      
      users[userIndex].balance += withdrawalAmount;
      localStorage.setItem('suryabank_users', JSON.stringify(users));
      
      // Update session user
      const sessionUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      if (sessionUser.id === user.id) {
        sessionUser.balance += withdrawalAmount;
        sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
      }
      
      // Update FD status
      allFixedDeposits[fdIndex].status = 'withdrawn';
      allFixedDeposits[fdIndex].lastUpdated = new Date();
      localStorage.setItem(FD_STORAGE_KEY, JSON.stringify(allFixedDeposits));
      
      // Record transaction
      const newTransaction = {
        id: Date.now().toString(),
        type: 'deposit',
        amount: withdrawalAmount,
        toAccount: user.accountNumber,
        description: isPremature 
          ? `Premature withdrawal of FD #${fdId.slice(-6)}` 
          : `Maturity withdrawal of FD #${fdId.slice(-6)}`,
        timestamp: new Date()
      };
      
      const transactions = JSON.parse(localStorage.getItem('suryabank_transactions') || '[]');
      transactions.push(newTransaction);
      localStorage.setItem('suryabank_transactions', JSON.stringify(transactions));
      
      // Update state
      setFixedDeposits(prev => prev.map(fd => 
        fd.id === fdId 
          ? { ...fd, status: 'withdrawn', lastUpdated: new Date() } 
          : fd
      ));
      
      toast({
        title: "Fixed Deposit Withdrawn",
        description: `${formatCurrency(withdrawalAmount)} has been credited to your account.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw fixed deposit",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Renew a fixed deposit
  const renewFixedDeposit = async (fdId: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Find the FD
      const allFixedDeposits = JSON.parse(localStorage.getItem(FD_STORAGE_KEY) || '[]');
      const fdIndex = allFixedDeposits.findIndex((fd: FixedDeposit) => fd.id === fdId);
      
      if (fdIndex === -1) throw new Error("Fixed deposit not found");
      
      const fd = allFixedDeposits[fdIndex];
      
      // Verify ownership and status
      if (fd.userId !== user.id) throw new Error("Unauthorized access");
      if (fd.status !== 'matured') throw new Error("Only matured FDs can be renewed");
      
      // Create new FD with same parameters
      const newStartDate = new Date();
      const newMaturityDate = new Date();
      newMaturityDate.setMonth(newMaturityDate.getMonth() + fd.tenure);
      
      const interestRate = getApplicableRate(fd.maturityAmount, fd.tenure);
      const newMaturityAmount = calculateMaturityAmount(
        fd.maturityAmount, 
        fd.tenure, 
        interestRate, 
        fd.payoutOption
      );
      
      const newFD: FixedDeposit = {
        id: Date.now().toString(),
        userId: user.id,
        accountNumber: user.accountNumber,
        principalAmount: fd.maturityAmount,
        interestRate,
        tenure: fd.tenure,
        startDate: newStartDate,
        maturityDate: newMaturityDate,
        interestEarned: newMaturityAmount - fd.maturityAmount,
        maturityAmount: newMaturityAmount,
        status: 'active',
        payoutOption: fd.payoutOption,
        payoutFrequency: fd.payoutFrequency,
        autoRenewal: fd.autoRenewal,
        createdAt: new Date()
      };
      
      // Mark old FD as withdrawn
      allFixedDeposits[fdIndex].status = 'withdrawn';
      allFixedDeposits[fdIndex].lastUpdated = new Date();
      
      // Add new FD
      allFixedDeposits.push(newFD);
      localStorage.setItem(FD_STORAGE_KEY, JSON.stringify(allFixedDeposits));
      
      // Update state with proper typing
      setFixedDeposits(prev => [
        ...prev.map(fd => 
          fd.id === fdId 
            ? { ...fd, status: 'withdrawn' as const, lastUpdated: new Date() } 
            : fd
        ),
        newFD
      ]);
      
      toast({
        title: "Fixed Deposit Renewed",
        description: `Your FD has been renewed with a principal amount of ${formatCurrency(fd.maturityAmount)}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to renew fixed deposit",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Toggle auto-renewal option
  const toggleAutoRenewal = async (fdId: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Find the FD
      const allFixedDeposits = JSON.parse(localStorage.getItem(FD_STORAGE_KEY) || '[]');
      const fdIndex = allFixedDeposits.findIndex((fd: FixedDeposit) => fd.id === fdId);
      
      if (fdIndex === -1) throw new Error("Fixed deposit not found");
      
      // Verify ownership
      if (allFixedDeposits[fdIndex].userId !== user.id) throw new Error("Unauthorized access");
      
      // Toggle auto-renewal
      allFixedDeposits[fdIndex].autoRenewal = !allFixedDeposits[fdIndex].autoRenewal;
      allFixedDeposits[fdIndex].lastUpdated = new Date();
      
      localStorage.setItem(FD_STORAGE_KEY, JSON.stringify(allFixedDeposits));
      
      // Update state
      setFixedDeposits(prev => prev.map(fd => 
        fd.id === fdId 
          ? { ...fd, autoRenewal: !fd.autoRenewal, lastUpdated: new Date() } 
          : fd
      ));
      
      toast({
        title: "Auto-Renewal Updated",
        description: `Auto-renewal has been ${allFixedDeposits[fdIndex].autoRenewal ? 'enabled' : 'disabled'} for this fixed deposit.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update auto-renewal",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FixedDepositContext.Provider value={{
      fixedDeposits,
      interestRates,
      loading,
      createFixedDeposit,
      withdrawFixedDeposit,
      renewFixedDeposit,
      toggleAutoRenewal,
      calculateMaturityAmount,
      getApplicableRate,
      getUserFixedDeposits
    }}>
      {children}
    </FixedDepositContext.Provider>
  );
};

export const useFixedDeposit = () => {
  const context = useContext(FixedDepositContext);
  if (context === undefined) {
    throw new Error('useFixedDeposit must be used within a FixedDepositProvider');
  }
  return context;
};
