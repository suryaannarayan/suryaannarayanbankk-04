import React from 'react';
import { CreditCard } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/bankUtils';
import { Edit, Trash2, Shield, ShieldOff } from 'lucide-react';

interface CreditCardProps {
  card: CreditCard;
  showSensitiveInfo?: boolean;
  isAdmin?: boolean;
  onEdit?: (card: CreditCard) => void;
  onDelete?: (cardId: string) => void;
  onBlock?: (cardId: string) => void;
  onUnblock?: (cardId: string) => void;
}

const CreditCardComponent: React.FC<CreditCardProps> = ({ 
  card, 
  showSensitiveInfo = false, 
  isAdmin = false,
  onEdit,
  onDelete,
  onBlock,
  onUnblock 
}) => {
  const formatCardNumber = (cardNumber: string): string => {
    if (showSensitiveInfo) {
      return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  const getCardStatus = () => {
    if (card.permanentlyBlocked) return { text: 'Permanently Blocked', variant: 'destructive' as const };
    if (card.isBlocked) return { text: 'Blocked', variant: 'destructive' as const };
    if (new Date() > card.expiryDate) return { text: 'Expired', variant: 'secondary' as const };
    return { text: 'Active', variant: 'default' as const };
  };

  const status = getCardStatus();

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-sm h-56 bg-gradient-to-br from-blue-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="p-6 h-full flex flex-col justify-between relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold">Suryaannarayan Bank</h3>
              <p className="text-sm opacity-90">Credit Card</p>
            </div>
            <Badge variant={status.variant} className="text-xs">
              {status.text}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="text-xl font-mono tracking-wider">
              {formatCardNumber(card.cardNumber)}
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs opacity-75">CARDHOLDER NAME</p>
                <p className="text-sm font-semibold uppercase">{showSensitiveInfo ? card.cardholderName : card.cardholderName}</p>
              </div>
              
              <div className="text-right">
                <p className="text-xs opacity-75">VALID THRU</p>
                <p className="text-sm font-mono">
                  {card.expiryDate.toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
          
          {showSensitiveInfo && (
            <div className="absolute top-2 right-2 bg-black/20 rounded px-2 py-1">
              <p className="text-xs">CVV: {card.cvv}</p>
            </div>
          )}
        </div>
      </Card>

      {isAdmin && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(card)}
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete?.(card.id)}
            className="flex items-center gap-1 hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
          {card.isBlocked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUnblock?.(card.id)}
              className="flex items-center gap-1 hover:bg-green-600 hover:text-white"
            >
              <ShieldOff className="h-3 w-3" />
              Unblock
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBlock?.(card.id)}
              className="flex items-center gap-1 hover:bg-orange-600 hover:text-white"
            >
              <Shield className="h-3 w-3" />
              Block
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditCardComponent;