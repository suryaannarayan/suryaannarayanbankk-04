
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/context/AdminContext';
import { formatCurrency, formatDate, validateAccountNumber, isAccountNumberAvailable } from '@/utils/bankUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, Transaction, AccountNumberChangeRequest } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import UserDetailsDialog from '@/components/admin/UserDetailsDialog';
import { RefreshCw, Search, Edit, Trash2, AlertTriangle, UserPlus, Key, FileText, Users, Settings, BarChart4, RotateCw, Check, X, IndianRupee, Receipt, ListChecks, Info } from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const { 
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
  } = useAdmin();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isViewUserDetailsOpen, setIsViewUserDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isAdmin: false
  });
  const [editUserData, setEditUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    balance: 0
  });
  const [selectedUserForAccountChange, setSelectedUserForAccountChange] = useState<string>('');
  const [newAccountNumber, setNewAccountNumber] = useState<string>('');
  const [accountNumberError, setAccountNumberError] = useState<string>('');
  
  useEffect(() => {
    if (user?.isAdmin) {
      getUsers();
      getAllTransactions();
      getAccountNumberRequests();
    }
  }, [user]);
  
  const handleRefresh = () => {
    getUsers();
    getAllTransactions();
    getAccountNumberRequests();
    toast({
      title: "Data Refreshed",
      description: "The admin panel data has been refreshed.",
    });
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddUser = async () => {
    try {
      const emailExists = users.some(user => user.email.toLowerCase() === newUserData.email.toLowerCase());
      
      if (emailExists) {
        toast({
          title: "User Already Exists",
          description: "A user with this email address already exists.",
          variant: "destructive"
        });
        return;
      }
      
      await addUser({
        ...newUserData,
        username: `${newUserData.firstName} ${newUserData.lastName}`,
      });
      
      setIsAddUserDialogOpen(false);
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        isAdmin: false
      });
      
      toast({
        title: "User Added",
        description: "The new user has been added successfully.",
      });
      
      getUsers();
    } catch (error: any) {
      toast({
        title: "Error Adding User",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      balance: user.balance
    });
    setIsEditUserDialogOpen(true);
  };
  
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUser(selectedUser.id, {
        firstName: editUserData.firstName,
        lastName: editUserData.lastName,
        email: editUserData.email,
        username: `${editUserData.firstName} ${editUserData.lastName}`
      });
      
      if (editUserData.balance !== selectedUser.balance) {
        await updateUserBalance(selectedUser.id, editUserData.balance);
      }
      
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: "User Updated",
        description: "The user has been updated successfully.",
      });
      
      getUsers();
    } catch (error: any) {
      toast({
        title: "Error Updating User",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await deleteUser(userId);
        toast({
          title: "User Deleted",
          description: "The user has been deleted successfully.",
        });
        getUsers();
      } catch (error: any) {
        toast({
          title: "Error Deleting User",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };
  
  const handleResetPassword = async (userId: string) => {
    if (window.confirm("Are you sure you want to reset this user's password? They will receive a temporary password.")) {
      try {
        await resetPassword(userId);
        toast({
          title: "Password Reset",
          description: "The user's password has been reset successfully.",
        });
      } catch (error: any) {
        toast({
          title: "Error Resetting Password",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };
  
  const handleApproveAccountNumberChange = async (requestId: string) => {
    if (window.confirm("Are you sure you want to approve this account number change?")) {
      try {
        await approveAccountNumberChange(requestId);
      } catch (error: any) {
        toast({
          title: "Error Approving Request",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };
  
  const handleRejectAccountNumberChange = async (requestId: string) => {
    if (window.confirm("Are you sure you want to reject this account number change?")) {
      try {
        await rejectAccountNumberChange(requestId);
      } catch (error: any) {
        toast({
          title: "Error Rejecting Request",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };
  
  const handleAccountNumberChange = async () => {
    setAccountNumberError('');
    
    if (!selectedUserForAccountChange) {
      setAccountNumberError('Please select a user');
      return;
    }
    
    if (!validateAccountNumber(newAccountNumber)) {
      setAccountNumberError('Account number must start with SN followed by 13 digits');
      return;
    }
    
    try {
      await changeUserAccountNumber(selectedUserForAccountChange, newAccountNumber);
      setSelectedUserForAccountChange('');
      setNewAccountNumber('');
    } catch (error: any) {
      setAccountNumberError(error.message);
    }
  };
  
  const handleCheckAccountNumber = () => {
    setAccountNumberError('');
    
    if (!newAccountNumber) {
      setAccountNumberError('Please enter an account number');
      return;
    }
    
    if (!validateAccountNumber(newAccountNumber)) {
      setAccountNumberError('Account number must start with SN followed by 13 digits');
      return;
    }
    
    try {
      const isAvailable = isAccountNumberAvailable(newAccountNumber);
      if (isAvailable) {
        toast({
          title: "Account Number Available",
          description: `${newAccountNumber} is available for use`,
        });
      } else {
        setAccountNumberError('This account number is already in use. Please try another one.');
      }
    } catch (error: any) {
      setAccountNumberError(error.message);
    }
  };
  
  const totalBalance = users.reduce((total, user) => total + user.balance, 0);
  
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-500">Access Denied</CardTitle>
              <CardDescription className="text-center">
                You do not have permission to access the admin panel.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  const handleViewUserDetails = (user: User) => {
    setUserToView(user);
    setIsViewUserDetailsOpen(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter(u => u.isAdmin).length} admins, {users.length - users.filter(u => u.isAdmin).length} regular users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
              <p className="text-xs text-muted-foreground">
                Across all user accounts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allTransactions.length}</div>
              <p className="text-xs text-muted-foreground">
                {allTransactions.filter(t => t.type === 'transfer').length} transfers, {allTransactions.filter(t => t.type === 'deposit').length} deposits
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Account Number Management</h2>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid grid-cols-4 w-[500px] mb-4">
                <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="change">Change Account Number</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Current Number</TableHead>
                        <TableHead>Requested Number</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountNumberRequests
                        .filter(req => req.status === 'pending')
                        .map((request) => {
                          const requestUser = users.find(u => u.id === request.userId);
                          return (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">
                                {requestUser?.username || 'Unknown User'}
                              </TableCell>
                              <TableCell>{request.currentNumber}</TableCell>
                              <TableCell>{request.requestedNumber}</TableCell>
                              <TableCell>{formatDate(request.createdAt)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleApproveAccountNumberChange(request.id)}
                                    title="Approve Request"
                                    className="text-green-500 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRejectAccountNumberChange(request.id)}
                                    title="Reject Request"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      {accountNumberRequests.filter(req => req.status === 'pending').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No pending requests
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="approved">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Previous Number</TableHead>
                        <TableHead>New Number</TableHead>
                        <TableHead>Approved Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountNumberRequests
                        .filter(req => req.status === 'approved')
                        .map((request) => {
                          const requestUser = users.find(u => u.id === request.userId);
                          return (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">
                                {requestUser?.username || 'Unknown User'}
                              </TableCell>
                              <TableCell>{request.currentNumber}</TableCell>
                              <TableCell>{request.requestedNumber}</TableCell>
                              <TableCell>{formatDate(request.updatedAt || request.createdAt)}</TableCell>
                            </TableRow>
                          );
                        })}
                      {accountNumberRequests.filter(req => req.status === 'approved').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            No approved requests
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="rejected">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Current Number</TableHead>
                        <TableHead>Requested Number</TableHead>
                        <TableHead>Rejected Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountNumberRequests
                        .filter(req => req.status === 'rejected')
                        .map((request) => {
                          const requestUser = users.find(u => u.id === request.userId);
                          return (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">
                                {requestUser?.username || 'Unknown User'}
                              </TableCell>
                              <TableCell>{request.currentNumber}</TableCell>
                              <TableCell>{request.requestedNumber}</TableCell>
                              <TableCell>{formatDate(request.updatedAt || request.createdAt)}</TableCell>
                            </TableRow>
                          );
                        })}
                      {accountNumberRequests.filter(req => req.status === 'rejected').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            No rejected requests
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="change">
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-md p-4 mb-4">
                    <p className="text-blue-800 text-sm">
                      This section allows you to directly change a user's account number without requiring a request from the user.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="userSelect">Select User</Label>
                        <Select
                          value={selectedUserForAccountChange}
                          onValueChange={setSelectedUserForAccountChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem 
                                key={user.id} 
                                value={user.id}
                              >
                                {user.username} ({user.accountNumber})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newAccountNumber">New Account Number</Label>
                        <div className="flex">
                          <div className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-2 rounded-l-md flex items-center">
                            <span className="font-medium">SN</span>
                          </div>
                          <Input
                            id="newAccountNumber"
                            placeholder="Enter 13 digits"
                            value={newAccountNumber.startsWith('SN') ? newAccountNumber.substring(2) : newAccountNumber}
                            onChange={(e) => setNewAccountNumber(`SN${e.target.value.replace(/\D/g, '')}`)}
                            maxLength={13}
                            className="rounded-l-none"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Account number must start with SN followed by 13 digits
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={handleCheckAccountNumber}
                        >
                          Check Availability
                        </Button>
                        
                        <Button 
                          onClick={handleAccountNumberChange}
                          disabled={!selectedUserForAccountChange || !newAccountNumber}
                        >
                          Change Account Number
                        </Button>
                      </div>
                      
                      {accountNumberError && (
                        <p className="text-red-500 text-sm">{accountNumberError}</p>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium mb-2">Current User Details</h3>
                      {selectedUserForAccountChange ? (
                        (() => {
                          const selectedUser = users.find(u => u.id === selectedUserForAccountChange);
                          return selectedUser ? (
                            <div className="space-y-2">
                              <p><span className="font-medium">Name:</span> {selectedUser.username}</p>
                              <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                              <p><span className="font-medium">Current Account Number:</span> {selectedUser.accountNumber}</p>
                              <p><span className="font-medium">Balance:</span> {formatCurrency(selectedUser.balance)}</p>
                            </div>
                          ) : <p>User not found</p>
                        })()
                      ) : (
                        <p className="text-gray-500">Select a user to view details</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <Tabs defaultValue="users" className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-cols-4 w-[500px]">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="accountRequests" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Account Requests
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <BarChart4 className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              
              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account. The user will receive their login credentials.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={newUserData.firstName}
                          onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={newUserData.lastName}
                          onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Initial Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUserData.password}
                        onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="isAdmin">User Role</Label>
                      <Select
                        value={newUserData.isAdmin ? "admin" : "user"}
                        onValueChange={(value) => setNewUserData({...newUserData, isAdmin: value === "admin"})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Regular User</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddUser}>
                      Create User
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage all users in the system. You can edit user details, reset passwords, or delete users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading users...</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Account Number</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => {
                            const isSuryaAdmin = 
                              user.isAdmin && 
                              (user.email === "suryaannarayan@gmail.com" || 
                               user.username === "Suryaannarayan Bank");
                            
                            return (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                  {user.username}
                                  {user.isAdmin && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                      Admin
                                    </span>
                                  )}
                                  {isSuryaAdmin && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                                      Permanent
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.accountNumber}</TableCell>
                                <TableCell>{formatCurrency(user.balance)}</TableCell>
                                <TableCell>{formatDate(user.createdAt)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewUserDetails(user)}
                                      title="View User Details"
                                    >
                                      <Info className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditUser(user)}
                                      disabled={isSuryaAdmin || user.isPermanent}
                                      title={isSuryaAdmin ? "Cannot edit Suryaannarayan admin" : "Edit User"}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleResetPassword(user.id)}
                                      disabled={isSuryaAdmin || user.isPermanent}
                                      title={isSuryaAdmin ? "Cannot reset Suryaannarayan admin password" : "Reset Password"}
                                    >
                                      <Key className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteUser(user.id)}
                                      disabled={isSuryaAdmin || user.isPermanent}
                                      title={isSuryaAdmin ? "Cannot delete Suryaannarayan admin" : "Delete User"}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <UserDetailsDialog 
              user={userToView}
              open={isViewUserDetailsOpen}
              onOpenChange={setIsViewUserDetailsOpen}
            />
            
            <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user information and account balance.
                  </DialogDescription>
                </DialogHeader>
                
                {selectedUser && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-firstName">First Name</Label>
                        <Input
                          id="edit-firstName"
                          value={editUserData.firstName}
                          onChange={(e) => setEditUserData({...editUserData, firstName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-lastName">Last Name</Label>
                        <Input
                          id="edit-lastName"
                          value={editUserData.lastName}
                          onChange={(e) => setEditUserData({...editUserData, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editUserData.email}
                        onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-balance">Account Balance (₹)</Label>
                      <Input
                        id="edit-balance"
                        type="number"
                        value={editUserData.balance}
                        onChange={(e) => setEditUserData({...editUserData, balance: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateUser}>
                    Update User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="accountRequests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Number Change Requests</CardTitle>
                <CardDescription>
                  Review and manage account number change requests from users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading requests...</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Current Number</TableHead>
                          <TableHead>Requested Number</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Requested Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountNumberRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No account number change requests found
                            </TableCell>
                          </TableRow>
                        ) : (
                          accountNumberRequests.map((request) => {
                            const requestUser = users.find(u => u.id === request.userId);
                            return (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium">
                                  {requestUser?.username || 'Unknown User'}
                                </TableCell>
                                <TableCell>{request.currentNumber}</TableCell>
                                <TableCell>{request.requestedNumber}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    request.status === 'pending' 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : request.status === 'approved'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}>
                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                  </span>
                                </TableCell>
                                <TableCell>{formatDate(request.createdAt)}</TableCell>
                                <TableCell>
                                  {request.status === 'pending' && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleApproveAccountNumberChange(request.id)}
                                        title="Approve Request"
                                        className="text-green-500 hover:text-green-700 hover:bg-green-50"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRejectAccountNumberChange(request.id)}
                                        title="Reject Request"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                  {request.status !== 'pending' && (
                                    <span className="text-gray-500 text-sm">
                                      {request.status === 'approved' ? 'Approved' : 'Rejected'}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  View all transactions across the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading transactions...</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          allTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  transaction.type === 'deposit' 
                                    ? 'bg-green-100 text-green-800' 
                                    : transaction.type === 'withdrawal'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                              <TableCell>{transaction.fromAccount || '-'}</TableCell>
                              <TableCell>{transaction.toAccount || '-'}</TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and parameters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-amber-50 border-amber-200 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-800">Development Mode</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        This is a demo application. All data is stored locally in your browser and will be reset when you clear your browser data.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Bank Name</Label>
                      <Input id="bank-name" defaultValue="Suryaannarayan Bank" disabled />
                      <p className="text-sm text-muted-foreground mt-1">
                        The bank name is fixed and cannot be changed in the demo.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPanel;
