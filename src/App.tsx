
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { BankProvider } from "@/context/BankContext";
import { AdminProvider } from "@/context/AdminContext";
import { FixedDepositProvider } from "@/context/FixedDepositContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BankProvider>
          <AdminProvider>
            <FixedDepositProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/deposits" element={<Deposits />} />
                  <Route path="/investments" element={<Investments />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/fixed-deposit" element={<FixedDeposit />} />
                  <Route path="/google-sheets" element={<GoogleSheetsIntegration />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </FixedDepositProvider>
          </AdminProvider>
        </BankProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
