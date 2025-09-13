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
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CreditCardNew = () => {
  const { user } = useAuth();
  const { creditCards, loading, createCreditCard, getUserCreditCards, blockCreditCard, unblockCreditCard } = useCreditCard();
  const [cardholderName, setCardholderName] = useState('');
  const [pin, setPin] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [userComplaints, setUserComplaints] = useState<any[]>([]);
  const [availableBalance] = useState(5000); // Mock available balance

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

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardholderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter cardholder name",
        variant: "destructive"
      });
      return;
    }
    
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      toast({
        title: "Error", 
        description: "PIN must be exactly 6 digits",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    try {
      await createCreditCard(cardholderName, pin);
      setCardholderName('');
      setPin('');
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please log in to access credit card services.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCardIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Credit Card Services</h1>
            <p className="text-muted-foreground">Manage your Suryaannarayan Bank credit cards</p>
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> Never share your CVV, PIN, expiry date, or full card details with anyone. 
            Suryaannarayan Bank will never ask for these details via email, phone, or text message.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="cards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cards">My Cards</TabsTrigger>
            <TabsTrigger value="apply">Apply for Card</TabsTrigger>
            <TabsTrigger value="support">Support & Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6">
            {creditCards.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <CreditCardIcon className="h-16 w-16 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">No Credit Cards</h3>
                      <p className="text-muted-foreground">You don't have any credit cards yet.</p>
                    </div>
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
                {creditCards.map((card) => (
                  <div key={card.id} className="space-y-4">
                    <CreditCardComponent 
                      card={card} 
                      showSensitiveInfo={false}
                    />
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Available Balance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            ₹{availableBalance.toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            This is your available credit limit for transactions
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Created:</span>
                              <span>{card.createdAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Valid Until:</span>
                              <span>{card.expiryDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <span className={card.isBlocked ? 'text-red-600' : 'text-green-600'}>
                                {card.isBlocked ? 'Blocked' : 'Active'}
                              </span>
                            </div>
                            {card.lastUsed && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Used:</span>
                                <span>{card.lastUsed.toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {card.isBlocked && (
                            <Alert className="mt-4">
                              <Shield className="h-4 w-4" />
                              <AlertDescription>
                                {card.permanentlyBlocked 
                                  ? "Card is permanently blocked. Contact admin at suryaannarayan@gmail.com" 
                                  : card.temporaryBlockUntil && new Date() < card.temporaryBlockUntil
                                    ? `Card temporarily blocked until ${card.temporaryBlockUntil.toLocaleString()}`
                                    : "Card is blocked. Use Support tab to request unblock"
                                }
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="apply" className="space-y-6">
            {creditCards.length > 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You already have a credit card. Only one card per user is allowed.
                </AlertDescription>
              </Alert>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Apply for Credit Card</CardTitle>
                  <CardDescription>
                    Create your Suryaannarayan Bank credit card with 10 years validity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCard} className="space-y-4">
                    <div>
                      <Label htmlFor="cardholderName">Cardholder Name</Label>
                      <Input
                        id="cardholderName"
                        type="text"
                        placeholder="Enter your full name as you want it on the card"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pin">Set 6-Digit PIN</Label>
                      <Input
                        id="pin"
                        type="password"
                        placeholder="Enter 6-digit PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        This PIN will be required for all transactions
                      </p>
                    </div>
                    
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Security Notice:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>After 3 failed PIN attempts, your card will be blocked for 12 hours</li>
                          <li>If you fail again after the 12-hour period, your card will be permanently blocked</li>
                          <li>Permanently blocked cards can only be unblocked by admin</li>
                          <li>Contact admin at: <strong>suryaannarayan@gmail.com</strong></li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Card Features:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Valid for 10 years by default</li>
                        <li>• Random card number and CVV generated automatically</li>
                        <li>• Secure PIN-based transactions</li>
                        <li>• ₹50,000 initial credit limit</li>
                        <li>• Admin can renew and extend validity</li>
                      </ul>
                    </div>
                    
                    <Button type="submit" disabled={isCreating || loading} className="w-full">
                      {isCreating ? "Creating Card..." : "Apply for Credit Card"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                {creditCards.length > 0 ? (
                  <CreditCardComplaintForm
                    userCards={creditCards}
                    userId={user.id}
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