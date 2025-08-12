
import React from 'react';
import { Transaction } from '@/lib/types';
import { formatCurrency } from '@/utils/bankUtils';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react';

export interface TransactionItemProps {
  transaction: Transaction;
  userAccountNumber: string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, userAccountNumber }) => {
  // Determine if the transaction is incoming, outgoing, or internal
  const isIncoming = transaction.type === 'transfer' && transaction.toAccount === userAccountNumber;
  const isOutgoing = transaction.type === 'transfer' && transaction.fromAccount === userAccountNumber;
  
  // Set transaction colors and icons based on type
  const getTransactionDetails = () => {
    switch (transaction.type) {
      case 'deposit':
        return {
          icon: <ArrowDownLeft className="h-5 w-5 text-green-500" />,
          color: 'text-green-500',
          label: 'Deposit',
          amount: `+${formatCurrency(transaction.amount)}`
        };
      case 'withdrawal':
        return {
          icon: <ArrowUpRight className="h-5 w-5 text-red-500" />,
          color: 'text-red-500',
          label: 'Withdrawal',
          amount: `-${formatCurrency(transaction.amount)}`
        };
      case 'transfer':
        if (isIncoming) {
          return {
            icon: <ArrowDownLeft className="h-5 w-5 text-green-500" />,
            color: 'text-green-500',
            label: `Transfer from ${transaction.fromAccount?.slice(-4)}`,
            amount: `+${formatCurrency(transaction.amount)}`
          };
        } else {
          return {
            icon: <ArrowUpRight className="h-5 w-5 text-red-500" />,
            color: 'text-red-500',
            label: `Transfer to ${transaction.toAccount?.slice(-4)}`,
            amount: `-${formatCurrency(transaction.amount)}`
          };
        }
      default:
        return {
          icon: <ArrowLeftRight className="h-5 w-5 text-gray-500" />,
          color: 'text-gray-500',
          label: 'Transaction',
          amount: formatCurrency(transaction.amount)
        };
    }
  };
  
  const { icon, color, label, amount } = getTransactionDetails();
  
  // Format date
  const formattedDate = new Date(transaction.timestamp).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center">
        <div className="bg-gray-100 rounded-full p-2 mr-3">{icon}</div>
        <div>
          <h4 className="text-sm font-medium text-gray-900">{label}</h4>
          <p className="text-xs text-gray-500">{formattedDate}</p>
          {transaction.description && (
            <p className="text-xs text-gray-600 mt-1 italic">{transaction.description}</p>
          )}
        </div>
      </div>
      <div className={`font-medium ${color}`}>{amount}</div>
    </div>
  );
};

export default TransactionItem;
