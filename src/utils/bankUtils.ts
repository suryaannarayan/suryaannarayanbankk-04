/**
 * Generates a random bank account number with SN prefix and 13 random digits
 */
export function generateAccountNumber(): string {
  const prefix = "SN";
  const randomDigits = Array.from({ length: 13 }, () => 
    Math.floor(Math.random() * 10)
  ).join("");
  
  return `${prefix}${randomDigits}`;
}

/**
 * Validates if an account number follows the correct format (SN followed by 13 digits)
 */
export function validateAccountNumber(accountNumber: string): boolean {
  const regex = /^SN\d{13}$/;
  return regex.test(accountNumber);
}

/**
 * Checks if an account number is already in use
 */
export function isAccountNumberAvailable(accountNumber: string): boolean {
  // Get all users from local storage
  const users = JSON.parse(localStorage.getItem('suryabank_users') || '[]');
  // Check if the account number is already used by any user
  return !users.some((user: any) => user.accountNumber === accountNumber);
}

/**
 * Formats a number as INR currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

/**
 * Validates an email address
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validates a password (minimum 8 characters, at least one uppercase, one lowercase, one number)
 */
export function validatePassword(password: string): boolean {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

/**
 * Get transaction description based on type
 */
export function getTransactionDescription(
  type: 'deposit' | 'withdrawal' | 'transfer',
  fromAccount?: string,
  toAccount?: string
): string {
  switch (type) {
    case 'deposit':
      return 'Deposit to account';
    case 'withdrawal':
      return 'Withdrawal from account';
    case 'transfer':
      return `Transfer from ${fromAccount} to ${toAccount}`;
    default:
      return 'Transaction';
  }
}

/**
 * Stores a new account number change request in localStorage
 */
export function requestAccountNumberChange(userId: string, currentNumber: string, requestedNumber: string): void {
  const requests = JSON.parse(localStorage.getItem('account_number_requests') || '[]');
  
  // Check if user already has a pending request
  const existingRequestIndex = requests.findIndex((req: any) => req.userId === userId);
  
  const newRequest = {
    id: Date.now().toString(),
    userId,
    currentNumber,
    requestedNumber,
    status: 'pending',
    createdAt: new Date(),
  };
  
  if (existingRequestIndex !== -1) {
    // Update existing request
    requests[existingRequestIndex] = newRequest;
  } else {
    // Add new request
    requests.push(newRequest);
  }
  
  localStorage.setItem('account_number_requests', JSON.stringify(requests));
}

/**
 * Gets all account number change requests
 */
export function getAccountNumberRequests(): any[] {
  return JSON.parse(localStorage.getItem('account_number_requests') || '[]');
}

/**
 * Gets account number change requests for a specific user
 */
export function getUserAccountNumberRequest(userId: string): any | null {
  const requests = JSON.parse(localStorage.getItem('account_number_requests') || '[]');
  return requests.find((req: any) => req.userId === userId) || null;
}

/**
 * Updates the status of an account number change request
 */
export function updateAccountNumberRequestStatus(requestId: string, status: 'approved' | 'rejected'): void {
  const requests = JSON.parse(localStorage.getItem('account_number_requests') || '[]');
  const requestIndex = requests.findIndex((req: any) => req.id === requestId);
  
  if (requestIndex !== -1) {
    requests[requestIndex].status = status;
    requests[requestIndex].updatedAt = new Date();
    
    localStorage.setItem('account_number_requests', JSON.stringify(requests));
  }
}
