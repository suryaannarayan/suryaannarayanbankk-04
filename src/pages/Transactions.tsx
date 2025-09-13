
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBank } from '@/context/BankContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TransactionItem from '@/components/ui/TransactionItem';
import { Transaction } from '@/lib/types';

const Transactions = () => {
  const { user } = useAuth();
  const { transactions, getTransactions, loading } = useBank();
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (user) {
      const fetchTransactions = async () => {
        try {
          await getTransactions();
        } catch (error) {
          console.error('Failed to fetch transactions:', error);
        }
      };
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    if (transactions) {
      let filtered = [...transactions];

      // Apply type filter
      if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
      }

      // Apply search filter (search by description or amount)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          t => t.description.toLowerCase().includes(query) || 
               t.amount.toString().includes(query) ||
               (t.fromAccount && t.fromAccount.includes(query)) ||
               (t.toAccount && t.toAccount.includes(query))
        );
      }

      // Sort by date (newest first)
      filtered = filtered.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setFilteredTransactions(filtered);
    }
  }, [transactions, searchQuery, typeFilter]);

  if (!user) return null;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Transaction History</CardTitle>
            <CardDescription>View and filter your transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    {user.isAdmin && (
                      <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    )}
                    <SelectItem value="transfer">Transfers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-10">Loading transactions...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p>No transactions found</p>
                {searchQuery && <p className="text-sm mt-2">Try adjusting your search or filters</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    userAccountNumber={user.accountNumber}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Transactions;
