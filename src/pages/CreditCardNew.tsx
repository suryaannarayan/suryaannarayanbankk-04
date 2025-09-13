import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreditCard } from '@/context/CreditCardContext';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import CreditCardComponent from '@/components/ui/CreditCardComponent';
import CreditCardComplaintForm from '@/components/admin/CreditCardComplaintForm';
import { CreditCard as CreditCardIcon, Plus, Shield, AlertTriangle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CreditCardNew = () => {
  const { user } = useAuth();
  const { creditCards, loading, createCreditCard, getUserCreditCards, blockCreditCard, unblockCreditCard } = useCreditCard();
  const [cardholderName, setCardholderName] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userComplaints, setUserComplaints] = useState<any[]>([]);
  const [availableBalance] = useState(5000); // Mock available balance
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      getUserCreditCards();
      loadUserComplaints();
    }
  }, [user]);

  const loadUserComplaints = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('credit_card_complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserComplaints(data || []);
    } catch (error) {
      console.error('Failed to load complaints:', error);
    }
  };

  const handleApplyForCard = async () => {
    if (!cardholderName.trim() || !pin.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (pin.length !== 6) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 6 digits",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await createCreditCard(cardholderName, pin);
      setCardholderName('');
      setPin('');
      toast({
        title: "Application Successful",
        description: "Your credit card has been created successfully!",
      });
    } catch (error) {
      console.error('Failed to create credit card:', error);
      toast({
        title: "Application Failed",
        description: "Failed to create credit card. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <CreditCardIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Credit Cards</h1>
            <p className="text-muted-foreground">Manage your credit cards and get support</p>
          </div>
        </div>

        <Tabs defaultValue="cards" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="cards">My Cards</TabsTrigger>
            <TabsTrigger value="apply">Apply for Card</TabsTrigger>
            <TabsTrigger value="support">Support & Complaints</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6">
            {creditCards.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CreditCardIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">No Credit Cards Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any credit cards. Apply for one to get started.
                    </p>
                    <Button onClick={() => {
                      const applyTab = document.querySelector('[value="apply"]') as HTMLElement;
                      applyTab?.click();
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Apply for Credit Card
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Security Warning */}
                <Alert className="border-red-200 bg-red-50">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>⚠️ Security Notice:</strong> Never share your credit card number, CVV, expiry date, or PIN with anyone. Keep your card details confidential and secure.
                  </AlertDescription>
                </Alert>

                {creditCards.map((card) => (
                  <div key={card.id} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <CreditCardComponent 
                        card={card} 
                        showSensitiveInfo={true}
                        onBlock={() => blockCreditCard(card.id)}
                        onUnblock={() => unblockCreditCard(card.id)}
                      />
                      
                      <div className="space-y-4">
                        {/* Card Balance */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5" />
                              Card Balance
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">₹{availableBalance.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Available Balance</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Deposit to Card",
                                      description: "Transfer money from your bank account to credit card",
                                    });
                                  }}
                                >
                                  Deposit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Withdraw from Card", 
                                      description: "Transfer money from credit card to your bank account",
                                    });
                                  }}
                                >
                                  Withdraw
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Card Status */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Shield className="h-5 w-5" />
                              Card Status
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Status:</span>
                                <span className={`text-sm ${card.isBlocked ? 'text-red-600' : 'text-green-600'}`}>
                                  {card.isBlocked ? 'Blocked' : 'Active'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Expiry:</span>
                                <span className="text-sm">{card.expiryDate.toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Failed Attempts:</span>
                                <span className="text-sm">{card.failedAttempts}/3</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                              <Button
                                variant={card.isBlocked ? "default" : "destructive"}
                                size="sm"
                                onClick={() => card.isBlocked ? unblockCreditCard(card.id) : blockCreditCard(card.id)}
                                className="flex-1"
                              >
                                {card.isBlocked ? 'Unblock Card' : 'Block Card'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="apply" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Apply for Credit Card</CardTitle>
                <CardDescription>Fill in your details to apply for a new credit card</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="Enter your full name as it appears on your ID"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pin">Choose Your PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter a 6-digit PIN"
                      maxLength={6}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your PIN must be exactly 6 digits
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleApplyForCard}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Processing Application...' : 'Apply for Credit Card'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">⚠️ Important Security Notice</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Never share your credit card details (number, CVV, expiry) with anyone</li>
                <li>• Keep your PIN confidential and secure</li>
                <li>• Report any suspicious activity immediately</li>
                <li>• Use secure networks for online transactions</li>
                <li>• Don't save card details on public devices</li>
              </ul>
            </div>

            {/* Card Balance and Deposit/Withdraw Options */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">💳 Card Balance Management</h3>
              <p className="text-sm text-blue-700 mb-3">Manage your credit card balance:</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Deposit to Card",
                      description: "Deposit feature will transfer money from your bank account to credit card",
                    });
                  }}
                >
                  Deposit to Card
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Withdraw from Card",
                      description: "Withdraw feature will transfer money from credit card to your bank account",
                    });
                  }}
                >
                  Withdraw from Card
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                {creditCards.length > 0 ? (
                  <CreditCardComplaintForm
                    userCards={creditCards}
                    userId={user?.id || ''}
                    onComplaintSubmitted={loadUserComplaints}
                  />
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <CreditCardIcon className="h-16 w-16 mx-auto mb-4" />
                        <p>Apply for a credit card first to access support features</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Your Complaints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userComplaints.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No complaints found</p>
                    ) : (
                      <div className="space-y-4">
                        {userComplaints.map((complaint) => (
                          <Card key={complaint.id}>
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{complaint.issue_type.replace('_', ' ')}</h4>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {complaint.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{complaint.description}</p>
                              <p className="text-xs text-muted-foreground">
                                Submitted: {new Date(complaint.created_at).toLocaleDateString()}
                              </p>
                              {complaint.admin_notes && (
                                <Alert className="mt-2">
                                  <AlertDescription>
                                    <strong>Admin Response:</strong> {complaint.admin_notes}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CreditCardNew;