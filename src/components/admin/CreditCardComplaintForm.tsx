import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

interface CreditCardComplaintFormProps {
  userCards: any[];
  userId: string;
  onComplaintSubmitted: () => void;
}

const CreditCardComplaintForm: React.FC<CreditCardComplaintFormProps> = ({
  userCards,
  userId,
  onComplaintSubmitted
}) => {
  const [selectedCard, setSelectedCard] = useState('');
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const issueTypes = [
    'card_blocked',
    'card_details_leaked',
    'unauthorized_transaction',
    'card_not_working',
    'change_card_details',
    'temporary_block_request',
    'unblock_request',
    'card_lost_stolen',
    'other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('credit_card_complaints')
        .insert({
          user_id: userId,
          card_id: selectedCard,
          issue_type: issueType,
          description: description.trim(),
          status: 'pending',
          priority: issueType === 'card_lost_stolen' ? 'urgent' : 'medium'
        });

      if (error) throw error;

      toast({
        title: "Complaint Submitted",
        description: "Your complaint has been submitted successfully. Admin will review it soon.",
      });

      // Reset form
      setSelectedCard('');
      setIssueType('');
      setDescription('');
      onComplaintSubmitted();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit complaint",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Card Issue</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> Never share your CVV, PIN, or full card details in complaints. 
            Use this form only for legitimate issues with your credit card.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="card">Select Credit Card</Label>
            <Select value={selectedCard} onValueChange={setSelectedCard} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your card" />
              </SelectTrigger>
              <SelectContent>
                {userCards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    Card ending in {card.cardNumber.slice(-4)} - {card.cardholderName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="issueType">Issue Type</Label>
            <Select value={issueType} onValueChange={setIssueType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card_blocked">Card is Blocked</SelectItem>
                <SelectItem value="card_details_leaked">Card Details Leaked</SelectItem>
                <SelectItem value="unauthorized_transaction">Unauthorized Transaction</SelectItem>
                <SelectItem value="card_not_working">Card Not Working</SelectItem>
                <SelectItem value="change_card_details">Change Card Details</SelectItem>
                <SelectItem value="temporary_block_request">Request Temporary Block</SelectItem>
                <SelectItem value="unblock_request">Request Card Unblock</SelectItem>
                <SelectItem value="card_lost_stolen">Card Lost/Stolen</SelectItem>
                <SelectItem value="other">Other Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your issue in detail. Do NOT include sensitive information like CVV or PIN."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </div>

          <Button type="submit" disabled={loading || !selectedCard || !issueType}>
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreditCardComplaintForm;