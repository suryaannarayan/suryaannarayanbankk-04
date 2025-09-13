import React, { useState } from 'react';
import { CreditCard } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useBank } from '@/context/BankContext';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils/bankUtils';
import { Edit, Trash2, Shield, ShieldOff, Plus, Minus, Eye, EyeOff, ArrowUpDown, Crown } from 'lucide-react';

interface CreditCardProps {
  card: CreditCard;
  showSensitiveInfo?: boolean;
  isAdmin?: boolean;
  onEdit?: (card: CreditCard) => void;
  onDelete?: (cardId: string) => void;
  onBlock?: (cardId: string) => void;
  onUnblock?: (cardId: string) => void;
  showBalance?: boolean;
}

const CreditCardComponent: React.FC<CreditCardProps> = ({ 
  card, 
  showSensitiveInfo = false, 
  isAdmin = false,
  onEdit,
  onDelete,
  onBlock,
  onUnblock,
  showBalance = true
}) => {
  const [showDetails, setShowDetails] = useState(showSensitiveInfo);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { toast } = useToast();
  const { deposit, withdraw } = useBank();
  const { user } = useAuth();

  const formatCardNumber = (cardNumber: string): string => {
    return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const getCardStatus = () => {
    if (card.permanentlyBlocked) return { text: 'Permanently Blocked', variant: 'destructive' as const };
    if (card.isBlocked) return { text: 'Blocked', variant: 'destructive' as const };
    if (new Date() > card.expiryDate) return { text: 'Expired', variant: 'secondary' as const };
    return { text: 'Active', variant: 'default' as const };
  };

  const getCardBalance = () => {
    const cardBalances = JSON.parse(localStorage.getItem('credit_card_balances') || '{}');
    return cardBalances[card.id] || 0;
  };

  const updateCardBalance = (newBalance: number) => {
    const cardBalances = JSON.parse(localStorage.getItem('credit_card_balances') || '{}');
    cardBalances[card.id] = newBalance;
    localStorage.setItem('credit_card_balances', JSON.stringify(cardBalances));
  };

  const handleDepositToCard = async () => {
    if (transferAmount <= 0 || !user || user.balance < transferAmount) {
      toast({ title: "Invalid Amount", variant: "destructive" });
      return;
    }
    setIsDepositing(true);
    try {
      await withdraw(transferAmount);
      updateCardBalance(getCardBalance() + transferAmount);
      toast({ title: "Transfer Successful", description: `₹${transferAmount} transferred to card` });
      setTransferAmount(0);
    } catch (error) {
      toast({ title: "Transfer Failed", variant: "destructive" });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdrawFromCard = async () => {
    if (transferAmount <= 0 || getCardBalance() < transferAmount) {
      toast({ title: "Insufficient Balance", variant: "destructive" });
      return;
    }
    setIsWithdrawing(true);
    try {
      await deposit(transferAmount);
      updateCardBalance(getCardBalance() - transferAmount);
      toast({ title: "Withdrawal Successful", description: `₹${transferAmount} transferred to bank` });
      setTransferAmount(0);
    } catch (error) {
      toast({ title: "Withdrawal Failed", variant: "destructive" });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const status = getCardStatus();

  return (
    <div className="space-y-4">
      {/* Card Balance for non-admin users */}
      {showBalance && !isAdmin && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Card Balance</p>
              <p className="text-2xl font-bold text-green-700">₹{getCardBalance().toFixed(2)}</p>
            </div>
            <ArrowUpDown className="h-6 w-6 text-green-600" />
          </div>
        </div>
      )}

      {/* Transfer Section for non-admin users */}
      {showBalance && !isAdmin && card.isActive && !card.isBlocked && !card.permanentlyBlocked && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
          <h4 className="font-semibold text-blue-800">Transfer Money</h4>
          <div className="space-y-2">
            <Label htmlFor="transferAmount">Amount (₹)</Label>
            <Input
              id="transferAmount"
              type="number"
              value={transferAmount || ''}
              onChange={(e) => setTransferAmount(Number(e.target.value))}
              placeholder="Enter amount"
              min="1"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDepositToCard} disabled={isDepositing || transferAmount <= 0} className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {isDepositing ? 'Processing...' : 'To Card'}
            </Button>
            <Button onClick={handleWithdrawFromCard} disabled={isWithdrawing || transferAmount <= 0} className="flex-1 bg-orange-600 hover:bg-orange-700" size="sm">
              <Minus className="h-4 w-4 mr-2" />
              {isWithdrawing ? 'Processing...' : 'To Bank'}
            </Button>
          </div>
          <p className="text-xs text-blue-600">Bank Balance: ₹{user?.balance?.toFixed(2) || '0.00'}</p>
        </div>
      )}

      <Card className={`w-full max-w-sm h-56 text-white relative overflow-hidden ${
        card.isPremium 
          ? 'bg-gradient-to-br from-yellow-500 via-amber-500 to-yellow-600 shadow-lg shadow-yellow-500/20 border border-yellow-400/30' 
          : 'bg-gradient-to-br from-blue-600 to-purple-700'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        
        {/* Premium card decorative elements */}
        {card.isPremium && (
          <>
            <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white/40 rounded-full"></div>
            </div>
            <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/20 rounded-full"></div>
            <div className="absolute top-1/2 right-8 w-3 h-3 bg-white/30 rounded-full"></div>
          </>
        )}
        
        <div className="p-6 h-full flex flex-col justify-between relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Suryaannarayan Bank</h3>
                {card.isPremium && <Crown className="h-4 w-4 text-white" />}
              </div>
              <p className="text-sm opacity-90">
                {card.isPremium ? 'Premium Credit Card' : 'Credit Card'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={status.variant} className="text-xs">
                {status.text}
              </Badge>
              {card.isPremium && (
                <Badge className="text-xs bg-white/20 text-white border-white/30">
                  PREMIUM
                </Badge>
              )}
            </div>
          </div>
          
            <div className="space-y-2">
            <div className={`text-xl font-mono tracking-wider ${card.isPremium ? 'font-bold' : ''}`}>
              {formatCardNumber(card.cardNumber)}
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs opacity-75">CARDHOLDER NAME</p>
                <p className="text-sm font-semibold uppercase">{card.cardholderName}</p>
              </div>
              
              <div className="text-right">
                <p className="text-xs opacity-75">VALID THRU</p>
                <p className="text-sm font-mono">
                  {card.expiryDate.toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
          
          {(showSensitiveInfo || showDetails) && (
            <div className="absolute top-2 right-2 bg-black/20 rounded px-2 py-1">
              <p className="text-xs">CVV: {card.cvv}</p>
            </div>
          )}
        </div>
      </Card>

      {!isAdmin && (
        <div className="flex gap-2">
          <Button onClick={() => setShowDetails(!showDetails)} variant="outline" size="sm" className="flex-1">
            {showDetails ? <><EyeOff className="h-4 w-4 mr-2" />Hide CVV</> : <><Eye className="h-4 w-4 mr-2" />Show CVV</>}
          </Button>
        </div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit?.(card)} className="flex items-center gap-1">
            <Edit className="h-3 w-3" />Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete?.(card.id)} className="flex items-center gap-1 hover:bg-destructive hover:text-destructive-foreground">
            <Trash2 className="h-3 w-3" />Delete
          </Button>
          {card.isBlocked ? (
            <Button variant="outline" size="sm" onClick={() => onUnblock?.(card.id)} className="flex items-center gap-1 hover:bg-green-600 hover:text-white">
              <ShieldOff className="h-3 w-3" />Unblock
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onBlock?.(card.id)} className="flex items-center gap-1 hover:bg-orange-600 hover:text-white">
              <Shield className="h-3 w-3" />Block
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditCardComponent;