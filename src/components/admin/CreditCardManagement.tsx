import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminPasswordDialog from './AdminPasswordDialog';
import CreditCardComponent from '@/components/ui/CreditCardComponent';
import CreditCardEditDialog from './CreditCardEditDialog';
import { CreditCard, Shield, Users, AlertTriangle, Plus } from 'lucide-react';
import { CreditCard as CreditCardType } from '@/lib/types';

const CreditCardManagement = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  const [allCards, setAllCards] = useState<CreditCardType[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [loading, setLoading] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    userId: '',
    cardholderName: '',
    validityYears: '10',
    customCardNumber: '',
    customCVV: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      loadAllCards();
      loadComplaints();
    }
  }, [isAuthenticated]);

  const loadAllCards = async () => {
    try {
      const cards = JSON.parse(localStorage.getItem('suryabank_credit_cards') || '[]');
      setAllCards(cards.map((card: any) => ({
        ...card,
        createdAt: new Date(card.createdAt),
        expiryDate: new Date(card.expiryDate),
        lastUsed: card.lastUsed ? new Date(card.lastUsed) : undefined,
        temporaryBlockUntil: card.temporaryBlockUntil ? new Date(card.temporaryBlockUntil) : undefined
      })));
    } catch (error) {
      console.error('Failed to load cards:', error);
    }
  };

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_card_complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Failed to load complaints:', error);
    }
  };

  const generateCardNumber = () => {
    const prefix = '4532'; // Visa-like prefix for Suryaannarayan Bank
    const timestamp = Date.now().toString();
    const random = Math.random().toString().substring(2, 10);
    return prefix + timestamp.substring(8) + random.substring(0, 8);
  };

  const generateCVV = () => {
    return Math.floor(100 + Math.random() * 900).toString();
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newCard = {
        id: Date.now().toString(),
        userId: newCardForm.userId,
        cardNumber: newCardForm.customCardNumber || generateCardNumber(),
        cardholderName: newCardForm.cardholderName,
        cvv: newCardForm.customCVV || generateCVV(),
        expiryDate: new Date(Date.now() + parseInt(newCardForm.validityYears) * 365 * 24 * 60 * 60 * 1000),
        pin: '123456', // Default PIN, user should change
        isActive: true,
        isBlocked: false,
        failedAttempts: 0,
        permanentlyBlocked: false,
        validityYears: parseInt(newCardForm.validityYears),
        createdAt: new Date()
      };

      const existingCards = JSON.parse(localStorage.getItem('suryabank_credit_cards') || '[]');
      existingCards.push(newCard);
      localStorage.setItem('suryabank_credit_cards', JSON.stringify(existingCards));

      setNewCardForm({ userId: '', cardholderName: '', validityYears: '10', customCardNumber: '', customCVV: '' });
      await loadAllCards();

      toast({
        title: "Card Created",
        description: "New credit card created successfully",
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create credit card",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockCard = async (cardId: string) => {
    try {
      const existingCards = JSON.parse(localStorage.getItem('suryabank_credit_cards') || '[]');
      const updatedCards = existingCards.map((card: any) => 
        card.id === cardId ? { ...card, isBlocked: true } : card
      );
      localStorage.setItem('suryabank_credit_cards', JSON.stringify(updatedCards));
      await loadAllCards();
      
      toast({
        title: "Card Blocked",
        description: "Credit card has been blocked successfully",
      });
    } catch (error) {
      toast({
        title: "Block Failed",
        description: "Failed to block credit card",
        variant: "destructive"
      });
    }
  };

  const handleUnblockCard = async (cardId: string) => {
    try {
      const existingCards = JSON.parse(localStorage.getItem('suryabank_credit_cards') || '[]');
      const updatedCards = existingCards.map((card: any) => 
        card.id === cardId ? { 
          ...card, 
          isBlocked: false, 
          permanentlyBlocked: false,
          failedAttempts: 0,
          temporaryBlockUntil: undefined
        } : card
      );
      localStorage.setItem('suryabank_credit_cards', JSON.stringify(updatedCards));
      await loadAllCards();
      
      toast({
        title: "Card Unblocked",
        description: "Credit card has been unblocked successfully",
      });
    } catch (error) {
      toast({
        title: "Unblock Failed",
        description: "Failed to unblock credit card",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const existingCards = JSON.parse(localStorage.getItem('suryabank_credit_cards') || '[]');
      const filteredCards = existingCards.filter((card: any) => card.id !== cardId);
      localStorage.setItem('suryabank_credit_cards', JSON.stringify(filteredCards));
      await loadAllCards();
      
      toast({
        title: "Card Deleted",
        description: "Credit card has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete credit card",
        variant: "destructive"
      });
    }
  };

  const handleSaveCard = async (cardId: string, updates: Partial<CreditCardType>) => {
    try {
      const existingCards = JSON.parse(localStorage.getItem('suryabank_credit_cards') || '[]');
      const updatedCards = existingCards.map((card: any) => 
        card.id === cardId ? { ...card, ...updates } : card
      );
      localStorage.setItem('suryabank_credit_cards', JSON.stringify(updatedCards));
      await loadAllCards();
    } catch (error) {
      throw error;
    }
  };

  const updateComplaintStatus = async (complaintId: string, status: string, adminNotes?: string) => {
    try {
      const { error } = await supabase
        .from('credit_card_complaints')
        .update({ 
          status, 
          admin_notes: adminNotes,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', complaintId);

      if (error) throw error;
      await loadComplaints();
      
      toast({
        title: "Status Updated",
        description: "Complaint status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update complaint status",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={() => setIsAuthenticated(true)}
        title="Credit Card Management Access"
        description="Enter admin credentials to access credit card management"
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Credit Card Management</h1>
          <p className="text-muted-foreground">Admin panel for credit card operations</p>
        </div>
      </div>

      <Tabs defaultValue="cards" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="cards">All Cards</TabsTrigger>
          <TabsTrigger value="create">Create Card</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                All Credit Cards ({allCards.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allCards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-16 w-16 mx-auto mb-4" />
                  <p>No credit cards found</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {allCards.map((card) => (
                    <div key={card.id} className="space-y-4">
                      <CreditCardComponent 
                        card={card} 
                        showSensitiveInfo={true}
                        isAdmin={true}
                        onEdit={() => setEditingCard(card)}
                        onDelete={() => handleDeleteCard(card.id)}
                        onBlock={() => handleBlockCard(card.id)}
                        onUnblock={() => handleUnblockCard(card.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Credit Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCard} className="space-y-4">
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={newCardForm.userId}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder="Enter user ID"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    value={newCardForm.cardholderName}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                    placeholder="Enter cardholder name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="validityYears">Validity (Years)</Label>
                  <Input
                    id="validityYears"
                    type="number"
                    min="1"
                    max="50"
                    value={newCardForm.validityYears}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, validityYears: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customCardNumber">Custom Card Number (Optional)</Label>
                  <Input
                    id="customCardNumber"
                    value={newCardForm.customCardNumber}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, customCardNumber: e.target.value }))}
                    placeholder="Leave empty for auto-generation"
                    maxLength={16}
                  />
                </div>

                <div>
                  <Label htmlFor="customCVV">Custom CVV (Optional)</Label>
                  <Input
                    id="customCVV"
                    value={newCardForm.customCVV}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, customCVV: e.target.value }))}
                    placeholder="Leave empty for auto-generation"
                    maxLength={3}
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Credit Card'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Credit Card Complaints ({complaints.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {complaints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
                  <p>No complaints found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <Card key={complaint.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold">{complaint.issue_type.replace('_', ' ').toUpperCase()}</h4>
                            <p className="text-sm text-muted-foreground">
                              Card ID: {complaint.card_id} • User: {complaint.user_id}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={complaint.status === 'pending' ? 'destructive' : 
                                          complaint.status === 'resolved' ? 'default' : 'secondary'}>
                              {complaint.status}
                            </Badge>
                            <Badge variant={complaint.priority === 'urgent' ? 'destructive' : 'secondary'}>
                              {complaint.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-4">{complaint.description}</p>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateComplaintStatus(complaint.id, 'in_progress')}
                            disabled={complaint.status === 'in_progress'}
                          >
                            In Progress
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => updateComplaintStatus(complaint.id, 'resolved', 'Issue resolved by admin')}
                            disabled={complaint.status === 'resolved'}
                          >
                            Resolve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Card Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Premium Card Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const applications = JSON.parse(localStorage.getItem('premium_applications') || '[]');
                
                if (applications.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
                      <p>No premium card applications found</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    {applications.map((application: any) => (
                      <Card key={application.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold">Premium Card Application</h4>
                              <p className="text-sm text-muted-foreground">
                                User: {application.username} • Account: {application.accountNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Applied: {new Date(application.appliedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={application.status === 'pending' ? 'destructive' : 'default'}>
                              {application.status}
                            </Badge>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => {
                                const updatedApplications = applications.map((app: any) => 
                                  app.id === application.id 
                                    ? { ...app, status: 'approved' }
                                    : app
                                );
                                localStorage.setItem('premium_applications', JSON.stringify(updatedApplications));
                                toast({
                                  title: "Application Approved",
                                  description: "Premium card application has been approved",
                                });
                                window.location.reload();
                              }}
                              disabled={application.status !== 'pending'}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const updatedApplications = applications.map((app: any) => 
                                  app.id === application.id 
                                    ? { ...app, status: 'rejected' }
                                    : app
                                );
                                localStorage.setItem('premium_applications', JSON.stringify(updatedApplications));
                                toast({
                                  title: "Application Rejected",
                                  description: "Premium card application has been rejected",
                                });
                                window.location.reload();
                              }}
                              disabled={application.status !== 'pending'}
                            >
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreditCardEditDialog
        card={editingCard}
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={handleSaveCard}
      />
    </div>
  );
};

export default CreditCardManagement;