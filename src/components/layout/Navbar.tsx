
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { LogIn, Menu, X, User, LogOut, PiggyBank } from 'lucide-react';
import GoogleSheetsStatus from "@/components/ui/GoogleSheetsStatus";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-lg py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-bank-blue to-bank-gold bg-clip-text text-transparent">
            Suryaannarayan
          </span>
          <span className="ml-1 text-2xl font-bold text-bank-blue">Bank</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link 
            to="/"
            className={`${
              location.pathname === '/' 
                ? 'text-bank-blue font-semibold' 
                : 'text-gray-600 hover:text-bank-blue'
            } transition-all duration-200`}
          >
            Home
          </Link>
          
          {user ? (
            <>
              <Link 
                to="/dashboard"
                className={`${
                  location.pathname === '/dashboard' 
                    ? 'text-bank-blue font-semibold' 
                    : 'text-gray-600 hover:text-bank-blue'
                } transition-all duration-200`}
              >
                Dashboard
              </Link>
              
              <Link 
                to="/fixed-deposit"
                className={`${
                  location.pathname === '/fixed-deposit' 
                    ? 'text-bank-blue font-semibold' 
                    : 'text-gray-600 hover:text-bank-blue'
                } transition-all duration-200`}
              >
                Fixed Deposits
              </Link>

              <Link 
                to="/credit-cards"
                className={`${
                  location.pathname === '/credit-cards' 
                    ? 'text-bank-blue font-semibold' 
                    : 'text-gray-600 hover:text-bank-blue'
                } transition-all duration-200`}
              >
                Credit Card
              </Link>

              {user.isAdmin && (
                <>
                  <Link 
                    to="/admin/credit-cards"
                    className={`${
                      location.pathname === '/admin/credit-cards' 
                        ? 'text-bank-blue font-semibold' 
                        : 'text-gray-600 hover:text-bank-blue'
                    } transition-all duration-200`}
                  >
                    Card Management
                  </Link>
                  <Link 
                    to="/google-sheets"
                    className={`${
                      location.pathname === '/google-sheets' 
                        ? 'text-bank-blue font-semibold' 
                        : 'text-gray-600 hover:text-bank-blue'
                    } transition-all duration-200`}
                  >
                    Google Sheets
                  </Link>
                </>
              )}
              
              <Link 
                to="/transactions"
                className={`${
                  location.pathname === '/transactions' 
                    ? 'text-bank-blue font-semibold' 
                    : 'text-gray-600 hover:text-bank-blue'
                } transition-all duration-200`}
              >
                Transactions
              </Link>
              
              {user.isAdmin && (
                <Link 
                  to="/admin"
                  className={`${
                    location.pathname === '/admin' 
                      ? 'text-bank-blue font-semibold' 
                      : 'text-gray-600 hover:text-bank-blue'
                  } transition-all duration-200`}
                >
                  Admin Panel
                </Link>
              )}
            </>
          ) : (
            <>
              <Link 
                to="/register"
                className={`${
                  location.pathname === '/register' 
                    ? 'text-bank-blue font-semibold' 
                    : 'text-gray-600 hover:text-bank-blue'
                } transition-all duration-200`}
              >
                Register
              </Link>
            </>
          )}
          
          {user ? (
            <div className="flex items-center gap-3">
              {user.isAdmin && <GoogleSheetsStatus />}
              <Link to="/dashboard" className="flex items-center gap-2 text-bank-blue">
                <User size={18} />
                <span className="font-medium">{user.username}</span>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="border-bank-blue text-bank-blue hover:bg-bank-blue hover:text-white transition-all duration-300"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <Button asChild>
              <Link to="/login" className="flex items-center">
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-bank-blue"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-white z-40 pt-20 px-6 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}
      >
        <div className="flex flex-col space-y-6 text-lg">
          <Link
            to="/"
            className={`${
              location.pathname === '/' ? 'text-bank-blue font-semibold' : 'text-gray-600'
            } py-2 border-b border-gray-100`}
          >
            Home
          </Link>
          
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`${
                  location.pathname === '/dashboard' ? 'text-bank-blue font-semibold' : 'text-gray-600'
                } py-2 border-b border-gray-100`}
              >
                Dashboard
              </Link>

              <Link
                to="/fixed-deposit"
                className={`${
                  location.pathname === '/fixed-deposit' ? 'text-bank-blue font-semibold' : 'text-gray-600'
                } py-2 border-b border-gray-100 flex items-center`}
              >
                <PiggyBank className="h-5 w-5 mr-2" />
                Fixed Deposits
              </Link>

              <Link
                to="/credit-cards"
                className={`${
                  location.pathname === '/credit-cards' ? 'text-bank-blue font-semibold' : 'text-gray-600'
                } py-2 border-b border-gray-100`}
              >
                Credit Card
              </Link>
              
              <Link
                to="/transactions"
                className={`${
                  location.pathname === '/transactions' ? 'text-bank-blue font-semibold' : 'text-gray-600'
                } py-2 border-b border-gray-100`}
              >
                Transactions
              </Link>
              
              {user.isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className={`${
                      location.pathname === '/admin' ? 'text-bank-blue font-semibold' : 'text-gray-600'
                    } py-2 border-b border-gray-100`}
                  >
                    Admin Panel
                  </Link>
                  
                  <Link
                    to="/admin/credit-cards"
                    className={`${
                      location.pathname === '/admin/credit-cards' ? 'text-bank-blue font-semibold' : 'text-gray-600'
                    } py-2 border-b border-gray-100`}
                  >
                    Card Management
                  </Link>
                  
                  <Link
                    to="/google-sheets"
                    className={`${
                      location.pathname === '/google-sheets' ? 'text-bank-blue font-semibold' : 'text-gray-600'
                    } py-2 border-b border-gray-100`}
                  >
                    Google Sheets
                  </Link>
                </>
              )}
              
              <div className="pt-4">
                <p className="text-bank-blue font-medium mb-2">Hello, {user.username}</p>
                <Button 
                  onClick={logout}
                  className="w-full bg-bank-blue hover:bg-bank-accent transition-all duration-300"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className={`${
                  location.pathname === '/register' ? 'text-bank-blue font-semibold' : 'text-gray-600'
                } py-2 border-b border-gray-100`}
              >
                Register
              </Link>
              
              <Link
                to="/login"
                className={`${
                  location.pathname === '/login' ? 'text-bank-blue font-semibold' : 'text-gray-600'
                } py-2 border-b border-gray-100`}
              >
                Login
              </Link>
              
              <div className="pt-4">
                <Button 
                  asChild
                  className="w-full bg-bank-blue hover:bg-bank-accent transition-all duration-300"
                >
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login to Your Account
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
