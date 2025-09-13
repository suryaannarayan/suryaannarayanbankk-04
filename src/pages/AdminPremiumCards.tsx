import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, Check, X, Calendar, CreditCard } from 'lucide-react';

const AdminPremiumCards = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    const storedApplications = JSON.parse(localStorage.getItem('premium_applications') || '[]');
    setApplications(storedApplications);
  };

  const handleApprove = (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId);
    if (!application) return;
    
    let newPremiumCard: any = null;
    
    // Transfer money from old card to new premium card and delete old card
    const existingCards = JSON.parse(localStorage.getItem('credit_cards') || '[]');
    const userOldCard = existingCards.find((card: any) => card.userId === application.userId);
    
    if (userOldCard) {
      // Get old card balance
      const cardBalances = JSON.parse(localStorage.getItem('credit_card_balances') || '{}');
      const oldCardBalance = cardBalances[userOldCard.id] || 0;
      
      // Create new premium card
      newPremiumCard = {
        id: Date.now().toString(),
        userId: application.userId,
        cardNumber: application.customCardNumber || `4${Math.random().toString().slice(2, 17)}`,
        cardholderName: userOldCard.cardholderName,
        cvv: application.customCVV || Math.floor(Math.random() * 900 + 100).toString(),
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
        pin: userOldCard.pin,
        isActive: true,
        isBlocked: false,
        failedAttempts: 0,
        permanentlyBlocked: false,
        validityYears: 5,
        createdAt: new Date(),
        isPremium: true
      };
      
      // Remove old card and add new premium card
      const updatedCards = existingCards.filter((card: any) => card.id !== userOldCard.id);
      updatedCards.push(newPremiumCard);
      localStorage.setItem('credit_cards', JSON.stringify(updatedCards));
      
      // Transfer balance to new card
      if (oldCardBalance > 0) {
        delete cardBalances[userOldCard.id];
        cardBalances[newPremiumCard.id] = oldCardBalance;
        localStorage.setItem('credit_card_balances', JSON.stringify(cardBalances));
      }
    }
    
    const updatedApplications = applications.map(app => 
      app.id === applicationId ? { ...app, status: 'approved', reviewedAt: new Date().toISOString() } : app
    );
    setApplications(updatedApplications);
    localStorage.setItem('premium_applications', JSON.stringify(updatedApplications));
    
    // Trigger a window event for the user to refresh their cards
    if (newPremiumCard) {
      window.dispatchEvent(new CustomEvent('premiumCardApproved', { 
        detail: { userId: application.userId, cardId: newPremiumCard.id } 
      }));
    }
    
    toast({
      title: "Application Approved",
      description: "Premium credit card approved and old card replaced",
    });
  };

  const handleReject = (applicationId: string) => {
    const updatedApplications = applications.map(app => 
      app.id === applicationId ? { ...app, status: 'rejected', reviewedAt: new Date().toISOString() } : app
    );
    setApplications(updatedApplications);
    localStorage.setItem('premium_applications', JSON.stringify(updatedApplications));
    
    toast({
      title: "Application Rejected",
      description: "Premium credit card application has been rejected",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-yellow-600" />
        <div>
          <h1 className="text-3xl font-bold">Premium Card Applications</h1>
          <p className="text-muted-foreground">Manage premium credit card applications</p>
        </div>
      </div>

      <div className="grid gap-4">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Crown className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-muted-foreground">No premium card applications found</p>
            </CardContent>
          </Card>
        ) : (
          applications.map((application) => (
            <Card key={application.id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Premium Card Application
                  </CardTitle>
                  {getStatusBadge(application.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p><strong>Username:</strong> {application.username}</p>
                    <p><strong>Account Number:</strong> {application.accountNumber}</p>
                    <p><strong>Applied Date:</strong> {new Date(application.appliedAt).toLocaleDateString()}</p>
                    {application.feesPaid && (
                      <p><strong>Fees Paid:</strong> ₹{application.feesPaid}</p>
                    )}
                  </div>
                  
                  {application.customCard && (
                    <div className="space-y-2 p-3 bg-yellow-50 rounded-lg">
                      <p className="font-semibold text-yellow-800">Custom Card Details:</p>
                      {application.customCardNumber && (
                        <p><strong>Card Number:</strong> {application.customCardNumber}</p>
                      )}
                      {application.customCVV && (
                        <p><strong>CVV:</strong> {application.customCVV}</p>
                      )}
                    </div>
                  )}
                </div>

                {application.reviewedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Reviewed on: {new Date(application.reviewedAt).toLocaleDateString()}</span>
                  </div>
                )}

                {application.status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleApprove(application.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(application.id)}
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPremiumCards;