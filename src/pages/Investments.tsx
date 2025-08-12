
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, ChevronRight, LineChart, BarChart3 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

const INVESTMENT_OPTIONS = [
  {
    id: 'fixed-deposit',
    title: 'Fixed Deposit',
    description: 'Earn up to 7.5% interest annually with fixed deposits',
    minAmount: 5000,
    duration: '6 months to 5 years',
    icon: <BarChart3 className="h-10 w-10 text-bank-blue/70" />
  },
  {
    id: 'mutual-funds',
    title: 'Mutual Funds',
    description: 'Diversify your investments with our curated mutual funds portfolio',
    minAmount: 1000,
    duration: 'Long-term investment',
    icon: <LineChart className="h-10 w-10 text-bank-blue/70" />
  },
  {
    id: 'stocks',
    title: 'Stock Trading',
    description: 'Trade stocks on major exchanges with low brokerage fees',
    minAmount: 500,
    duration: 'Market hours trading',
    icon: <TrendingUp className="h-10 w-10 text-bank-blue/70" />
  }
];

const Investments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  if (!user) return null;
  
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-bank-blue">Investments</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center"
          >
            <ArrowRight className="h-4 w-4 mr-2" /> Dashboard
          </Button>
        </div>
        
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Investment Summary</CardTitle>
              <CardDescription>Your current investment portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-6 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Available for Investment</p>
                  <h2 className="text-3xl font-bold text-bank-blue">{formatCurrency(user.balance)}</h2>
                  <p className="text-xs text-gray-500 mt-1">Account: {user.accountNumber}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <p className="text-sm text-gray-500">Current Investments</p>
                  <h2 className="text-2xl font-semibold text-green-600">{formatCurrency(0)}</h2>
                  <p className="text-xs text-gray-500 mt-1">Total return: 0%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <h2 className="text-2xl font-semibold text-bank-blue mb-4">Investment Options</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INVESTMENT_OPTIONS.map((option) => (
            <Card key={option.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{option.title}</CardTitle>
                  {option.icon}
                </div>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Minimum</span>
                    <span className="text-sm font-medium">{formatCurrency(option.minAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Duration</span>
                    <span className="text-sm font-medium">{option.duration}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <span>Learn More</span>
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-10 bg-bank-blue/5 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-bank-blue mb-4">Investment Advisory</h2>
          <p className="text-gray-600 mb-4">
            Our financial advisors can help you build a personalized investment strategy based on your goals and risk tolerance.
          </p>
          <Button className="bg-bank-blue hover:bg-bank-accent">
            Schedule a Consultation
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Investments;
