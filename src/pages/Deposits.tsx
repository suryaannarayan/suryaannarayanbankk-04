
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBank } from '@/context/BankContext';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, ArrowRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

const Deposits = () => {
  const { user } = useAuth();
  const { deposit } = useBank();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [isDepositLoading, setIsDepositLoading] = useState<boolean>(false);
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
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
  
  if (!user) return null;
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-bank-blue mb-6">Deposits</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Make a Deposit</CardTitle>
              <CardDescription>Add funds to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount to Deposit
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
                
                <div className="pt-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Deposit funds into your account instantly. Once processed, the funds will be immediately available in your account.
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-4 bg-bank-blue hover:bg-bank-accent" 
                  disabled={isDepositLoading}
                >
                  {isDepositLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      <ArrowDownLeft className="h-4 w-4 mr-2" /> Deposit Funds
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Available Balance</CardTitle>
              <CardDescription>Your current account balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-2">Current Balance</p>
                <h2 className="text-4xl font-bold text-bank-blue mb-4">{formatCurrency(user.balance)}</h2>
                <p className="text-xs text-gray-500">Account: {user.accountNumber}</p>
                
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowRight className="h-4 w-4 mr-2" /> Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Deposits;
