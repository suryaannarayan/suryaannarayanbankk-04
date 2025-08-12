
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { validateAccountNumber } from '@/utils/bankUtils';
import { Check, X, RefreshCw, ClipboardCopy, SendHorizonal } from 'lucide-react';
import { AccountNumberChangeRequest } from '@/lib/types';

const RequestAccountNumberForm: React.FC = () => {
  const { user, checkAccountNumberAvailability, requestAccountNumberChange, getUserAccountNumberRequest } = useAuth();
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<AccountNumberChangeRequest | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Check for existing requests
    if (user) {
      const request = getUserAccountNumberRequest();
      setExistingRequest(request);
    }
  }, [user]);
  
  const handleGenerateRandom = () => {
    // Generate a random account number starting with "SN" followed by 13 digits
    const prefix = "SN";
    const randomDigits = Array.from({ length: 13 }, () => 
      Math.floor(Math.random() * 10)
    ).join("");
    
    const generatedNumber = `${prefix}${randomDigits}`;
    setNewAccountNumber(generatedNumber);
    
    // Check availability
    handleCheckAvailability(generatedNumber);
  };

  const handleCheckAvailability = (accountNumber: string = newAccountNumber) => {
    if (!validateAccountNumber(accountNumber)) {
      toast({
        title: "Invalid Format",
        description: "Account number must start with SN followed by 13 digits",
        variant: "destructive",
      });
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const available = checkAccountNumberAvailability(accountNumber);
      setIsAvailable(available);
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAvailable) {
      toast({
        title: "Cannot Proceed",
        description: "This account number is already in use or invalid",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await requestAccountNumberChange(newAccountNumber);
      setNewAccountNumber('');
      setIsAvailable(null);
      // Refresh the existing request
      setExistingRequest(getUserAccountNumberRequest());
    } catch (error) {
      console.error('Error requesting account number change:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SendHorizonal className="h-5 w-5" />
          Request Account Number Change
        </CardTitle>
        <CardDescription>
          You can request to change your account number. The new number must start with SN followed by 13 digits.
          Your request will need to be approved by an administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {existingRequest ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-amber-50 border-amber-200">
              <h3 className="font-medium text-amber-800">Pending Request</h3>
              <p className="text-sm text-amber-700 mt-1">
                You already have a {existingRequest.status} request to change your account number to:{' '}
                <span className="font-medium">{existingRequest.requestedNumber}</span>
              </p>
              <p className="text-xs text-amber-600 mt-2">
                Requested on: {new Date(existingRequest.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentAccountNumber">Current Account Number</Label>
              <Input
                id="currentAccountNumber"
                value={user?.accountNumber || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentAccountNumber">Current Account Number</Label>
                <Input
                  id="currentAccountNumber"
                  value={user?.accountNumber || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="newAccountNumber">New Account Number</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateRandom}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Generate Random
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">SN</span>
                    </div>
                    <Input
                      id="newAccountNumber"
                      ref={inputRef}
                      value={newAccountNumber.startsWith("SN") ? newAccountNumber.substring(2) : newAccountNumber}
                      onChange={(e) => {
                        // Ensure only digits are entered
                        if (/^\d*$/.test(e.target.value) && e.target.value.length <= 13) {
                          setNewAccountNumber(`SN${e.target.value}`);
                          setIsAvailable(null);
                        }
                      }}
                      placeholder="1234567890123"
                      className={`pl-10 ${
                        isAvailable === true 
                          ? 'border-green-500 focus-visible:ring-green-500' 
                          : isAvailable === false 
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : ''
                      }`}
                    />
                    {isAvailable !== null && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isAvailable ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => handleCheckAvailability()}
                    disabled={isChecking || !newAccountNumber || newAccountNumber === user?.accountNumber}
                  >
                    {isChecking ? 'Checking...' : 'Check'}
                  </Button>
                </div>
                
                {isAvailable === false && (
                  <p className="text-sm text-red-500">This account number is already in use</p>
                )}
                {isAvailable === true && (
                  <p className="text-sm text-green-500">This account number is available</p>
                )}
                
                {newAccountNumber === user?.accountNumber && (
                  <p className="text-sm text-amber-500">New account number cannot be the same as the current one</p>
                )}
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6"
              disabled={
                isSubmitting || 
                !isAvailable || 
                !newAccountNumber || 
                newAccountNumber === user?.accountNumber
              }
            >
              {isSubmitting ? "Submitting..." : "Apply for Change"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestAccountNumberForm;
