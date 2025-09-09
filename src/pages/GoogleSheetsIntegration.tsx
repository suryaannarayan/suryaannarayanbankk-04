import React, { useState, useEffect } from 'react';
import { GoogleSheetsService } from '@/services/googleSheetsService';
import { GoogleSheetsBankService } from '@/services/googleSheetsBankService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSpreadsheet, Info, Upload, Download, Database, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import GoogleSheetsStatus from '@/components/ui/GoogleSheetsStatus';
import AdminPasswordDialog from '@/components/AdminPasswordDialog';
import { useAuth } from '@/context/AuthContext';

const GoogleSheetsIntegration = () => {
  const [spreadsheetId, setSpreadsheetId] = useState('1aQ03-kaMJeQyyqVICBOLZO0UZxBOf4vbPLuc_9SnpO8');
  const [range, setRange] = useState('Sheet1!A1:C10');
  const [writeData, setWriteData] = useState('');
  const [readData, setReadData] = useState<any[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is admin and show password dialog if needed
    if (user && user.isAdmin && !hasAdminAccess) {
      setShowPasswordDialog(true);
    }
  }, [user, hasAdminAccess]);

  const handleAdminSuccess = () => {
    setHasAdminAccess(true);
  };

  const handleReadSheet = async () => {
    if (!hasAdminAccess) {
      setShowPasswordDialog(true);
      return;
    }

    if (!spreadsheetId || !range) {
      toast({
        title: "Error",
        description: "Please provide both Spreadsheet ID and Range",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await GoogleSheetsService.readSheet(spreadsheetId, range);
      setReadData(result.values || []);
      toast({
        title: "Success",
        description: "Data read from Google Sheets successfully"
      });
    } catch (error: any) {
      console.error('Read error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to read from Google Sheets. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWriteSheet = async () => {
    if (!hasAdminAccess) {
      setShowPasswordDialog(true);
      return;
    }

    if (!spreadsheetId || !range || !writeData) {
      toast({
        title: "Error",
        description: "Please provide Spreadsheet ID, Range, and Data",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const parsedData = JSON.parse(writeData);
      await GoogleSheetsService.writeSheet(spreadsheetId, range, parsedData);
      toast({
        title: "Success",
        description: "Data written to Google Sheets successfully"
      });
    } catch (error: any) {
      console.error('Write error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to write to Google Sheets. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateData = async () => {
    if (!hasAdminAccess) {
      setShowPasswordDialog(true);
      return;
    }

    setIsMigrating(true);
    try {
      await GoogleSheetsBankService.migrateFromLocalStorage();
      toast({
        title: "Migration Successful",
        description: "All data has been migrated to Google Sheets. New data will now sync automatically."
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to migrate data to Google Sheets. Running in offline mode with local storage.",
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  };

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

  if (!user.isAdmin) {
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

  return (
    <MainLayout>
      <AdminPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={handleAdminSuccess}
      />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Google Sheets Integration</h1>
              <p className="text-muted-foreground">Connect and sync data with Google Sheets</p>
            </div>
          </div>
          <GoogleSheetsStatus />
        </div>

        {hasAdminAccess && (
          <div className="grid gap-4 md:grid-cols-2">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                <strong>Data Migration:</strong> Click the button below to migrate your existing local data to Google Sheets. New data will automatically sync to Google Sheets. If migration fails, the system will continue using local storage as fallback.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button 
                onClick={handleMigrateData} 
                disabled={isMigrating}
                size="lg"
              >
                {isMigrating ? 'Migrating...' : 'Migrate & Enable Cloud Sync'}
              </Button>
            </div>
          </div>
        )}

        {!hasAdminAccess && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Please enter admin password to access Google Sheets integration features.
            </AlertDescription>
          </Alert>
        )}

        {hasAdminAccess && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Setup Instructions
                </CardTitle>
                <CardDescription>
                  Follow these steps to set up Google Sheets integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold">1. Create Google Sheets API Key</h4>
                    <p className="text-sm text-muted-foreground">
                      Go to Google Cloud Console, enable Google Sheets API, and create an API key.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">2. Configure Spreadsheet</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a Google Sheet and make it publicly viewable or add the service account as editor.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">3. Add API Key to Supabase</h4>
                    <p className="text-sm text-muted-foreground">
                      Add your Google Sheets API key to Supabase Edge Functions secrets.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">4. Test Connection</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the tools below to test reading and writing data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sheet Configuration</CardTitle>
                  <CardDescription>Configure your Google Sheet connection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="spreadsheetId">Spreadsheet ID</Label>
                    <Input
                      id="spreadsheetId"
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      placeholder="Enter Google Sheets ID"
                    />
                    <p className="text-xs text-muted-foreground">
                      Found in the URL: docs.google.com/spreadsheets/d/[ID]/edit
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="range">Range</Label>
                    <Input
                      id="range"
                      value={range}
                      onChange={(e) => setRange(e.target.value)}
                      placeholder="e.g., Sheet1!A1:C10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use A1 notation (e.g., Sheet1!A1:C10)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connection Status</CardTitle>
                  <CardDescription>Current integration status</CardDescription>
                </CardHeader>
                <CardContent>
                  <GoogleSheetsStatus />
                  <div className="mt-4 space-y-2">
                    <p className="text-sm">
                      <strong>Spreadsheet ID:</strong> {spreadsheetId}
                    </p>
                    <p className="text-sm">
                      <strong>Current Range:</strong> {range}
                    </p>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        The system automatically falls back to local storage if Google Sheets is unavailable.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="read" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="read" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Read Data
                </TabsTrigger>
                <TabsTrigger value="write" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Write Data
                </TabsTrigger>
              </TabsList>

              <TabsContent value="read" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Read from Google Sheets</CardTitle>
                    <CardDescription>Fetch data from your configured range</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={handleReadSheet} 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Reading...' : 'Read Data'}
                    </Button>
                    
                    {readData.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Retrieved Data:</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border border-border rounded-lg">
                            <tbody>
                              {readData.map((row, index) => (
                                <tr key={index} className={index === 0 ? 'bg-muted' : ''}>
                                  {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="border border-border p-2 text-sm">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="write" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Write to Google Sheets</CardTitle>
                    <CardDescription>Send data to your configured range</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="writeData">Data (JSON format)</Label>
                      <Textarea
                        id="writeData"
                        value={writeData}
                        onChange={(e) => setWriteData(e.target.value)}
                        placeholder='[["Header1", "Header2"], ["Value1", "Value2"]]'
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter data as a 2D JSON array. Each inner array represents a row.
                      </p>
                    </div>
                    <Button 
                      onClick={handleWriteSheet} 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Writing...' : 'Write Data'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default GoogleSheetsIntegration;