import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CloudIcon, HardDriveIcon } from 'lucide-react';
import { useBank } from '@/context/BankContext';

const GoogleSheetsStatus = () => {
  const { isGoogleSheetsMode } = useBank();

  return (
    <Badge 
      variant={isGoogleSheetsMode ? "default" : "secondary"} 
      className="flex items-center gap-1"
    >
      {isGoogleSheetsMode ? (
        <>
          <CloudIcon className="h-3 w-3" />
          Google Sheets
        </>
      ) : (
        <>
          <HardDriveIcon className="h-3 w-3" />
          Local Storage
        </>
      )}
    </Badge>
  );
};

export default GoogleSheetsStatus;