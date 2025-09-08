import React from 'react';
import { CreditCard } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/bankUtils';

interface CreditCardProps {
  card: CreditCard;
  showSensitiveInfo?: boolean;
}

const CreditCardComponent: React.FC<CreditCardProps> = ({ card, showSensitiveInfo = false }) => {
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
        
        {showSensitiveInfo && (
          <div className="absolute top-2 right-2 bg-black/20 rounded px-2 py-1">
            <p className="text-xs">CVV: {card.cvv}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CreditCardComponent;