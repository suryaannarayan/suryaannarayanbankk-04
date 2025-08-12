
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChangePasswordForm from '@/components/forms/ChangePasswordForm';
import RequestAccountNumberForm from '@/components/forms/RequestAccountNumberForm';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { LockKeyhole, Key, User } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  
  // If user is not logged in, redirect to login
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Profile Settings</CardTitle>
              <CardDescription>
                Manage your account settings and change your password
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-base">{user.firstName} {user.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-base">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account Number</p>
                    <p className="text-base">{user.accountNumber}</p>
                  </div>
                  {user.isAdmin && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Type</p>
                      <p className="text-base">Administrator</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 w-[400px]">
              <TabsTrigger value="account" className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4" />
                Password
              </TabsTrigger>
              <TabsTrigger value="accountNumber" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Account Number
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="account" className="space-y-4">
              <ChangePasswordForm />
            </TabsContent>
            
            <TabsContent value="accountNumber" className="space-y-4">
              {!user.isAdmin && <RequestAccountNumberForm />}
              {user.isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle>Account Number Management</CardTitle>
                    <CardDescription>
                      As an admin, you can change your account number directly from the Admin Panel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Please go to the <a href="/admin" className="text-blue-500 hover:underline">Admin Panel</a> to change your account number or manage account number change requests from users.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
