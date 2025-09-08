import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import MainLayout from './layout/MainLayout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Please log in to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  if (adminOnly && !user.isAdmin) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Access denied. This page is only available to administrators.
              <br />
              Contact admin at: <strong>suryaannarayan@gmail.com</strong>
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;