import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatDate } from '@/utils/bankUtils';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Cake, Save, Edit, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdmin } from '@/context/AdminContext';

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailsDialog = ({ user, open, onOpenChange }: UserDetailsDialogProps) => {
  const { toast } = useToast();
  const { updateUser } = useAdmin();
  const [showAge, setShowAge] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User> & { 
    fatherName?: string;
    motherName?: string;
    aadhaarNumber?: string;
    panNumber?: string;
    phoneNumber?: string;
    alternatePhone?: string;
    address?: string;
    occupation?: string;
    nationality?: string;
    maritalStatus?: string;
    employmentStatus?: string;
    annualIncome?: string;
  }>({});
  
  useEffect(() => {
    if (user) {
      setEditedUser({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fatherName: mockUserDetails.fatherName,
        motherName: mockUserDetails.motherName,
        aadhaarNumber: mockUserDetails.aadhaarNumber,
        panNumber: mockUserDetails.panNumber,
        phoneNumber: mockUserDetails.phoneNumber,
        alternatePhone: mockUserDetails.alternatePhone,
        address: mockUserDetails.address,
        occupation: mockUserDetails.occupation,
        nationality: mockUserDetails.nationality,
        maritalStatus: mockUserDetails.maritalStatus,
        employmentStatus: mockUserDetails.employmentStatus,
        annualIncome: mockUserDetails.annualIncome,
      });
    }
  }, [user]);
  
  if (!user) return null;

  const mockUserDetails = {
    fatherName: `Mr. ${user.lastName} Sr.`,
    motherName: `Mrs. ${user.lastName}`,
    aadhaarNumber: `XXXX-XXXX-${user.id.substring(0, 4)}`,
    panNumber: `ABCDE${user.id.substring(0, 4)}Z`,
    phoneNumber: `+91 98765-${user.id.substring(0, 5)}`,
    alternatePhone: `+91 87654-${user.id.substring(0, 5)}`,
    address: "123 Main Street, Bangalore, Karnataka",
    occupation: "Professional",
    dateOfBirth: new Date(Date.now() - Math.random() * 1000000000000),
    nationality: "Indian",
    maritalStatus: "Single",
    employmentStatus: "Employed",
    annualIncome: `₹${Math.floor(Math.random() * 10 + 5)}00,000`,
    kycStatus: "Verified",
    lastUpdated: new Date(Date.now() - Math.random() * 10000000000),
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const toggleAgeDisplay = () => {
    setShowAge(prev => !prev);
    if (!showAge) {
      toast({
        title: "Age Information",
        description: `${user.firstName} ${user.lastName} is ${calculateAge(mockUserDetails.dateOfBirth)} years old.`,
        duration: 3000,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const userUpdateData: Partial<User> = {
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
        email: editedUser.email,
      };
      
      await updateUser(user.id, userUpdateData);
      
      toast({
        title: "Success",
        description: "User details updated successfully",
      });
      
      setEditMode(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user details",
        variant: "destructive"
      });
    }
  };

  const renderField = (label: string, value: string | number | undefined, name: string) => {
    return editMode ? (
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <Input 
          name={name}
          value={typeof editedUser[name as keyof typeof editedUser] === 'undefined' 
            ? String(value) 
            : String(editedUser[name as keyof typeof editedUser])}
          onChange={handleInputChange}
          className="mt-1"
        />
      </div>
    ) : (
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base">{value}</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">User Details</DialogTitle>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditMode(false)}
                    className="flex gap-1 items-center"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleSave}
                    className="flex gap-1 items-center"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditMode(true)}
                  className="flex gap-1 items-center"
                >
                  <Edit className="h-4 w-4" />
                  Edit User
                </Button>
              )}
            </div>
          </div>
          <DialogDescription>
            Comprehensive user profile information for {user.username}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleAgeDisplay}
                className="flex gap-2 items-center"
              >
                <Cake className="h-4 w-4" />
                {showAge ? "Hide Age" : "Show Age"}
              </Button>
            </div>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4 mt-3">
              {renderField("First Name", user.firstName, "firstName")}
              {renderField("Last Name", user.lastName, "lastName")}
              <div>
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <p className="text-base">{user.id}</p>
              </div>
              {showAge && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Age</p>
                  <p className="text-base">{calculateAge(mockUserDetails.dateOfBirth)} years</p>
                </div>
              )}
              {renderField("Father's Name", mockUserDetails.fatherName, "fatherName")}
              {renderField("Mother's Name", mockUserDetails.motherName, "motherName")}
              <div>
                <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                <p className="text-base">{formatDate(mockUserDetails.dateOfBirth)}</p>
              </div>
              {renderField("Marital Status", mockUserDetails.maritalStatus, "maritalStatus")}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4 mt-3">
              {renderField("Email Address", user.email, "email")}
              {renderField("Phone Number", mockUserDetails.phoneNumber, "phoneNumber")}
              {renderField("Alternate Phone", mockUserDetails.alternatePhone, "alternatePhone")}
              {renderField("Address", mockUserDetails.address, "address")}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">ID Information</h3>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Account Number</p>
                <p className="text-base">{user.accountNumber}</p>
              </div>
              {renderField("Aadhaar Number", mockUserDetails.aadhaarNumber, "aadhaarNumber")}
              {renderField("PAN Number", mockUserDetails.panNumber, "panNumber")}
              {renderField("Nationality", mockUserDetails.nationality, "nationality")}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Financial Information</h3>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Current Balance</p>
                <p className="text-base">₹{user.balance.toLocaleString('en-IN')}</p>
              </div>
              {renderField("Occupation", mockUserDetails.occupation, "occupation")}
              {renderField("Employment Status", mockUserDetails.employmentStatus, "employmentStatus")}
              {renderField("Annual Income", mockUserDetails.annualIncome, "annualIncome")}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Account Status</h3>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-sm font-medium text-gray-500">KYC Status</p>
                <p className="text-base">{mockUserDetails.kycStatus}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created Date</p>
                <p className="text-base">{formatDate(new Date(user.createdAt))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-base">{formatDate(mockUserDetails.lastUpdated)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
