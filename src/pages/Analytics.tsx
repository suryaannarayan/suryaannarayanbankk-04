
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBank } from '@/context/BankContext';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Activity } from 'lucide-react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import MainLayout from '@/components/layout/MainLayout';

const Analytics = () => {
  const { user } = useAuth();
  const { transactions } = useBank();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Calculate statistics from transactions
  const calculateStats = () => {
    if (!transactions.length) {
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalTransfersOut: 0,
        totalTransfersIn: 0,
        monthlyActivity: [],
        transactionTypeDistribution: []
      };
    }
    
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Filter for transactions in the last 6 months
    const recentTransactions = transactions.filter(t => new Date(t.timestamp) >= sixMonthsAgo);
    
    // Get monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: Record<string, { month: string, deposits: number, withdrawals: number, transfers: number }> = {};
    
    // Initialize monthly data
    for (let i = 0; i < 6; i++) {
      const month = new Date();
      month.setMonth(now.getMonth() - i);
      const monthName = months[month.getMonth()];
      monthlyData[`${monthName}-${month.getFullYear()}`] = {
        month: monthName,
        deposits: 0,
        withdrawals: 0,
        transfers: 0
      };
    }
    
    // Fill in transaction data
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalTransfersOut = 0;
    let totalTransfersIn = 0;
    
    recentTransactions.forEach(transaction => {
      const transactionDate = new Date(transaction.timestamp);
      const monthKey = `${months[transactionDate.getMonth()]}-${transactionDate.getFullYear()}`;
      
      if (monthlyData[monthKey]) {
        if (transaction.type === 'deposit') {
          monthlyData[monthKey].deposits += transaction.amount;
          totalDeposits += transaction.amount;
        } else if (transaction.type === 'withdrawal') {
          monthlyData[monthKey].withdrawals += transaction.amount;
          totalWithdrawals += transaction.amount;
        } else if (transaction.type === 'transfer') {
          // For transfer, we need to check if it's incoming or outgoing
          if (transaction.fromAccount === user?.accountNumber) {
            monthlyData[monthKey].transfers += transaction.amount;
            totalTransfersOut += transaction.amount;
          } else if (transaction.toAccount === user?.accountNumber) {
            // This is a transfer in
            totalTransfersIn += transaction.amount;
          }
        }
      }
    });
    
    // Convert monthly data to array for chart
    const monthlyActivity = Object.values(monthlyData).reverse();
    
    // Calculate transaction type distribution for pie chart
    const transactionTypeDistribution = [
      { name: 'Deposits', value: totalDeposits },
      { name: 'Withdrawals', value: totalWithdrawals },
      { name: 'Transfers Out', value: totalTransfersOut },
      { name: 'Transfers In', value: totalTransfersIn }
    ];
    
    return {
      totalDeposits,
      totalWithdrawals,
      totalTransfersOut,
      totalTransfersIn,
      monthlyActivity,
      transactionTypeDistribution
    };
  };
  
  const stats = calculateStats();
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  if (!user) return null;
  
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-bank-blue">Analytics</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center"
          >
            <ArrowRight className="h-4 w-4 mr-2" /> Dashboard
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-bank-blue">{formatCurrency(user.balance)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalDeposits)}</span>
                <ArrowDownLeft className="h-4 w-4 ml-2 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-red-500">{formatCurrency(stats.totalWithdrawals + stats.totalTransfersOut)}</span>
                <ArrowUpRight className="h-4 w-4 ml-2 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Net Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className={`text-2xl font-bold ${stats.totalDeposits + stats.totalTransfersIn > stats.totalWithdrawals + stats.totalTransfersOut ? 'text-green-600' : 'text-red-500'}`}>
                  {formatCurrency((stats.totalDeposits + stats.totalTransfersIn) - (stats.totalWithdrawals + stats.totalTransfersOut))}
                </span>
                {stats.totalDeposits + stats.totalTransfersIn > stats.totalWithdrawals + stats.totalTransfersOut ? (
                  <TrendingUp className="h-4 w-4 ml-2 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 ml-2 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>Your financial activity over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    width={500}
                    height={300}
                    data={stats.monthlyActivity}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="deposits" name="Deposits" fill="#0088FE" />
                    <Bar dataKey="withdrawals" name="Withdrawals" fill="#FF8042" />
                    <Bar dataKey="transfers" name="Transfers" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Transaction Distribution</CardTitle>
              <CardDescription>Breakdown by transaction type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex justify-center items-center">
                {stats.transactionTypeDistribution.some(item => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart width={400} height={400}>
                      <Pie
                        data={stats.transactionTypeDistribution.filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.transactionTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No transaction data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Balance Trend</CardTitle>
            <CardDescription>Your balance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  width={500}
                  height={300}
                  data={[
                    // Placeholder data - in a real app, this would be actual balance history
                    { month: 'Jul', balance: user.balance * 0.7 },
                    { month: 'Aug', balance: user.balance * 0.8 },
                    { month: 'Sep', balance: user.balance * 0.75 },
                    { month: 'Oct', balance: user.balance * 0.85 },
                    { month: 'Nov', balance: user.balance * 0.9 },
                    { month: 'Dec', balance: user.balance }
                  ]}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke="#3182ce"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Analytics;
