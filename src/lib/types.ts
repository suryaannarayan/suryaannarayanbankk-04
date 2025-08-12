
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  accountNumber: string;
  balance: number;
  isAdmin: boolean;
  createdAt: Date;
  isPermanent?: boolean;
  aadhaarNo?: string;
  photo?: string;
  age?: number;
  profession?: string;
  address?: string;
  phoneNumber?: string;
  state?: string;
  district?: string;
  townVillage?: string;
  fatherName?: string;
}

export interface AccountNumberChangeRequest {
  id: string;
  userId: string;
  currentNumber: string;
  requestedNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt?: Date;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  fromAccount?: string;
  toAccount?: string;
  description: string;
  timestamp: Date;
}

export interface FixedDeposit {
  id: string;
  userId: string;
  accountNumber: string;
  principalAmount: number;
  interestRate: number;
  tenure: number; // in months
  startDate: Date;
  maturityDate: Date;
  interestEarned: number;
  maturityAmount: number;
  status: 'active' | 'matured' | 'withdrawn';
  payoutOption: 'cumulative' | 'non-cumulative';
  payoutFrequency?: 'monthly' | 'quarterly'; // for non-cumulative FDs
  autoRenewal: boolean;
  createdAt: Date;
  lastUpdated?: Date;
}

export interface FDInterestRate {
  id: string;
  tenureMin: number; // in months
  tenureMax: number; // in months
  rate: number; // percentage
  specialRate?: number; // optional senior citizen rate
  minAmount: number;
  maxAmount?: number;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'isAdmin' | 'createdAt'> & { password: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeAccountNumber: (newAccountNumber: string) => Promise<void>;
  checkAccountNumberAvailability: (accountNumber: string) => boolean;
  requestAccountNumberChange: (requestedNumber: string) => Promise<void>;
  getUserAccountNumberRequest: () => AccountNumberChangeRequest | null;
}

export interface BankContextType {
  transactions: Transaction[];
  loading: boolean;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  transfer: (amount: number, recipientAccountNumber: string, note?: string) => Promise<void>;
  getTransactions: () => Promise<void>;
}

export interface FixedDepositContextType {
  fixedDeposits: FixedDeposit[];
  interestRates: FDInterestRate[];
  loading: boolean;
  createFixedDeposit: (
    amount: number, 
    tenure: number, 
    payoutOption: 'cumulative' | 'non-cumulative',
    payoutFrequency?: 'monthly' | 'quarterly',
    autoRenewal?: boolean
  ) => Promise<void>;
  withdrawFixedDeposit: (fdId: string, isPremature: boolean) => Promise<void>;
  renewFixedDeposit: (fdId: string) => Promise<void>;
  toggleAutoRenewal: (fdId: string) => Promise<void>;
  calculateMaturityAmount: (amount: number, tenure: number, interestRate: number, payoutOption: 'cumulative' | 'non-cumulative') => number;
  getApplicableRate: (amount: number, tenure: number) => number;
  getUserFixedDeposits: () => Promise<void>;
}

export interface AdminContextType {
  users: User[];
  allTransactions: Transaction[];
  accountNumberRequests: AccountNumberChangeRequest[];
  loading: boolean;
  getUsers: () => Promise<void>;
  getAllTransactions: () => Promise<void>;
  updateUserBalance: (userId: string, newBalance: number) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resetPassword: (userId: string) => Promise<void>;
  addUser: (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'isAdmin' | 'createdAt'> & { password: string }) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  getAccountNumberRequests: () => Promise<void>;
  approveAccountNumberChange: (requestId: string) => Promise<void>;
  rejectAccountNumberChange: (requestId: string) => Promise<void>;
  changeUserAccountNumber: (userId: string, newAccountNumber: string) => Promise<void>;
}
