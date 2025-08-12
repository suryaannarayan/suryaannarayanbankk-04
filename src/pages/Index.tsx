
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BankScene from '@/components/ui/BankScene';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { CreditCard, Wallet, ArrowRightLeft, Shield, ChevronRight, Users, BarChart3, ArrowDownCircle, Building, MessageSquareText, Book } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);
  
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 min-h-screen flex items-center relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-bank-light via-white to-bank-light opacity-80 z-0"></div>
        
        {/* Decorative circles */}
        <div className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-bank-blue opacity-5 animate-pulse-light"></div>
        <div className="absolute bottom-20 left-[5%] w-40 h-40 rounded-full bg-bank-accent opacity-5 animate-pulse-light"></div>
        
        <div className="container mx-auto px-4 sm:px-6 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1 animate-fade-in">
              <div className="mb-4">
                <span className="inline-block py-1 px-3 bg-bank-blue/10 text-bank-blue rounded-full text-sm font-medium mb-2 animate-scale-in">
                  Trusted Banking Partner
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 heading-gradient">
                Banking Made <span className="text-bank-blue">Simple</span>, Secure, & Beautiful
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Experience a new era of banking with Suryaannarayan Bank. 
                Manage your finances with our state-of-the-art 3D banking platform 
                that combines security and simplicity.
              </p>
              
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Button asChild className="btn-primary">
                    <Link to="/dashboard">
                      Go to Dashboard
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild className="btn-primary">
                      <Link to="/register">
                        Open an Account
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="btn-secondary">
                      <Link to="/login">
                        Login to Banking
                      </Link>
                    </Button>
                  </>
                )}
              </div>
              
              <div className="mt-12">
                <button 
                  onClick={scrollToFeatures}
                  className="flex items-center text-bank-blue hover:text-bank-accent transition-colors duration-300"
                >
                  <span className="mr-2">Explore Features</span>
                  <ArrowDownCircle className="h-4 w-4 animate-bounce" />
                </button>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 animate-fade-in">
              <div className="relative h-[400px] sm:h-[500px]">
                <BankScene className="transform scale-[0.8] sm:scale-100" />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-bank-blue/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 heading-gradient">
              Experience Next-Generation Banking
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with user-friendly features
              to provide you with the best banking experience possible.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-bank-blue/10 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-bank-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Money Management</h3>
              <p className="text-gray-600">
                Deposit, withdraw, and track your finances with our intuitive interface.
                Get real-time updates on your transactions.
              </p>
            </AnimatedCard>
            
            {/* Feature 2 */}
            <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-bank-blue/10 rounded-lg flex items-center justify-center mb-4">
                <ArrowRightLeft className="h-6 w-6 text-bank-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Seamless Transfers</h3>
              <p className="text-gray-600">
                Transfer money to other accounts instantly using unique account numbers.
                Send funds securely to friends and family.
              </p>
            </AnimatedCard>
            
            {/* Feature 3 */}
            <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-bank-blue/10 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-bank-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Digital Banking</h3>
              <p className="text-gray-600">
                Experience a fully digital banking solution with interactive 3D interfaces
                and beautiful visualizations of your financial data.
              </p>
            </AnimatedCard>
            
            {/* Feature 4 */}
            <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-bank-blue/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-bank-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bank-Grade Security</h3>
              <p className="text-gray-600">
                Your data and transactions are protected with advanced security measures.
                Rest easy knowing your money is safe.
              </p>
            </AnimatedCard>
            
            {/* Feature 5 */}
            <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-bank-blue/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-bank-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Transaction History</h3>
              <p className="text-gray-600">
                View your complete transaction history with detailed information and
                interactive visualizations to track your spending habits.
              </p>
            </AnimatedCard>
            
            {/* Feature 6 */}
            <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-bank-blue/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-bank-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Account Setup</h3>
              <p className="text-gray-600">
                Create your account in minutes and get a unique account number instantly.
                Start banking right away with minimal paperwork.
              </p>
            </AnimatedCard>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 heading-gradient">
              How Suryaannarayan Bank Works
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our banking platform is designed to be simple, intuitive, and powerful.
              Here's how you can get started in just a few steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-16 bg-bank-blue rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Account</h3>
              <p className="text-gray-600">
                Sign up with your email and password to create your banking account.
                You'll get a unique account number instantly.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="w-16 h-16 bg-bank-blue rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Fund Your Account</h3>
              <p className="text-gray-600">
                Deposit money into your account using our simple interface.
                Your balance will be updated in real-time.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="w-16 h-16 bg-bank-blue rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Banking</h3>
              <p className="text-gray-600">
                Transfer money, withdraw funds, and track your transactions.
                Enjoy a seamless banking experience.
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild className="btn-primary">
              <Link to={user ? "/dashboard" : "/register"}>
                {user ? "Go to Dashboard" : "Get Started Now"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Additional Sections */}
      <section className="py-20 bg-bank-blue text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Why Choose Suryaannarayan Bank?
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Trusted Institution</h3>
                    <p className="text-white/80">
                      With a legacy of trust and reliability, we're committed to providing 
                      the highest quality banking services to our customers.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Secure Banking</h3>
                    <p className="text-white/80">
                      Your security is our priority. We implement the latest security measures
                      to protect your financial information and transactions.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
                    <p className="text-white/80">
                      Our customer support team is available round the clock to assist you
                      with any banking queries or issues you may encounter.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="animate-fade-in">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20">
                <h3 className="text-2xl font-bold mb-6 text-center">Customer Testimonials</h3>
                
                <div className="space-y-6">
                  <div className="bg-white/10 p-4 rounded-lg">
                    <p className="italic mb-4">
                      "The 3D interface is amazing! I've never seen banking look this good.
                      The transfers are instant and the UI is intuitive."
                    </p>
                    <p className="font-semibold">- Rahul Sharma</p>
                  </div>
                  
                  <div className="bg-white/10 p-4 rounded-lg">
                    <p className="italic mb-4">
                      "I love how easy it is to track my transactions. The security features
                      give me peace of mind for all my banking needs."
                    </p>
                    <p className="font-semibold">- Priya Patel</p>
                  </div>
                  
                  <div className="bg-white/10 p-4 rounded-lg">
                    <p className="italic mb-4">
                      "Setting up an account was incredibly simple, and the customer service
                      has been excellent whenever I needed assistance."
                    </p>
                    <p className="font-semibold">- Amit Verma</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-bank-light">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 heading-gradient">
            Ready to Transform Your Banking Experience?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Join thousands of satisfied customers who have already switched to Suryaannarayan Bank.
            Experience the future of banking today.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild className="btn-primary">
              <Link to={user ? "/dashboard" : "/register"}>
                {user ? "Access Your Account" : "Open an Account"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="btn-secondary">
              <a href="#" className="flex items-center">
                <Book className="mr-2 h-4 w-4" />
                Learn More
              </a>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
