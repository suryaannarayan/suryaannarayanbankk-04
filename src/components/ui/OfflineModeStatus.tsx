import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';
import { useBank } from '@/context/BankContext';
import { useToast } from '@/hooks/use-toast';
import { GoogleSheetsBankService } from '@/services/googleSheetsBankService';

const OfflineModeStatus: React.FC = () => {
  const { isGoogleSheetsMode, getTransactions } = useBank();
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null);
  const { toast } = useToast();

  // Check localStorage data
  const [localDataStats, setLocalDataStats] = useState({
    users: 0,
    transactions: 0
  });

  useEffect(() => {
    const updateLocalStats = () => {
      try {
        const users = JSON.parse(localStorage.getItem('suryabank_users') || '[]');
        const transactions = JSON.parse(localStorage.getItem('suryabank_transactions') || '[]');
        setLocalDataStats({
          users: users.length,
          transactions: transactions.length
        });
      } catch (error) {
        console.error('Failed to read local storage stats:', error);
      }
    };

    updateLocalStats();
    
    // Update stats every 10 seconds
    const interval = setInterval(updateLocalStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const retryGoogleSheetsConnection = async () => {
    setIsRetrying(true);
    setLastSyncAttempt(new Date());
    
    try {
      await GoogleSheetsBankService.initializeSheets();
      
      toast({
        title: "Connection Restored",
        description: "Successfully reconnected to Google Sheets",
      });
      
      // Refresh transactions to load from Google Sheets
      await getTransactions();
      
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Still unable to connect to Google Sheets. Continuing in offline mode.",
        variant: "destructive"
      });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isGoogleSheetsMode ? (
            <>
              <Wifi className="h-5 w-5 text-green-500" />
              Cloud Sync Active
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 text-yellow-500" />
              Offline Mode
            </>
          )}
        </CardTitle>
        <CardDescription>
          Data synchronization status and local storage information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGoogleSheetsMode ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Google Sheets Connected:</strong> Your data is automatically syncing to the cloud. 
              All transactions and user data are backed up in real-time.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Offline Mode Active:</strong> Your data is safely stored locally. 
              When Google Sheets connection is restored, data can be synced to the cloud.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="font-medium">Local Data</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Users: {localDataStats.users}
            </p>
            <p className="text-sm text-muted-foreground">
              Transactions: {localDataStats.transactions}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="font-medium">Sync Status</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isGoogleSheetsMode ? "Connected" : "Disconnected"}
            </p>
            {lastSyncAttempt && (
              <p className="text-xs text-muted-foreground">
                Last attempt: {lastSyncAttempt.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <span className="font-medium">Actions</span>
            <Button
              onClick={retryGoogleSheetsConnection}
              disabled={isRetrying || isGoogleSheetsMode}
              size="sm"
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </>
              )}
            </Button>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Note:</strong> In offline mode, all banking operations continue to work normally. 
            Your data is securely stored in your browser's local storage. To enable cloud backup and 
            sync across devices, contact your administrator to configure Google Sheets integration.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default OfflineModeStatus;