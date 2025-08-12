import React, { createContext, useContext, useState } from 'react';
import { AdminContextType, User, Transaction, AccountNumberChangeRequest } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { 
  getAccountNumberRequests as fetchAccountNumberRequests, 
  updateAccountNumberRequestStatus,
  validateAccountNumber,
  isAccountNumberAvailable
} from '@/utils/bankUtils';

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'suryabank_users';
const TRANSACTIONS_STORAGE_KEY = 'suryabank_transactions';
const ACCOUNT_REQUESTS_KEY = 'account_number_requests';

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [accountNumberRequests, setAccountNumberRequests] = useState<AccountNumberChangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const getUsers = async (): Promise<void> => {
    setLoading(true);
    try {
      const usersData = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      
      const safeUsers = usersData.map((user: any) => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      setUsers(safeUsers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAllTransactions = async (): Promise<void> => {
    setLoading(true);
    try {
      const transactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
      setAllTransactions(transactions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserBalance = async (userId: string, newBalance: number): Promise<void> => {
    setLoading(true);
    try {
      const usersData = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      
      const updatedUsers = usersData.map((user: User) => {
        if (user.id === userId) {
          return { ...user, balance: newBalance };
        }
        return user;
      });
      
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      
      await getUsers();
      
      toast({
        title: "Success",
        description: "User balance updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user balance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    setLoading(true);
    try {
      const usersData = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      
      const userToDelete = usersData.find((user: User) => user.id === userId);
      
      if (!userToDelete) {
        throw new Error("User not found");
      }
      
      if (userToDelete.isAdmin && (userToDelete.email === "suryaannarayan@gmail.com" || userToDelete.username === "Suryaannarayan Bank")) {
        throw new Error("Cannot delete Suryaannarayan admin");
      }
      
      if (userToDelete.isPermanent || 
          userToDelete.email === "permanent@example.com" || 
          userToDelete.username === "PermanentUser") {
        throw new Error("Cannot delete permanent user");
      }
      
      const transactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
      const filteredTransactions = transactions.filter((transaction: Transaction) => {
        return transaction.fromAccount !== userToDelete.accountNumber && 
               transaction.toAccount !== userToDelete.accountNumber;
      });
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(filteredTransactions));
      
      const filteredUsers = usersData.filter((user: User) => user.id !== userId);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filteredUsers));
      
      await getUsers();
      await getAllTransactions();
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (userId: string): Promise<void> => {
    setLoading(true);
    try {
      const usersData = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      
      const userToReset = usersData.find((user: User) => user.id === userId);
      if (userToReset && userToReset.isAdmin && 
          (userToReset.email === "suryaannarayan@gmail.com" || 
           userToReset.username === "Suryaannarayan Bank")) {
        throw new Error("Cannot reset Suryaannarayan admin password");
      }
      
      const defaultPassword = btoa("newpassword123");
      
      const updatedUsers = usersData.map((user: any) => {
        if (user.id === userId) {
          return { ...user, password: defaultPassword };
        }
        return user;
      });
      
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      
      toast({
        title: "Success",
        description: "Password reset to 'newpassword123'",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'isAdmin' | 'createdAt'> & { password: string }): Promise<void> => {
    setLoading(true);
    try {
      const usersData = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      
      if (usersData.some((u: any) => u.email === userData.email)) {
        throw new Error('User with this email already exists');
      }
      
      const id = Date.now().toString();
      const accountNumber = 'SRY' + '0'.repeat(12 - id.length) + id;
      
      const newUser: User & { password: string } = {
        id,
        ...userData,
        accountNumber,
        balance: 1000,
        isAdmin: false,
        createdAt: new Date(),
        password: btoa(userData.password),
      };
      
      if (userData.email === "permanent@example.com" || 
          userData.username === "PermanentUser") {
        newUser.isPermanent = true;
      }
      
      usersData.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersData));
      
      await getUsers();
      
      toast({
        title: "Success",
        description: "User has been added successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add user.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
    setLoading(true);
    try {
      const usersData = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const userIndex = usersData.findIndex((u: User) => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      if (userData.email && userData.email !== usersData[userIndex].email && 
          usersData.some((u: User) => u.email === userData.email)) {
        throw new Error('User with this email already exists');
      }
      
      usersData[userIndex] = {
        ...usersData[userIndex],
        ...userData,
      };
      
      if (userData.firstName || userData.lastName) {
        const firstName = userData.firstName || usersData[userIndex].firstName;
        const lastName = userData.lastName || usersData[userIndex].lastName;
        usersData[userIndex].username = `${firstName} ${lastName}`;
      }
      
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersData));
      
      await getUsers();
      
      toast({
        title: "Success",
        description: "User has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAccountNumberRequests = async (): Promise<void> => {
    setLoading(true);
    try {
      const requests = fetchAccountNumberRequests();
      setAccountNumberRequests(requests);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load account number change requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveAccountNumberChange = async (requestId: string): Promise<void> => {
    setLoading(true);
    try {
      const requests = JSON.parse(localStorage.getItem(ACCOUNT_REQUESTS_KEY) || '[]');
      const request = requests.find((req: any) => req.id === requestId);
      
      if (!request) {
        throw new Error('Request not found');
      }
      
      const usersData = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const userIndex = usersData.findIndex((u: any) => u.id === request.userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      usersData[userIndex].accountNumber = request.requestedNumber;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersData));
      
      updateAccountNumberRequestStatus(requestId, 'approved');
      
      await getUsers();
      await getAccountNumberRequests();
      
      toast({
        title: "Request Approved",
        description: "The account number change request has been approved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve account number change request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const rejectAccountNumberChange = async (requestId: string): Promise<void> => {
    setLoading(true);
    try {
      updateAccountNumberRequestStatus(requestId, 'rejected');
      
      await getAccountNumberRequests();
      
      toast({
        title: "Request Rejected",
        description: "The account number change request has been rejected.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject account number change request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const changeUserAccountNumber = async (userId: string, newAccountNumber: string): Promise<void> => {
    setLoading(true);
    try {
      if (!validateAccountNumber(newAccountNumber)) {
        throw new Error('Invalid account number format. Must start with SN followed by 13 digits.');
      }
      
      if (!isAccountNumberAvailable(newAccountNumber)) {
        throw new Error('This account number is already in use. Please try another one.');
      }
      
      const existingUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.id === userId);
      
      if (userIndex === -1) throw new Error('User not found');
      
      existingUsers[userIndex].accountNumber = newAccountNumber;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
      
      await getUsers();
      
      toast({
        title: "Account Number Updated",
        description: `The account number has been changed to ${newAccountNumber}`,
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

  return (
    <AdminContext.Provider value={{ 
      users, 
      allTransactions, 
      accountNumberRequests,
      loading, 
      getUsers, 
      getAllTransactions, 
      updateUserBalance, 
      deleteUser, 
      resetPassword,
      addUser,
      updateUser,
      getAccountNumberRequests,
      approveAccountNumberChange,
      rejectAccountNumberChange,
      changeUserAccountNumber
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
