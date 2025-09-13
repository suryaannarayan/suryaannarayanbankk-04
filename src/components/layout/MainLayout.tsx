
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowUpRight, ArrowDownLeft, DollarSign, BarChart3, User, Settings, LogOut, PiggyBank, Shield, Gift } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-20">
        {/* Desktop sidebar */}
        {user && (
          <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col min-h-screen fixed top-0 pt-20">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-bank-blue text-white flex items-center justify-center text-lg font-semibold">
                  {user.username.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.accountNumber}</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/dashboard"
                    className={`flex items-center space-x-2 p-2 rounded-lg ${
                      isActive('/dashboard') 
                        ? 'text-bank-blue font-medium bg-blue-50' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/credit-cards"
                    className={`flex items-center space-x-2 p-2 rounded-lg ${
                      isActive('/credit-cards') 
                        ? 'text-bank-blue font-medium bg-blue-50' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Credit Cards</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/fixed-deposit"
                    className={`flex items-center space-x-2 p-2 rounded-lg ${
                      isActive('/fixed-deposit') 
                        ? 'text-bank-blue font-medium bg-blue-50' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <PiggyBank className="h-5 w-5" />
                    <span>Fixed Deposits</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/premium-cards"
                    className={`flex items-center space-x-2 p-2 rounded-lg ${
                      isActive('/premium-cards') 
                        ? 'text-bank-blue font-medium bg-blue-50' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Gift className="h-5 w-5" />
                    <span>Premium Cards</span>
                  </Link>
                </li>
                
                {user.isAdmin && (
                  <>
                    <li>
                      <Link
                        to="/admin"
                        className={`flex items-center space-x-2 p-2 rounded-lg ${
                          isActive('/admin') 
                            ? 'text-bank-blue font-medium bg-blue-50' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <User className="h-5 w-5" />
                        <span>Admin Panel</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/card-management"
                        className={`flex items-center space-x-2 p-2 rounded-lg ${
                          isActive('/admin/card-management') 
                            ? 'text-bank-blue font-medium bg-blue-50' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Shield className="h-5 w-5" />
                        <span>Card Management</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/google-sheets"
                        className={`flex items-center space-x-2 p-2 rounded-lg ${
                          isActive('/google-sheets') 
                            ? 'text-bank-blue font-medium bg-blue-50' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <DollarSign className="h-5 w-5" />
                        <span>Google Sheets</span>
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>
            <div className="p-4 border-t border-gray-200 space-y-2">
              <Link
                to="/profile"
                className={`flex items-center space-x-2 p-2 rounded-lg ${
                  isActive('/profile') 
                    ? 'text-bank-blue font-medium bg-blue-50' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Profile Settings</span>
              </Link>
              <Button variant="ghost" className="w-full justify-start text-red-500" onClick={logout}>
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
        
        {/* Main content area */}
        <div className={`flex-1 ${user ? 'md:ml-64' : ''}`}>
          {children}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default MainLayout;
