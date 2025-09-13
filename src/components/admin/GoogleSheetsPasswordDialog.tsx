import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GoogleSheetsPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const GoogleSheetsPasswordDialog: React.FC<GoogleSheetsPasswordDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current password from database
      const { data: settings, error: fetchError } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'google_sheets_password')
        .single();

      if (fetchError) throw fetchError;

      if (currentPassword !== settings.setting_value) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive"
        });
        return;
      }

      if (newPassword.length < 6) {
        toast({
          title: "Error",
          description: "New password must be at least 6 characters",
          variant: "destructive"
        });
        return;
      }

      // Update password
      const { error: updateError } = await supabase
        .from('admin_settings')
        .update({ setting_value: newPassword })
        .eq('setting_key', 'google_sheets_password');

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Google Sheets password updated successfully",
      });

      setCurrentPassword('');
      setNewPassword('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Google Sheets Password</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleSheetsPasswordDialog;