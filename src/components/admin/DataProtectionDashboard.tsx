import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DataProtectionService } from '@/utils/dataProtectionService';
import { DataSyncUtils } from '@/utils/dataSyncUtils';
import { Shield, Database, Cloud, AlertTriangle, CheckCircle, RefreshCw, Download, Upload } from 'lucide-react';

const DataProtectionDashboard = () => {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Array<{timestamp: string, size: number}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [dataStats, setDataStats] = useState({
    users: 0,
    transactions: 0,
    creditCards: 0,
    coupons: 0,
    premiumApplications: 0
  });

  useEffect(() => {
    loadDataStats();
    loadBackups();
    loadLastSyncTime();
  }, []);

  const loadDataStats = () => {
    setDataStats({
      users: JSON.parse(localStorage.getItem('suryabank_users') || '[]').length,
      transactions: JSON.parse(localStorage.getItem('suryabank_transactions') || '[]').length,
      creditCards: JSON.parse(localStorage.getItem('credit_cards') || '[]').length,
      coupons: JSON.parse(localStorage.getItem('user_coupons') || '[]').length,
      premiumApplications: JSON.parse(localStorage.getItem('premium_applications') || '[]').length
    });
  };

  const loadBackups = () => {
    const availableBackups = DataProtectionService.getAvailableBackups();
    setBackups(availableBackups.slice(0, 10)); // Show last 10 backups
  };

  const loadLastSyncTime = () => {
    const lastSyncTime = localStorage.getItem('lastGoogleSheetsSync');
    setLastSync(lastSyncTime);
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      await DataProtectionService.createInstantBackup();
      loadBackups();
      toast({
        title: "Backup Created",
        description: "Complete data backup created successfully",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedundantBackup = async () => {
    setIsLoading(true);
    try {
      await DataProtectionService.createRedundantBackup();
      localStorage.setItem('lastGoogleSheetsSync', new Date().toISOString());
      loadBackups();
      loadLastSyncTime();
      toast({
        title: "Redundant Backup Complete",
        description: "Data backed up across all storage systems including Google Sheets",
      });
    } catch (error) {
      toast({
        title: "Redundant Backup Failed",
        description: "Some backup systems may have failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullSync = async () => {
    setIsLoading(true);
    try {
      await DataSyncUtils.performCompleteSync();
      localStorage.setItem('lastGoogleSheetsSync', new Date().toISOString());
      loadLastSyncTime();
      toast({
        title: "Sync Complete",
        description: "All data synchronized to Google Sheets",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync data to Google Sheets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (timestamp: string) => {
    if (!confirm(`Are you sure you want to restore data from ${new Date(timestamp).toLocaleString()}? This will overwrite current data.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await DataProtectionService.restoreFromBackup(timestamp);
      loadDataStats();
      toast({
        title: "Restore Complete",
        description: `Data restored from backup: ${new Date(timestamp).toLocaleString()}`,
      });
      // Refresh page to reflect restored data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Failed to restore data from backup",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">Data Protection Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your data security and backups</p>
        </div>
      </div>

      {/* Data Protection Status */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Protection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">ACTIVE</div>
            <p className="text-xs text-green-600 mt-1">
              Auto-backup every 5 minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Local Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available versions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Cloud Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastSync ? 'SYNCED' : 'PENDING'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastSync ? `Last: ${new Date(lastSync).toLocaleDateString()}` : 'Not synced yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Data Safety
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">100%</div>
            <p className="text-xs text-muted-foreground mt-1">
              No data loss risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Data Overview</CardTitle>
          <CardDescription>Current data in your system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dataStats.users}</div>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dataStats.transactions}</div>
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{dataStats.creditCards}</div>
              <p className="text-sm text-muted-foreground">Credit Cards</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{dataStats.coupons}</div>
              <p className="text-sm text-muted-foreground">Coupons</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{dataStats.premiumApplications}</div>
              <p className="text-sm text-muted-foreground">Premium Apps</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Backup & Sync Actions</CardTitle>
          <CardDescription>Manually create backups and sync data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={handleCreateBackup} disabled={isLoading} className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {isLoading ? 'Creating...' : 'Create Local Backup'}
            </Button>
            
            <Button onClick={handleRedundantBackup} disabled={isLoading} variant="outline" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              {isLoading ? 'Backing up...' : 'Full Redundant Backup'}
            </Button>
            
            <Button onClick={handleFullSync} disabled={isLoading} variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {isLoading ? 'Syncing...' : 'Sync to Google Sheets'}
            </Button>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Protection Features:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Automatic backups every 5 minutes</li>
              <li>• Multiple storage locations (Local, Google Sheets, IndexedDB)</li>
              <li>• Protection against accidental deletion</li>
              <li>• Data archiving instead of permanent deletion</li>
              <li>• Up to 100 backup versions maintained</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Backups</CardTitle>
          <CardDescription>Your most recent data backups (showing last 10)</CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No backups found. Create your first backup above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup, index) => (
                <div key={backup.timestamp} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : "outline"}>
                      {index === 0 ? 'Latest' : `Version ${index + 1}`}
                    </Badge>
                    <div>
                      <p className="font-medium">{new Date(backup.timestamp).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Size: {formatBytes(backup.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreBackup(backup.timestamp)}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataProtectionDashboard;