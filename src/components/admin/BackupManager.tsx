import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Database, FileArchive, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';

const BackupManager = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Export all bank data as a ZIP file
   */
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      
      // Get all data from localStorage
      const users = localStorage.getItem('suryabank_users') || '[]';
      const transactions = localStorage.getItem('suryabank_transactions') || '[]';
      const creditCards = localStorage.getItem('credit_cards') || '[]';
      const coupons = localStorage.getItem('user_coupons') || '[]';
      const premiumApplications = localStorage.getItem('premium_applications') || '[]';
      const cardBalances = localStorage.getItem('credit_card_balances') || '{}';
      const accountRequests = localStorage.getItem('account_number_requests') || '[]';

      // Add metadata
      const metadata = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalUsers: JSON.parse(users).length,
        totalTransactions: JSON.parse(transactions).length,
        totalCreditCards: JSON.parse(creditCards).length,
        totalCoupons: JSON.parse(coupons).length,
        totalPremiumApplications: JSON.parse(premiumApplications).length
      };

      // Add files to ZIP
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));
      zip.file('users.json', JSON.stringify(JSON.parse(users), null, 2));
      zip.file('transactions.json', JSON.stringify(JSON.parse(transactions), null, 2));
      zip.file('credit_cards.json', JSON.stringify(JSON.parse(creditCards), null, 2));
      zip.file('coupons.json', JSON.stringify(JSON.parse(coupons), null, 2));
      zip.file('premium_applications.json', JSON.stringify(JSON.parse(premiumApplications), null, 2));
      zip.file('card_balances.json', JSON.stringify(JSON.parse(cardBalances), null, 2));
      zip.file('account_requests.json', JSON.stringify(JSON.parse(accountRequests), null, 2));

      // Generate ZIP file
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `surya-bank-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Backup Exported Successfully",
        description: `All bank data has been exported to a ZIP file`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export backup data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Import backup data from a ZIP file
   */
  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('This will overwrite all current data. Are you sure you want to import this backup?')) {
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);

      // Read metadata first
      const metadataFile = contents.file('metadata.json');
      if (!metadataFile) {
        throw new Error('Invalid backup file: metadata.json not found');
      }
      
      const metadata = JSON.parse(await metadataFile.async('text'));
      console.log('Importing backup from:', metadata.exportDate);

      // Import each data file
      const dataFiles = [
        { key: 'suryabank_users', file: 'users.json' },
        { key: 'suryabank_transactions', file: 'transactions.json' },
        { key: 'credit_cards', file: 'credit_cards.json' },
        { key: 'user_coupons', file: 'coupons.json' },
        { key: 'premium_applications', file: 'premium_applications.json' },
        { key: 'credit_card_balances', file: 'card_balances.json' },
        { key: 'account_number_requests', file: 'account_requests.json' }
      ];

      let importedCount = 0;
      for (const { key, file: filename } of dataFiles) {
        const dataFile = contents.file(filename);
        if (dataFile) {
          const data = await dataFile.async('text');
          localStorage.setItem(key, data);
          importedCount++;
        }
      }

      toast({
        title: "Backup Imported Successfully",
        description: `Successfully imported ${importedCount} data sets from backup`,
      });

      // Reload the page to reflect imported data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import backup data",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileArchive className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Backup Manager</h1>
          <p className="text-muted-foreground">Export and import complete bank data backups</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Backup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Backup
            </CardTitle>
            <CardDescription>
              Download all bank data as a ZIP file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">What's included:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All user accounts and balances</li>
                <li>• Complete transaction history</li>
                <li>• Credit card information</li>
                <li>• Coupons and premium applications</li>
                <li>• Account requests and settings</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleExportBackup} 
              disabled={isExporting}
              className="w-full"
              size="lg"
            >
              <Database className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Backup as ZIP'}
            </Button>
          </CardContent>
        </Card>

        {/* Import Backup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Backup
            </CardTitle>
            <CardDescription>
              Restore data from a previous backup ZIP file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Warning</h4>
                  <p className="text-sm text-orange-800">
                    Importing a backup will <strong>overwrite all current data</strong>. 
                    Make sure to export a backup of your current data before importing.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="file"
                accept=".zip"
                onChange={handleImportBackup}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="backup-import"
              />
              <Button 
                disabled={isImporting}
                className="w-full"
                size="lg"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Importing...' : 'Select ZIP File to Import'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Export backups regularly, especially before making major changes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Store backup files in a secure location (external drive, cloud storage)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Test your backups periodically to ensure they can be restored</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Keep multiple backup versions from different dates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>The backup ZIP file is compatible across different browsers and devices</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupManager;
