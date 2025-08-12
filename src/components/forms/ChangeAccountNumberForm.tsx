
import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/context/AdminContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { validateAccountNumber } from '@/utils/bankUtils';
import { Check, X, RefreshCw, Key, UserPlus } from 'lucide-react';
import { User } from '@/lib/types';

const ChangeAccountNumberForm: React.FC = () => {
  const { user, changeAccountNumber, checkAccountNumberAvailability } = useAuth();
  const { users, changeUserAccountNumber } = useAdmin();
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

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
      // If an admin is changing their own account number
      if (!selectedUserId || selectedUserId === user?.id) {
        await changeAccountNumber(newAccountNumber);
      } 
      // If an admin is changing another user's account number
      else if (selectedUserId) {
        await changeUserAccountNumber(selectedUserId, newAccountNumber);
      }
      
      setNewAccountNumber('');
      setIsAvailable(null);
    } catch (error) {
      console.error('Error changing account number:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentAccountNumber = () => {
    if (!selectedUserId || selectedUserId === user?.id) {
      return user?.accountNumber || '';
    }
    
    const selectedUser = users.find(u => u.id === selectedUserId);
    return selectedUser?.accountNumber || '';
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Change Account Number
        </CardTitle>
        <CardDescription>
          As an admin, you can change account numbers. The new number must start with SN followed by 13 digits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* User selection dropdown for admins */}
            <div className="space-y-2">
              <Label htmlFor="userSelect">Select User</Label>
              <Select
                value={selectedUserId}
                onValueChange={(value) => {
                  setSelectedUserId(value);
                  setNewAccountNumber('');
                  setIsAvailable(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={user?.id || ''}>
                    {user?.username} (You)
                  </SelectItem>
                  {users
                    .filter(u => u.id !== user?.id) // Filter out current admin
                    .map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.username}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentAccountNumber">Current Account Number</Label>
              <Input
                id="currentAccountNumber"
                value={getCurrentAccountNumber()}
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
                  disabled={isChecking || !newAccountNumber || newAccountNumber === getCurrentAccountNumber()}
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
              
              {newAccountNumber === getCurrentAccountNumber() && (
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
              newAccountNumber === getCurrentAccountNumber() ||
              !selectedUserId
            }
          >
            {isSubmitting ? "Updating..." : "Update Account Number"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangeAccountNumberForm;
