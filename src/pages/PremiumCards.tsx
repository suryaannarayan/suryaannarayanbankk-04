import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useBank } from '@/context/BankContext';
import { Sparkles, Star, Crown, Gift, Copy, Calendar, CreditCard, DollarSign } from 'lucide-react';

const PremiumCards = () => {
  const { user } = useAuth();
  const { withdraw } = useBank();
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState<string>('');
  const [couponExpiry, setCouponExpiry] = useState<Date | null>(null);
  const [customCouponAmount, setCustomCouponAmount] = useState<number>(0);
  const [customCardNumber, setCustomCardNumber] = useState<string>('');
  const [customCVV, setCustomCVV] = useState<string>('');
  const [wantCustomCard, setWantCustomCard] = useState(false);

  const generateCoupon = async () => {
    // Check if this is the first coupon for this user
    const existingCoupons = JSON.parse(localStorage.getItem('user_coupons') || '[]');
    const userCoupons = existingCoupons.filter((coupon: any) => coupon.userId === user?.id);
    const isFirstCoupon = userCoupons.length === 0;
    
    // If not first coupon, charge 10 rupees
    if (!isFirstCoupon) {
      if (!user || user.balance < 10) {
        toast({
          title: "Insufficient Balance",
          description: "You need ₹10 to generate additional coupons",
          variant: "destructive"
        });
        return;
      }
      
      try {
        await withdraw(10);
      } catch (error) {
        toast({
          title: "Payment Failed",
          description: "Failed to deduct coupon generation fee",
          variant: "destructive"
        });
        return;
      }
    }
    
    const couponCode = `PREMIUM${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 months validity
    
    setGeneratedCoupon(couponCode);
    setCouponExpiry(expiryDate);
    
    existingCoupons.push({
      code: couponCode,
      discount: 20,
      expiryDate: expiryDate.toISOString(),
      userId: user?.id,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('user_coupons', JSON.stringify(existingCoupons));
    
    toast({
      title: "Coupon Generated!",
      description: `Your 20% discount coupon ${couponCode} is ready to use!${!isFirstCoupon ? ' (₹10 charged)' : ' (First coupon free!)'}`,
    });
  };

  const generateCustomCoupon = async () => {
    if (customCouponAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount for the coupon",
        variant: "destructive"
      });
      return;
    }

    if (!user || user.balance < customCouponAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to create this coupon",
        variant: "destructive"
      });
      return;
    }

    try {
      await withdraw(customCouponAmount);
      
      const couponCode = `CUSTOM${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      
      const existingCoupons = JSON.parse(localStorage.getItem('user_coupons') || '[]');
      existingCoupons.push({
        code: couponCode,
        value: customCouponAmount,
        expiryDate: expiryDate.toISOString(),
        userId: user?.id,
        createdAt: new Date().toISOString(),
        type: 'custom'
      });
      localStorage.setItem('user_coupons', JSON.stringify(existingCoupons));
      
      toast({
        title: "Custom Coupon Created!",
        description: `₹${customCouponAmount} coupon ${couponCode} created successfully!`,
      });
      
      setCustomCouponAmount(0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create custom coupon",
        variant: "destructive"
      });
    }
  };

  const copyCoupon = () => {
    navigator.clipboard.writeText(generatedCoupon);
    toast({
      title: "Copied!",
      description: "Coupon code copied to clipboard",
    });
  };

  const handlePremiumApplication = async () => {
    setIsApplying(true);
    
    try {
      let totalFee = 0;
      
      // Check if user wants custom card (50 rupees fee)
      if (wantCustomCard) {
        totalFee = 50;
        
        if (!user || user.balance < totalFee) {
          toast({
            title: "Insufficient Balance",
            description: `You need ₹${totalFee} to apply for premium card with custom details`,
            variant: "destructive"
          });
          setIsApplying(false);
          return;
        }
        
        // Validate custom card details
        if (customCardNumber && customCardNumber.length !== 16) {
          toast({
            title: "Invalid Card Number",
            description: "Card number must be 16 digits",
            variant: "destructive"
          });
          setIsApplying(false);
          return;
        }
        
        if (customCVV && customCVV.length !== 3) {
          toast({
            title: "Invalid CVV",
            description: "CVV must be 3 digits",
            variant: "destructive"
          });
          setIsApplying(false);
          return;
        }
        
        // Deduct fee
        await withdraw(totalFee);
      }
      
      // Save application to localStorage
      const applications = JSON.parse(localStorage.getItem('premium_applications') || '[]');
      applications.push({
        id: Date.now().toString(),
        userId: user?.id,
        username: user?.username,
        accountNumber: user?.accountNumber,
        appliedAt: new Date().toISOString(),
        status: 'pending',
        customCard: wantCustomCard,
        customCardNumber: wantCustomCard ? customCardNumber : null,
        customCVV: wantCustomCard ? customCVV : null,
        feesPaid: totalFee
      });
      localStorage.setItem('premium_applications', JSON.stringify(applications));
      
      toast({
        title: "Application Submitted!",
        description: `Premium credit card application submitted${totalFee > 0 ? ` (₹${totalFee} fee deducted)` : ''}`,
      });
      
      // Reset form
      setWantCustomCard(false);
      setCustomCardNumber('');
      setCustomCVV('');
    } catch (error) {
      toast({
        title: "Application Failed",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-yellow-600" />
        <div>
          <h1 className="text-3xl font-bold">Premium Credit Cards</h1>
          <p className="text-muted-foreground">Exclusive offers and premium benefits</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Premium Card Application */}
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              Premium Credit Card
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Exclusive Benefits:</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>20% discount on ecommerce purchases</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Higher credit limits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Priority customer support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Custom card number & CVV</span>
                </li>
              </ul>
            </div>
            
            {/* Custom Card Option */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="customCard"
                  checked={wantCustomCard}
                  onChange={(e) => setWantCustomCard(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="customCard" className="text-sm font-medium">
                  Custom Card Details (+₹50 fee)
                </label>
              </div>
              
              {wantCustomCard && (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="customCardNumber" className="text-xs">Custom Card Number (16 digits)</Label>
                    <Input
                      id="customCardNumber"
                      value={customCardNumber}
                      onChange={(e) => setCustomCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="1234567890123456"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customCVV" className="text-xs">Custom CVV (3 digits)</Label>
                    <Input
                      id="customCVV"
                      value={customCVV}
                      onChange={(e) => setCustomCVV(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="123"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={handlePremiumApplication}
                disabled={isApplying}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
              >
                {isApplying ? 'Submitting...' : `Apply ${wantCustomCard ? '(₹50 fee)' : ''}`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Coupon Generator */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600" />
              Generate Discount Coupon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Generate a 20% discount coupon for your ecommerce purchases
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Valid for 3 months</span>
              </div>
              <div className="bg-yellow-100 p-2 rounded text-xs text-yellow-800">
                First coupon free, then ₹10 per coupon
              </div>
            </div>
            
            {generatedCoupon && (
              <div className="p-4 bg-white rounded-lg border-2 border-dashed border-green-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Coupon Code:</p>
                    <p className="text-lg font-mono font-bold text-green-600">{generatedCoupon}</p>
                    {couponExpiry && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {couponExpiry.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCoupon}
                    className="border-green-300 hover:bg-green-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <Button 
              onClick={generateCoupon}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Generate 20% Coupon
            </Button>
          </CardContent>
        </Card>

        {/* Custom Amount Coupon */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Custom Amount Coupon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Create a coupon with custom amount (deducted from your account)
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Valid for 3 months</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="couponAmount">Coupon Amount (₹)</Label>
              <Input
                id="couponAmount"
                type="number"
                value={customCouponAmount || ''}
                onChange={(e) => setCustomCouponAmount(Number(e.target.value))}
                placeholder="Enter amount"
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Current Balance: ₹{user?.balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            
            <Button 
              onClick={generateCustomCoupon}
              disabled={customCouponAmount <= 0 || !user || user.balance < customCouponAmount}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Create Custom Coupon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Existing Coupons */}
      <Card>
        <CardHeader>
          <CardTitle>Your Active Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const userCoupons = JSON.parse(localStorage.getItem('user_coupons') || '[]')
              .filter((coupon: any) => 
                coupon.userId === user?.id && 
                new Date(coupon.expiryDate) > new Date()
              );
            
            if (userCoupons.length === 0) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No active coupons. Generate one above!</p>
                </div>
              );
            }
            
            return (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userCoupons.map((coupon: any, index: number) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">
                        {coupon.type === 'custom' ? `₹${coupon.value}` : `${coupon.discount}% OFF`}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          toast({ title: "Copied!", description: "Coupon code copied" });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-mono text-sm font-bold">{coupon.code}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumCards;
