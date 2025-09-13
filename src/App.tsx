import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { BankProvider } from "@/context/BankContext";
import { AdminProvider } from "@/context/AdminContext";
import { FixedDepositProvider } from "@/context/FixedDepositContext";
import { CreditCardProvider } from "@/context/CreditCardContext";
import { DataProtectionService } from "@/utils/dataProtectionService";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import Deposits from "./pages/Deposits";
import Investments from "./pages/Investments";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import Transactions from "./pages/Transactions";
import FixedDeposit from "./pages/FixedDeposit";
import GoogleSheetsIntegration from "./pages/GoogleSheetsIntegration";
import CreditCard from "./pages/CreditCardNew";
import CreditCardManagement from "./components/admin/CreditCardManagement";
import DataProtectionDashboard from "./components/admin/DataProtectionDashboard";
import PremiumCards from "./pages/PremiumCards";
import AdminPremiumCards from "./pages/AdminPremiumCards";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AppContent = () => {
  // Initialize data protection service on app start
  useEffect(() => {
    console.log('Initializing comprehensive data protection system...');
    
    // Initialize all data protection mechanisms
    DataProtectionService.initialize();
    DataProtectionService.protectAgainstDeletion();
    DataProtectionService.protectSessionStorage();
    
    // Create initial redundant backup
    DataProtectionService.createRedundantBackup().catch(console.error);
    
    // Cleanup function
    return () => {
      DataProtectionService.stop();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/deposits" element={<ProtectedRoute adminOnly><Deposits /></ProtectedRoute>} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/fixed-deposit" element={<FixedDeposit />} />
        <Route path="/credit-cards" element={<CreditCard />} />
        <Route path="/admin/credit-cards" element={<ProtectedRoute adminOnly><CreditCardManagement /></ProtectedRoute>} />
        <Route path="/admin/premium-cards" element={<ProtectedRoute adminOnly><AdminPremiumCards /></ProtectedRoute>} />
        <Route path="/admin/data-protection" element={<ProtectedRoute adminOnly><DataProtectionDashboard /></ProtectedRoute>} />
        <Route path="/google-sheets" element={<ProtectedRoute adminOnly><GoogleSheetsIntegration /></ProtectedRoute>} />
        <Route path="/premium-cards" element={<ProtectedRoute><PremiumCards /></ProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BankProvider>
          <AdminProvider>
            <FixedDepositProvider>
              <CreditCardProvider>
                <Toaster />
                <Sonner />
                <AppContent />
              </CreditCardProvider>
            </FixedDepositProvider>
          </AdminProvider>
        </BankProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;