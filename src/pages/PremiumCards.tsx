import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Star, Crown, Gift, Copy, Calendar } from 'lucide-react';

const PremiumCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState<string>('');
  const [couponExpiry, setCouponExpiry] = useState<Date | null>(null);

  const generateCoupon = () => {
    const couponCode = `PREMIUM${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 months validity
    
    setGeneratedCoupon(couponCode);
    setCouponExpiry(expiryDate);
    
    // Save to localStorage
    const existingCoupons = JSON.parse(localStorage.getItem('user_coupons') || '[]');
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
      description: `Your 20% discount coupon ${couponCode} is ready to use!`,
    });
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
      // Save application to localStorage
      const applications = JSON.parse(localStorage.getItem('premium_applications') || '[]');
      applications.push({
        id: Date.now().toString(),
        userId: user?.id,
        username: user?.username,
        accountNumber: user?.accountNumber,
        appliedAt: new Date().toISOString(),
        status: 'pending'
      });
      localStorage.setItem('premium_applications', JSON.stringify(applications));
      
      toast({
        title: "Application Submitted!",
        description: "Your premium credit card application has been submitted for review.",
      });
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

      <div className="grid gap-6 md:grid-cols-2">
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
                  <span>Exclusive offers and deals</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={handlePremiumApplication}
                disabled={isApplying}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
              >
                {isApplying ? 'Submitting...' : 'Apply for Premium Card'}
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
              Generate New Coupon
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
                      <Badge variant="secondary">{coupon.discount}% OFF</Badge>
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
