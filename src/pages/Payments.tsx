
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBank } from '@/context/BankContext';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Send } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

const Payments = () => {
  const { user } = useAuth();
  const { transfer } = useBank();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferRecipient, setTransferRecipient] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');
  const [isTransferLoading, setIsTransferLoading] = useState<boolean>(false);
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
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
  
  if (!user) return null;
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-bank-blue mb-6">Payments & Transfers</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Make a Transfer</CardTitle>
              <CardDescription>Send money to another account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Account Number
                  </label>
                  <Input
                    id="recipient"
                    type="text"
                    placeholder="SRY0000000000"
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
                
                <Button 
                  type="submit" 
                  className="w-full mt-4 bg-bank-blue hover:bg-bank-accent" 
                  disabled={isTransferLoading}
                >
                  {isTransferLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" /> Send Money
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

export default Payments;
