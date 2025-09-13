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

  // Don't show the status badge at all
  return null;
};

export default GoogleSheetsStatus;