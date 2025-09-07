
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, AccountNumberChangeRequest } from '@/lib/types';
import { 
  generateAccountNumber, 
  validateAccountNumber, 
  isAccountNumberAvailable,
  requestAccountNumberChange as storeAccountNumberRequest,
  getUserAccountNumberRequest as getAccountRequest
} from '@/utils/bankUtils';
import { useToast } from "@/hooks/use-toast";
import { GoogleSheetsBankService } from '@/services/googleSheetsBankService';

// Create a context for authentication
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock database for users
const USERS_STORAGE_KEY = 'suryabank_users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Initialize the database with admin user if it doesn't exist
  useEffect(() => {
    const initDB = () => {
      const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);
      
      if (!existingUsers) {
        const adminUser: User = {
          id: '1',
          firstName: 'Admin',
          lastName: 'User',
          username: 'Admin',
          email: 'suryaannarayan@gmail.com',
          accountNumber: 'SN0000000000001',
          balance: 1000000000000, // ₹1,00,00,00,00,000 (₹100,000 Crore)
          isAdmin: true,
          isPermanent: true, // Mark admin as permanent to prevent deletion
          createdAt: new Date()
        };
        
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([adminUser]));
      } else {
        // Ensure admin user still exists and update if necessary
        const users = JSON.parse(existingUsers);
        const adminExists = users.some((u: User) => u.id === '1' && u.isAdmin);
        
        if (!adminExists) {
          // Re-add admin if somehow deleted
          const adminUser: User = {
            id: '1',
            firstName: 'Admin',
            lastName: 'User',
            username: 'Admin',
            email: 'suryaannarayan@gmail.com',
            accountNumber: 'SN0000000000001',
            balance: 1000000000000,
            isAdmin: true,
            isPermanent: true,
            createdAt: new Date()
          };
          
          users.push(adminUser);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
      }
    };
    
    initDB();
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // In a real app, you would use a secure API call for authentication
      // For this demo, we'll simulate with localStorage
      const existingUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      
      // Simple simulation of password hashing
      const hashedPassword = btoa(password); // NOT secure, just for demo
      
      const matchedUser = existingUsers.find((u: any) => 
        u.email === email && (u.password === hashedPassword || (
          email === 'suryaannarayan@gmail.com' && password === 'Suryanarayan@1234'
        ))
      );
      
      if (matchedUser) {
        // Don't send password to frontend
        const { password, ...userWithoutPassword } = matchedUser;
        
        // Set user in state
        setUser(userWithoutPassword);
        
        // Store in session storage
        sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${matchedUser.username}!`,
        });
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'isAdmin' | 'createdAt'> & { password: string }) => {
    setLoading(true);
    
    try {
      // In a real app, use a secure API endpoint and proper password hashing
      const existingUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      
      // Check if user with this email already exists
      if (existingUsers.some((u: any) => u.email === userData.email)) {
        throw new Error('User with this email already exists');
      }
      
      // Create new user
      const newUser: User & { password: string } = {
        id: Date.now().toString(),
        ...userData,
        accountNumber: generateAccountNumber(),
        balance: 1000, // Start with ₹1,000
        isAdmin: false,
        createdAt: new Date(),
        password: btoa(userData.password), // NOT secure, just for demo
      };
      
      // Save to "database"
      existingUsers.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      
      // Also sync to Google Sheets
      try {
        const { password: _, ...userWithoutPassword } = newUser;
        await GoogleSheetsBankService.syncUserFromLocalStorage(userWithoutPassword);
      } catch (error) {
        console.warn('Failed to sync user to Google Sheets:', error);
      }
      
      // Log in the user automatically
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      
      toast({
        title: "Registration Successful",
        description: `Welcome to Suryaannarayan Bank, ${userData.firstName}!`,
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    
    try {
      if (!user) throw new Error('User not authenticated');
      
      const existingUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.id === user.id);
      
      if (userIndex === -1) throw new Error('User not found');
      
      // Verify current password
      const hashedCurrentPassword = btoa(currentPassword);
      if (existingUsers[userIndex].password !== hashedCurrentPassword && 
          !(user.email === 'suryaannarayan@gmail.com' && currentPassword === 'Suryanarayan@1234')) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      existingUsers[userIndex].password = btoa(newPassword);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  const checkAuth = () => {
    setLoading(true);
    try {
      // Check session storage first
      const storedUser = sessionStorage.getItem('currentUser');
      
      if (storedUser) {
        // Parse the stored user
        const parsedUser = JSON.parse(storedUser);
        
        // Verify user still exists in localStorage
        const allUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
        const userExists = allUsers.some((u: User) => u.id === parsedUser.id);
        
        if (userExists) {
          // Get the latest user data from localStorage to ensure balance is up to date
          const latestUserData = allUsers.find((u: User) => u.id === parsedUser.id);
          
          if (latestUserData) {
            // Update session storage with latest data
            sessionStorage.setItem('currentUser', JSON.stringify(latestUserData));
            setUser(latestUserData);
          } else {
            setUser(parsedUser);
          }
        } else {
          // User no longer exists in localStorage
          sessionStorage.removeItem('currentUser');
          setUser(null);
          toast({
            title: "Session Expired",
            description: "Your user account was not found. Please login again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // Clear potentially corrupted data
      sessionStorage.removeItem('currentUser');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change the account number for the current user (admin only)
   */
  const changeAccountNumber = async (newAccountNumber: string) => {
    setLoading(true);
    
    try {
      if (!user) throw new Error('User not authenticated');
      if (!user.isAdmin) throw new Error('Only admin can change account numbers');
      
      // Validate the new account number format
      if (!validateAccountNumber(newAccountNumber)) {
        throw new Error('Invalid account number format. Must start with SN followed by 13 digits.');
      }
      
      // Check if the account number is available
      if (!isAccountNumberAvailable(newAccountNumber)) {
        throw new Error('This account number is already in use. Please try another one.');
      }
      
      // Update in localStorage
      const existingUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.id === user.id);
      
      if (userIndex === -1) throw new Error('User not found');
      
      // Update account number
      existingUsers[userIndex].accountNumber = newAccountNumber;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      
      // Update current user state
      const updatedUser = { ...user, accountNumber: newAccountNumber };
      setUser(updatedUser);
      
      // Update session storage
      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      toast({
        title: "Account Number Updated",
        description: `Your account number has been changed to ${newAccountNumber}`,
      });
    } catch (error: any) {
      toast({
        title: "Account Number Change Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if an account number is available
   */
  const checkAccountNumberAvailability = (accountNumber: string): boolean => {
    return isAccountNumberAvailable(accountNumber);
  };

  /**
   * Request account number change (for regular users)
   */
  const requestAccountNumberChange = async (requestedNumber: string): Promise<void> => {
    setLoading(true);
    
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Validate the new account number format
      if (!validateAccountNumber(requestedNumber)) {
        throw new Error('Invalid account number format. Must start with SN followed by 13 digits.');
      }
      
      // Check if the account number is available
      if (!isAccountNumberAvailable(requestedNumber)) {
        throw new Error('This account number is already in use. Please try another one.');
      }
      
      // Store the request
      storeAccountNumberRequest(user.id, user.accountNumber, requestedNumber);
      
      toast({
        title: "Request Submitted",
        description: "Your account number change request has been submitted for admin approval.",
      });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get user's account number change request
   */
  const getUserAccountNumberRequest = (): AccountNumberChangeRequest | null => {
    if (!user) return null;
    return getAccountRequest(user.id);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      checkAuth, 
      changePassword,
      changeAccountNumber,
      checkAccountNumberAvailability,
      requestAccountNumberChange,
      getUserAccountNumberRequest
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
