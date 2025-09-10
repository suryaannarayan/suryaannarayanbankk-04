import React, { useState } from 'react';
import { CreditCard } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface CreditCardEditDialogProps {
  card: CreditCard | null;
  open: boolean;
  onClose: () => void;
  onSave: (cardId: string, updates: Partial<CreditCard>) => Promise<void>;
}

const CreditCardEditDialog: React.FC<CreditCardEditDialogProps> = ({
  card,
  open,
  onClose,
  onSave,
}) => {
  const [cardholderName, setCardholderName] = useState(card?.cardholderName || '');
  const [validityYears, setValidityYears] = useState(card?.validityYears?.toString() || '10');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (card) {
      setCardholderName(card.cardholderName);
      setValidityYears(card.validityYears?.toString() || '10');
    }
  }, [card]);

  const handleSave = async () => {
    if (!card) return;
    
    if (!cardholderName.trim()) {
      toast({
        title: "Error",
        description: "Cardholder name is required",
        variant: "destructive"
      });
      return;
    }

    const years = parseInt(validityYears);
    if (isNaN(years) || years < 1 || years > 50) {
      toast({
        title: "Error",
        description: "Validity years must be between 1 and 50",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const newExpiryDate = new Date(card.createdAt);
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + years);
      
      await onSave(card.id, {
        cardholderName: cardholderName.trim(),
        validityYears: years,
        expiryDate: newExpiryDate,
      });
      
      toast({
        title: "Success",
        description: "Credit card updated successfully",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update credit card",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Credit Card</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Card Number:</span>
              <p className="font-mono">{card.cardNumber}</p>
            </div>
            <div>
              <span className="text-muted-foreground">CVV:</span>
              <p className="font-mono">{card.cvv}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p>{card.createdAt.toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p>{card.isBlocked ? 'Blocked' : 'Active'}</p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Enter cardholder name"
            />
          </div>
          
          <div>
            <Label htmlFor="validityYears">Validity (Years)</Label>
            <Input
              id="validityYears"
              type="number"
              min="1"
              max="50"
              value={validityYears}
              onChange={(e) => setValidityYears(e.target.value)}
              placeholder="Enter validity in years"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current expiry: {card.expiryDate.toLocaleDateString()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreditCardEditDialog;