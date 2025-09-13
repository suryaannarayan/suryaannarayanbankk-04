import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBank } from '@/context/BankContext';
import { formatCurrency } from '@/lib/utils';
import TransactionItem from '@/components/ui/TransactionItem';
import OfflineModeStatus from '@/components/ui/OfflineModeStatus';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, ArrowUpRight, ArrowDownLeft, Send, RefreshCw } from 'lucide-react';
import { Transaction } from '@/lib/types';
import MainLayout from '@/components/layout/MainLayout';

const Dashboard = () => {
  const { user, checkAuth } = useAuth();
  const { transactions, deposit, withdraw, transfer, getTransactions } = useBank();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferRecipient, setTransferRecipient] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');
  
  const [transactionType, setTransactionType] = useState<'all' | 'deposit' | 'withdrawal' | 'transfer'>('all');
  
  const [isDepositLoading, setIsDepositLoading] = useState<boolean>(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState<boolean>(false);
  const [isTransferLoading, setIsTransferLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    getTransactions();
  }, [user, navigate]);
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      checkAuth();
      await getTransactions();
      
      toast({
        title: "Refreshed",
        description: "Account balance and transactions updated",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh account information",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || isNaN(parseFloat(depositAmount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(depositAmount);
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Deposit amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }
    
    setIsDepositLoading(true);
    try {
      await deposit(amount);
      setDepositAmount('');
      toast({
        title: "Deposit Successful",
        description: `${formatCurrency(amount)} has been added to your account.`,
      });
    } catch (error: any) {
      toast({
        title: "Deposit Failed",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsDepositLoading(false);
    }
  };
  
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Withdrawal amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }
    
    if (user && amount > user.balance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive"
      });
      return;
    }
    
    setIsWithdrawLoading(true);
    try {
      await withdraw(amount);
      setWithdrawAmount('');
      toast({
        title: "Withdrawal Successful",
        description: `${formatCurrency(amount)} has been withdrawn from your account.`,
      });
    } catch (error: any) {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsWithdrawLoading(false);
    }
  };
  
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || isNaN(parseFloat(transferAmount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid transfer amount",
        variant: "destructive"
      });
      return;
    }
    
    if (!transferRecipient) {
      toast({
        title: "Missing Recipient",
        description: "Please enter a recipient account number",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Transfer amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }
    
    if (user && amount > user.balance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough balance for this transfer",
        variant: "destructive"
      });
      return;
    }
    
    if (user && transferRecipient === user.accountNumber) {
      toast({
        title: "Invalid Recipient",
        description: "You cannot transfer to your own account",
        variant: "destructive"
      });
      return;
    }
    
    setIsTransferLoading(true);
    try {
      await transfer(amount, transferRecipient, transferNote);
      setTransferAmount('');
      setTransferRecipient('');
      setTransferNote('');
      toast({
        title: "Transfer Successful",
        description: `${formatCurrency(amount)} has been transferred successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsTransferLoading(false);
    }
  };
  
  const filteredTransactions = transactions.filter(transaction => {
    if (transactionType === 'all') return true;
    return transaction.type === transactionType;
  });
  
  if (!user) {
    return null; // Or a loading indicator
  }
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Current balance and quick actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm text-gray-500">Available Balance</p>
                  <h2 className="text-3xl font-bold text-bank-blue">{formatCurrency(user.balance)}</h2>
                  <p className="text-xs text-gray-500 mt-1">Account: {user.accountNumber}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="sr-only">Refresh balance</span>
                </Button>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="flex items-center" onClick={() => document.getElementById('deposit-tab')?.click()}>
                  <ArrowDownLeft className="h-4 w-4 mr-1" /> Deposit
                </Button>
                <Button variant="outline" size="sm" className="flex items-center" onClick={() => document.getElementById('withdraw-tab')?.click()}>
                  <ArrowUpRight className="h-4 w-4 mr-1" /> Withdraw
                </Button>
                <Button variant="outline" size="sm" className="flex items-center" onClick={() => document.getElementById('transfer-tab')?.click()}>
                  <Send className="h-4 w-4 mr-1" /> Transfer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {user.isAdmin && <OfflineModeStatus />}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Your recent transactions</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={transactionType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransactionType('all')}
                >
                  All
                </Button>
                <Button
                  variant={transactionType === 'deposit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransactionType('deposit')}
                >
                  In
                </Button>
                <Button
                  variant={transactionType === 'withdrawal' || transactionType === 'transfer' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransactionType('withdrawal')}
                >
                  Out
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No transactions found</p>
                  </div>
                ) : (
                  filteredTransactions.slice().reverse().map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      userAccountNumber={user.accountNumber}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Banking Actions</CardTitle>
              <CardDescription>Manage your finances</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="deposit">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="deposit" id="deposit-tab">Deposit</TabsTrigger>
                  <TabsTrigger value="transfer" id="transfer-tab">Transfer</TabsTrigger>
                </TabsList>
                
                <TabsContent value="deposit">
                  <form onSubmit={handleDeposit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-700 mb-1">
                          Amount
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">₹</span>
                          </div>
                          <Input
                            id="deposit-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            className="pl-7"
                            placeholder="0.00"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isDepositLoading}>
                        {isDepositLoading ? 'Processing...' : 'Deposit Funds'}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="transfer">
                  <form onSubmit={handleTransfer}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                          Recipient Account
                        </label>
                         <Input
                           id="recipient"
                           type="text"
                           placeholder="SN00000000000"
                           value={transferRecipient}
                           onChange={(e) => setTransferRecipient(e.target.value)}
                         />
                      </div>
                      <div>
                        <label htmlFor="transfer-amount" className="block text-sm font-medium text-gray-700 mb-1">
                          Amount
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">₹</span>
                          </div>
                          <Input
                            id="transfer-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            className="pl-7"
                            placeholder="0.00"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                          Note (Optional)
                        </label>
                        <Input
                          id="note"
                          type="text"
                          placeholder="What's this for?"
                          value={transferNote}
                          onChange={(e) => setTransferNote(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isTransferLoading}>
                        {isTransferLoading ? 'Processing...' : 'Send Money'}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
