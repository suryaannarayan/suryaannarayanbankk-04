import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleSheetsService, GoogleSheetsUtils } from '@/services/googleSheetsService';
import { GoogleSheetsBankService } from '@/services/googleSheetsBankService';
import { toast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, Eye, Edit, Plus, Upload, Database } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useBank } from '@/context/BankContext';
import GoogleSheetsStatus from '@/components/ui/GoogleSheetsStatus';

const GoogleSheetsIntegration = () => {
  const [spreadsheetId, setSpreadsheetId] = useState('1aQ03-kaMJeQyyqVICBOLZO0UZxBOf4vbPLuc_9SnpO8');
  const [range, setRange] = useState('Sheet1!A1:C10');
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [data, setData] = useState<any[][]>([]);
  const [writeData, setWriteData] = useState('');
  const { isGoogleSheetsMode } = useBank();

  const handleReadSheet = async () => {
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
      setData(result.values || []);
      toast({
        title: "Success",
        description: "Data read from Google Sheets successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to read from Google Sheets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWriteSheet = async () => {
    if (!spreadsheetId || !range || !writeData) {
      toast({
        title: "Error",
        description: "Please provide Spreadsheet ID, Range, and Data",
        variant: "destructive"
      });
      return;
    }

    try {
      const parsedData = JSON.parse(writeData);
      const values = Array.isArray(parsedData[0]) ? parsedData : [parsedData];
      
      setIsLoading(true);
      await GoogleSheetsService.writeSheet(spreadsheetId, range, values);
      toast({
        title: "Success",
        description: "Data written to Google Sheets successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to write to Google Sheets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateData = async () => {
    setIsMigrating(true);
    try {
      await GoogleSheetsBankService.migrateFromLocalStorage();
      toast({
        title: "Migration Successful",
        description: "All data has been migrated to Google Sheets"
      });
    } catch (error: any) {
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to migrate data to Google Sheets",
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <MainLayout>
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

        <div className="grid gap-4 md:grid-cols-2">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Banking Data Sync:</strong> Your app is now configured to use Google Sheets as the backend database. 
              All user data, transactions, and balances are automatically synced to the connected Google Sheet.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Data Migration
              </CardTitle>
              <CardDescription>
                Migrate existing local data to Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleMigrateData} 
                disabled={isMigrating}
                className="w-full"
                variant={isGoogleSheetsMode ? "secondary" : "default"}
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {isGoogleSheetsMode ? "Re-sync Data" : "Migrate to Google Sheets"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Setup Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Go to <a href="https://console.cloud.google.com/" className="text-primary underline" target="_blank">Google Cloud Console</a></li>
              <li>Create a new project or select existing one</li>
              <li>Enable Google Sheets API</li>
              <li>Create credentials (API Key) for Google Sheets API</li>
              <li>Add the API key to Supabase secrets as GOOGLE_SHEETS_API_KEY</li>
              <li>Make your Google Sheet public or share it with the service account</li>
            </ol>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Sheet Configuration</CardTitle>
            <CardDescription>Configure your Google Sheet connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="spreadsheetId">Spreadsheet ID</Label>
              <Input
                id="spreadsheetId"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Found in the URL: https://docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
              </p>
            </div>
            
            <div>
              <Label htmlFor="range">Range (A1 Notation)</Label>
              <Input
                id="range"
                placeholder="Sheet1!A1:C10"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Examples: Sheet1!A1:C10, Data!A:Z, Sheet1!A1:C
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="read" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="read" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Read Data
            </TabsTrigger>
            <TabsTrigger value="write" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Write Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="read" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Read from Google Sheets</CardTitle>
                <CardDescription>Fetch data from your Google Sheet</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleReadSheet} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reading...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Read Data
                    </>
                  )}
                </Button>

                {data.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Retrieved Data:</h3>
                    <div className="border rounded-lg overflow-auto max-h-96">
                      <table className="w-full">
                        <tbody>
                          {data.map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex === 0 ? 'bg-muted' : ''}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="border-b border-r p-2 text-sm">
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
                <CardDescription>Send data to your Google Sheet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="writeData">Data (JSON Format)</Label>
                  <Textarea
                    id="writeData"
                    placeholder='[["Name", "Age", "City"], ["John", "25", "New York"], ["Jane", "30", "Los Angeles"]]'
                    value={writeData}
                    onChange={(e) => setWriteData(e.target.value)}
                    rows={8}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter data as a 2D array in JSON format. Each inner array represents a row.
                  </p>
                </div>

                <Button 
                  onClick={handleWriteSheet} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Writing...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Write Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>API Key Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold">Step 1: Google Cloud Console</h4>
                <p>1. Go to <a href="https://console.cloud.google.com/" className="text-primary underline" target="_blank">Google Cloud Console</a></p>
                <p>2. Create a new project or select an existing one</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Step 2: Enable Google Sheets API</h4>
                <p>1. Go to "APIs & Services" → "Library"</p>
                <p>2. Search for "Google Sheets API"</p>
                <p>3. Click "Enable"</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Step 3: Create API Key</h4>
                <p>1. Go to "APIs & Services" → "Credentials"</p>
                <p>2. Click "Create Credentials" → "API Key"</p>
                <p>3. Copy the generated API key</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Step 4: Add to Supabase</h4>
                <p>1. Go to your Supabase project settings</p>
                <p>2. Navigate to Edge Functions → Secrets</p>
                <p>3. Add a new secret named "GOOGLE_SHEETS_API_KEY"</p>
                <p>4. Paste your API key as the value</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Step 5: Sheet Permissions</h4>
                <p>Make sure your Google Sheet is either:</p>
                <p>• Public (Anyone with the link can view)</p>
                <p>• Or shared with the service account email</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default GoogleSheetsIntegration;