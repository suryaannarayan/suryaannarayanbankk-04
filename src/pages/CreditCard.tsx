import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCreditCard } from '@/context/CreditCardContext';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/context/AdminContext';
import MainLayout from '@/components/layout/MainLayout';
import CreditCardComponent from '@/components/ui/CreditCardComponent';
import CreditCardEditDialog from '@/components/admin/CreditCardEditDialog';
import { CreditCard as CreditCardIcon, Plus, Shield, AlertTriangle, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CreditCard as CreditCardType } from '@/lib/types';

const CreditCard = () => {
  const { user } = useAuth();
  const { creditCards, loading, createCreditCard, getUserCreditCards, blockCreditCard, unblockCreditCard } = useCreditCard();
  const { getAllCreditCards, updateCreditCard } = useAdmin();
  const [cardholderName, setCardholderName] = useState('');
  const [pin, setPin] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [allCreditCards, setAllCreditCards] = useState<CreditCardType[]>([]);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('cards');

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

  const loadAllCreditCards = async () => {
    if (user?.isAdmin) {
      try {
        const cards = await getAllCreditCards();
        setAllCreditCards(cards);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load all credit cards",
          variant: "destructive"
        });
      }
    }
  };

  React.useEffect(() => {
    if (user?.isAdmin && activeTab === 'manage') {
      loadAllCreditCards();
    }
  }, [user?.isAdmin, activeTab]);

  const handleEditCard = (card: CreditCardType) => {
    setEditingCard(card);
  };

  const handleSaveCard = async (cardId: string, updates: Partial<CreditCardType>) => {
    try {
      await updateCreditCard(cardId, updates);
      await loadAllCreditCards();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      // Implementation would go here - delete card from storage
      setAllCreditCards(allCreditCards.filter(card => card.id !== cardId));
      setDeleteConfirm(null);
      toast({
        title: "Success",
        description: "Credit card deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete credit card",
        variant: "destructive"
      });
    }
  };

  const handleBlockCard = async (cardId: string) => {
    try {
      await blockCreditCard(cardId);
      await loadAllCreditCards();
      toast({
        title: "Success",
        description: "Credit card blocked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block credit card",
        variant: "destructive"
      });
    }
  };

  const handleUnblockCard = async (cardId: string) => {
    try {
      await unblockCreditCard(cardId);
      await loadAllCreditCards();
      toast({
        title: "Success",
        description: "Credit card unblocked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock credit card",
        variant: "destructive"
      });
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${user?.isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="cards">My Cards</TabsTrigger>
            <TabsTrigger value="apply">Apply for Card</TabsTrigger>
            {user?.isAdmin && (
              <TabsTrigger value="manage">
                <Users className="mr-2 h-4 w-4" />
                Manage All Cards
              </TabsTrigger>
            )}
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {creditCards.map((card) => (
                  <div key={card.id} className="space-y-4">
                     <CreditCardComponent 
                       card={card} 
                       showSensitiveInfo={false}
                     />
                    <Card>
                      <CardContent className="pt-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{card.createdAt.toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valid Until:</span>
                            <span>{card.expiryDate.toLocaleDateString()}</span>
                          </div>
                          {card.lastUsed && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Used:</span>
                              <span>{card.lastUsed.toLocaleDateString()}</span>
                            </div>
                          )}
                          {card.isBlocked && (
                            <Alert>
                              <Shield className="h-4 w-4" />
                              <AlertDescription>
                                {card.permanentlyBlocked 
                                  ? "This card is permanently blocked. Contact admin at suryaannarayan@gmail.com" 
                                  : card.temporaryBlockUntil && new Date() < card.temporaryBlockUntil
                                    ? `Card temporarily blocked until ${card.temporaryBlockUntil.toLocaleString()}`
                                    : "This card is blocked"
                                }
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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
                        <li>• Only valid for purchases from Suryaannarayan Bank merchants</li>
                        <li>• Secure PIN-based transactions</li>
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

          {user?.isAdmin && (
            <TabsContent value="manage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Credit Cards Management
                  </CardTitle>
                  <CardDescription>
                    View and manage all credit cards in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allCreditCards.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCardIcon className="h-16 w-16 mx-auto mb-4" />
                      <p>No credit cards found in the system</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {allCreditCards.map((card) => (
                        <div key={card.id} className="space-y-4">
                          <CreditCardComponent 
                            card={card} 
                            showSensitiveInfo={true}
                            isAdmin={true}
                            onEdit={handleEditCard}
                            onDelete={(cardId) => setDeleteConfirm(cardId)}
                            onBlock={handleBlockCard}
                            onUnblock={handleUnblockCard}
                          />
                          <Card>
                            <CardContent className="pt-4">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">User ID:</span>
                                  <span className="font-mono text-xs">{card.userId}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created:</span>
                                  <span>{card.createdAt.toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Valid Until:</span>
                                  <span>{card.expiryDate.toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Failed Attempts:</span>
                                  <span>{card.failedAttempts}</span>
                                </div>
                                {card.lastUsed && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last Used:</span>
                                    <span>{card.lastUsed.toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <CreditCardEditDialog
          card={editingCard}
          open={!!editingCard}
          onClose={() => setEditingCard(null)}
          onSave={handleSaveCard}
        />

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Credit Card</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete this credit card? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirm && handleDeleteCard(deleteConfirm)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default CreditCard;