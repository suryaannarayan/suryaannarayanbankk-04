
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { useFixedDeposit } from '@/context/FixedDepositContext';
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from '@/utils/bankUtils';
import { FixedDeposit as FDType } from '@/lib/types';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Calendar,
  RefreshCw,
  ArrowDownRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  DollarSign,
  PiggyBank,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

const FixedDepositPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    fixedDeposits, 
    interestRates, 
    loading, 
    createFixedDeposit, 
    withdrawFixedDeposit, 
    renewFixedDeposit, 
    toggleAutoRenewal, 
    calculateMaturityAmount, 
    getApplicableRate 
  } = useFixedDeposit();
  const { toast } = useToast();
  
  // New FD form state
  const [amount, setAmount] = useState<string>('10000');
  const [tenure, setTenure] = useState<string>('12');
  const [payoutOption, setPayoutOption] = useState<'cumulative' | 'non-cumulative'>('cumulative');
  const [payoutFrequency, setPayoutFrequency] = useState<'monthly' | 'quarterly'>('monthly');
  const [autoRenewal, setAutoRenewal] = useState<boolean>(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  
  // Calculator state
  const [calcAmount, setCalcAmount] = useState<string>('10000');
  const [calcTenure, setCalcTenure] = useState<string>('12');
  const [calcPayoutOption, setCalcPayoutOption] = useState<'cumulative' | 'non-cumulative'>('cumulative');
  const [calcResult, setCalcResult] = useState<{
    interestRate: number;
    interestEarned: number;
    maturityAmount: number;
  } | null>(null);
  
  // Confirmation dialog state
  const [selectedFD, setSelectedFD] = useState<FDType | null>(null);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState<boolean>(false);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState<boolean>(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Filter fixed deposits by status
  const activeFDs = fixedDeposits.filter(fd => fd.status === 'active');
  const maturedFDs = fixedDeposits.filter(fd => fd.status === 'matured');
  const withdrawnFDs = fixedDeposits.filter(fd => fd.status === 'withdrawn');
  
  // Calculate totals
  const totalInvested = activeFDs.reduce((sum, fd) => sum + fd.principalAmount, 0);
  const totalMaturityValue = activeFDs.reduce((sum, fd) => sum + fd.maturityAmount, 0);
  const totalEarnings = totalMaturityValue - totalInvested;
  
  // Handle form submission
  const handleCreateFD = async () => {
    try {
      const amountValue = parseFloat(amount);
      const tenureValue = parseInt(tenure);
      
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      if (isNaN(tenureValue) || tenureValue <= 0) {
        throw new Error('Please enter a valid tenure');
      }
      
      // Check minimum amount based on selected tenure
      const applicableRate = interestRates.find(rate => 
        tenureValue >= rate.tenureMin && tenureValue <= rate.tenureMax
      );
      
      if (applicableRate && amountValue < applicableRate.minAmount) {
        throw new Error(`Minimum amount for ${tenureValue} month tenure is ${formatCurrency(applicableRate.minAmount)}`);
      }
      
      // Check if user has sufficient balance
      if (user && user.balance < amountValue) {
        throw new Error('Insufficient balance');
      }
      
      await createFixedDeposit(
        amountValue,
        tenureValue,
        payoutOption,
        payoutOption === 'non-cumulative' ? payoutFrequency : undefined,
        autoRenewal
      );
      
      // Reset form
      setAmount('10000');
      setTenure('12');
      setPayoutOption('cumulative');
      setPayoutFrequency('monthly');
      setAutoRenewal(false);
      setIsCreateDialogOpen(false);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create fixed deposit",
        variant: "destructive"
      });
    }
  };
  
  // Handle withdrawal
  const handleWithdraw = async (isPremature: boolean) => {
    if (!selectedFD) return;
    
    try {
      await withdrawFixedDeposit(selectedFD.id, isPremature);
      setIsWithdrawDialogOpen(false);
      setSelectedFD(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw fixed deposit",
        variant: "destructive"
      });
    }
  };
  
  // Handle renewal
  const handleRenew = async () => {
    if (!selectedFD) return;
    
    try {
      await renewFixedDeposit(selectedFD.id);
      setIsRenewDialogOpen(false);
      setSelectedFD(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to renew fixed deposit",
        variant: "destructive"
      });
    }
  };
  
  // Handle auto-renewal toggle
  const handleToggleAutoRenewal = async (fd: FDType) => {
    try {
      await toggleAutoRenewal(fd.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update auto-renewal",
        variant: "destructive"
      });
    }
  };
  
  // Calculate interest for FD calculator
  const calculateInterest = () => {
    try {
      const amount = parseFloat(calcAmount);
      const tenure = parseInt(calcTenure);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      if (isNaN(tenure) || tenure <= 0) {
        throw new Error('Please enter a valid tenure');
      }
      
      const interestRate = getApplicableRate(amount, tenure);
      const maturityAmount = calculateMaturityAmount(amount, tenure, interestRate, calcPayoutOption);
      const interestEarned = maturityAmount - amount;
      
      setCalcResult({
        interestRate,
        interestEarned,
        maturityAmount
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate interest",
        variant: "destructive"
      });
    }
  };
  
  // Calculate progress percentage for FD
  const calculateProgress = (fd: FDType) => {
    const today = new Date();
    const startDate = new Date(fd.startDate);
    const maturityDate = new Date(fd.maturityDate);
    
    const totalDuration = maturityDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    
    if (elapsed < 0) return 0;
    if (elapsed > totalDuration) return 100;
    
    return Math.round((elapsed / totalDuration) * 100);
  };
  
  return (
    <MainLayout>
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fixed Deposits</h1>
            <p className="text-gray-500 mt-1">Grow your wealth with secure and higher returns</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Fixed Deposit
            </Button>
          </div>
        </div>
        
        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <PiggyBank className="inline-block mr-2 h-4 w-4" />
                Total Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalInvested)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {activeFDs.length} active deposits
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <DollarSign className="inline-block mr-2 h-4 w-4" />
                Total Maturity Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalMaturityValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Expected at maturity
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <Coins className="inline-block mr-2 h-4 w-4" />
                Total Interest Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{formatCurrency(totalEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">
                Expected at maturity
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Active FDs ({activeFDs.length})
            </TabsTrigger>
            <TabsTrigger value="matured">
              <Clock className="mr-2 h-4 w-4" />
              Matured FDs ({maturedFDs.length})
            </TabsTrigger>
            <TabsTrigger value="withdrawn">
              <X className="mr-2 h-4 w-4" />
              Withdrawn FDs ({withdrawnFDs.length})
            </TabsTrigger>
            <TabsTrigger value="calculator">
              <Calculator className="mr-2 h-4 w-4" />
              FD Calculator
            </TabsTrigger>
            <TabsTrigger value="rates">
              <ChevronRight className="mr-2 h-4 w-4" />
              Interest Rates
            </TabsTrigger>
          </TabsList>
          
          {/* Active FDs Tab */}
          <TabsContent value="active">
            {activeFDs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <PiggyBank className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700">No Active Fixed Deposits</h3>
                  <p className="text-gray-500 text-center mt-2 mb-4">
                    You don't have any active fixed deposits. Create one to start earning interest.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    Create New FD
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeFDs.map(fd => (
                  <Card key={fd.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>
                            {formatCurrency(fd.principalAmount)}
                          </CardTitle>
                          <CardDescription>
                            {fd.tenure} month{fd.tenure > 1 ? 's' : ''} @ {fd.interestRate}%
                          </CardDescription>
                        </div>
                        <div className="py-1 px-2 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                          Active
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium">{calculateProgress(fd)}%</span>
                          </div>
                          <Progress value={calculateProgress(fd)} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Deposit Date</p>
                            <p className="font-medium">
                              {new Date(fd.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Maturity Date</p>
                            <p className="font-medium">
                              {new Date(fd.maturityDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Interest Earned</p>
                            <p className="font-medium text-green-600">
                              {formatCurrency(fd.interestEarned)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Maturity Amount</p>
                            <p className="font-medium">
                              {formatCurrency(fd.maturityAmount)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Auto-Renewal:</span>
                            <Button 
                              variant={fd.autoRenewal ? "default" : "outline"} 
                              size="sm"
                              onClick={() => handleToggleAutoRenewal(fd)}
                            >
                              {fd.autoRenewal ? (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  On
                                </>
                              ) : (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  Off
                                </>
                              )}
                            </Button>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setSelectedFD(fd);
                              setIsWithdrawDialogOpen(true);
                            }}
                          >
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                            Withdraw Early
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Matured FDs Tab */}
          <TabsContent value="matured">
            {maturedFDs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Clock className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700">No Matured Fixed Deposits</h3>
                  <p className="text-gray-500 text-center mt-2">
                    You don't have any matured fixed deposits at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Tenure</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Maturity Amount</TableHead>
                      <TableHead>Maturity Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maturedFDs.map(fd => (
                      <TableRow key={fd.id}>
                        <TableCell className="font-medium">
                          {formatCurrency(fd.principalAmount)}
                        </TableCell>
                        <TableCell>
                          {fd.tenure} month{fd.tenure > 1 ? 's' : ''}
                        </TableCell>
                        <TableCell>{fd.interestRate}%</TableCell>
                        <TableCell>{formatCurrency(fd.maturityAmount)}</TableCell>
                        <TableCell>
                          {new Date(fd.maturityDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedFD(fd);
                                setIsWithdrawDialogOpen(true);
                              }}
                            >
                              Withdraw
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedFD(fd);
                                setIsRenewDialogOpen(true);
                              }}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Renew
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          {/* Withdrawn FDs Tab */}
          <TabsContent value="withdrawn">
            {withdrawnFDs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <X className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700">No Withdrawn Fixed Deposits</h3>
                  <p className="text-gray-500 text-center mt-2">
                    You don't have any withdrawn fixed deposits in your history.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Tenure</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Withdrawn Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawnFDs.map(fd => (
                      <TableRow key={fd.id}>
                        <TableCell className="font-medium">
                          {formatCurrency(fd.principalAmount)}
                        </TableCell>
                        <TableCell>
                          {fd.tenure} month{fd.tenure > 1 ? 's' : ''}
                        </TableCell>
                        <TableCell>{fd.interestRate}%</TableCell>
                        <TableCell>
                          {new Date(fd.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {fd.lastUpdated 
                            ? new Date(fd.lastUpdated).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          {/* FD Calculator Tab */}
          <TabsContent value="calculator">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Fixed Deposit Calculator</CardTitle>
                  <CardDescription>
                    Calculate your returns on fixed deposits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="calcAmount">Deposit Amount (₹)</Label>
                        <Input
                          id="calcAmount"
                          type="number"
                          min="1000"
                          value={calcAmount}
                          onChange={(e) => setCalcAmount(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="calcTenure">Tenure (Months)</Label>
                        <Input
                          id="calcTenure"
                          type="number"
                          min="1"
                          max="120"
                          value={calcTenure}
                          onChange={(e) => setCalcTenure(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="calcPayoutOption">Payout Option</Label>
                        <Select
                          value={calcPayoutOption}
                          onValueChange={(value) => setCalcPayoutOption(value as 'cumulative' | 'non-cumulative')}
                        >
                          <SelectTrigger id="calcPayoutOption">
                            <SelectValue placeholder="Select payout option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cumulative">Cumulative (At Maturity)</SelectItem>
                            <SelectItem value="non-cumulative">Non-Cumulative (Periodic)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button onClick={calculateInterest} className="w-full">
                        <Calculator className="mr-2 h-4 w-4" />
                        Calculate
                      </Button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-4">Calculation Result</h3>
                      
                      {calcResult ? (
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500">Applicable Interest Rate</p>
                            <p className="text-2xl font-bold text-blue-600">{calcResult.interestRate}%</p>
                          </div>
                          
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Principal Amount</p>
                              <p className="text-lg font-medium">{formatCurrency(parseFloat(calcAmount))}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Interest Earned</p>
                              <p className="text-lg font-medium text-green-600">
                                {formatCurrency(calcResult.interestEarned)}
                              </p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <p className="text-sm text-gray-500">Maturity Amount</p>
                            <p className="text-2xl font-bold">
                              {formatCurrency(calcResult.maturityAmount)}
                            </p>
                          </div>
                          
                          <Button 
                            onClick={() => {
                              setAmount(calcAmount);
                              setTenure(calcTenure);
                              setPayoutOption(calcPayoutOption);
                              setIsCreateDialogOpen(true);
                            }}
                            className="w-full"
                          >
                            Create This FD
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                          <Calculator className="h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-gray-500 text-center">
                            Enter deposit details and click Calculate to see the maturity amount
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>FD Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <DollarSign className="h-4 w-4 text-blue-700" />
                      </div>
                      <div>
                        <h4 className="font-medium">Higher Returns</h4>
                        <p className="text-sm text-gray-500">
                          Earn higher interest rates compared to regular savings accounts
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-green-700" />
                      </div>
                      <div>
                        <h4 className="font-medium">Safety & Security</h4>
                        <p className="text-sm text-gray-500">
                          Guaranteed returns with no market risk
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <RefreshCw className="h-4 w-4 text-purple-700" />
                      </div>
                      <div>
                        <h4 className="font-medium">Flexible Options</h4>
                        <p className="text-sm text-gray-500">
                          Choose from various tenure options to match your financial goals
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-amber-100 p-2 rounded-full">
                        <Calendar className="h-4 w-4 text-amber-700" />
                      </div>
                      <div>
                        <h4 className="font-medium">Predictable Returns</h4>
                        <p className="text-sm text-gray-500">
                          Know exactly how much you'll earn at maturity
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Interest Rates Tab */}
          <TabsContent value="rates">
            <Card>
              <CardHeader>
                <CardTitle>Current Interest Rates</CardTitle>
                <CardDescription>
                  Fixed deposit interest rates effective from {new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenure</TableHead>
                        <TableHead>Standard Rate</TableHead>
                        <TableHead>Senior Citizen Rate</TableHead>
                        <TableHead>Minimum Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interestRates.map(rate => (
                        <TableRow key={rate.id}>
                          <TableCell className="font-medium">
                            {rate.tenureMin === rate.tenureMax 
                              ? `${rate.tenureMin} months` 
                              : `${rate.tenureMin} to ${rate.tenureMax} months`}
                          </TableCell>
                          <TableCell>{rate.rate}%</TableCell>
                          <TableCell>{rate.specialRate}%</TableCell>
                          <TableCell>{formatCurrency(rate.minAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  * Interest rates are subject to change without prior notice. The above rates are applicable for new deposits and renewals.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Create FD Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Fixed Deposit</DialogTitle>
              <DialogDescription>
                Invest your money for higher returns
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fdAmount">Amount (₹)</Label>
                <Input
                  id="fdAmount"
                  type="number"
                  min="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Available Balance: {user ? formatCurrency(user.balance) : '₹0.00'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fdTenure">Tenure (Months)</Label>
                <Input
                  id="fdTenure"
                  type="number"
                  min="1"
                  max="120"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fdPayoutOption">Payout Option</Label>
                <Select
                  value={payoutOption}
                  onValueChange={(value) => setPayoutOption(value as 'cumulative' | 'non-cumulative')}
                >
                  <SelectTrigger id="fdPayoutOption">
                    <SelectValue placeholder="Select payout option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cumulative">Cumulative (At Maturity)</SelectItem>
                    <SelectItem value="non-cumulative">Non-Cumulative (Periodic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {payoutOption === 'non-cumulative' && (
                <div className="space-y-2">
                  <Label htmlFor="fdPayoutFrequency">Payout Frequency</Label>
                  <Select
                    value={payoutFrequency}
                    onValueChange={(value) => setPayoutFrequency(value as 'monthly' | 'quarterly')}
                  >
                    <SelectTrigger id="fdPayoutFrequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRenewal"
                  checked={autoRenewal}
                  onChange={(e) => setAutoRenewal(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="autoRenewal" className="text-sm font-normal">
                  Enable auto-renewal at maturity
                </Label>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Interest Rate:</span>
                  <span className="font-medium">
                    {getApplicableRate(parseFloat(amount) || 0, parseInt(tenure) || 0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Maturity Date:</span>
                  <span className="font-medium">
                    {(() => {
                      const date = new Date();
                      date.setMonth(date.getMonth() + (parseInt(tenure) || 0));
                      return date.toLocaleDateString();
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Maturity Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      calculateMaturityAmount(
                        parseFloat(amount) || 0,
                        parseInt(tenure) || 0,
                        getApplicableRate(parseFloat(amount) || 0, parseInt(tenure) || 0),
                        payoutOption
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleCreateFD}>
                Create Fixed Deposit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Withdraw Dialog */}
        <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Withdraw Fixed Deposit</DialogTitle>
              <DialogDescription>
                {selectedFD && new Date(selectedFD.maturityDate) > new Date() ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-500 inline-block mr-1" />
                    This is a premature withdrawal and may incur a penalty.
                  </>
                ) : (
                  'Withdraw your matured fixed deposit.'
                )}
              </DialogDescription>
            </DialogHeader>
            
            {selectedFD && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Principal Amount</p>
                      <p className="font-medium">{formatCurrency(selectedFD.principalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Interest Rate</p>
                      <p className="font-medium">{selectedFD.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Maturity Date</p>
                      <p className="font-medium">
                        {new Date(selectedFD.maturityDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Maturity Amount</p>
                      <p className="font-medium">{formatCurrency(selectedFD.maturityAmount)}</p>
                    </div>
                  </div>
                </div>
                
                {new Date(selectedFD.maturityDate) > new Date() && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <h4 className="font-medium text-amber-800 mb-2">Premature Withdrawal Details:</h4>
                    <p className="text-sm text-amber-700 mb-2">
                      Since you are withdrawing before the maturity date, a penalty will be applied:
                    </p>
                    <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                      <li>Penalty: 1% of principal amount</li>
                      <li>Only 50% of accrued interest will be paid</li>
                    </ul>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm">
                        <span>Estimated withdrawal amount:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            selectedFD.principalAmount + 
                            (selectedFD.interestEarned / 2) - 
                            (selectedFD.principalAmount * 0.01)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleWithdraw(new Date(selectedFD?.maturityDate || 0) > new Date())}
              >
                Confirm Withdrawal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Renew Dialog */}
        <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Renew Fixed Deposit</DialogTitle>
              <DialogDescription>
                Renew your matured fixed deposit with the same terms
              </DialogDescription>
            </DialogHeader>
            
            {selectedFD && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">New Principal Amount</p>
                      <p className="font-medium">{formatCurrency(selectedFD.maturityAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tenure</p>
                      <p className="font-medium">{selectedFD.tenure} months</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">New Interest Rate</p>
                      <p className="font-medium">
                        {getApplicableRate(selectedFD.maturityAmount, selectedFD.tenure)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payout Option</p>
                      <p className="font-medium">{selectedFD.payoutOption}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-2">New Maturity Details:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>New Principal Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedFD.maturityAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>New Maturity Date:</span>
                      <span className="font-medium">
                        {(() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + selectedFD.tenure);
                          return date.toLocaleDateString();
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Estimated New Maturity Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          calculateMaturityAmount(
                            selectedFD.maturityAmount,
                            selectedFD.tenure,
                            getApplicableRate(selectedFD.maturityAmount, selectedFD.tenure),
                            selectedFD.payoutOption
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenew}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Renew Fixed Deposit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default FixedDepositPage;
