import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CloudIcon, HardDriveIcon } from 'lucide-react';
import { useBank } from '@/context/BankContext';

interface GoogleSheetsStatusProps {
  isConnected?: boolean;
}

const GoogleSheetsStatus: React.FC<GoogleSheetsStatusProps> = ({ isConnected }) => {
  const { isGoogleSheetsMode } = useBank();
  
  // Use prop if provided, otherwise use context
  const connected = isConnected !== undefined ? isConnected : isGoogleSheetsMode;

  return (
    <Badge 
      variant={connected ? "default" : "secondary"} 
      className="flex items-center gap-1"
    >
      {connected ? (
        <>
          <CloudIcon className="h-3 w-3" />
          Cloud Synced
        </>
      ) : (
        <>
          <HardDriveIcon className="h-3 w-3" />
          Local Only
        </>
      )}
    </Badge>
  );
};

export default GoogleSheetsStatus;