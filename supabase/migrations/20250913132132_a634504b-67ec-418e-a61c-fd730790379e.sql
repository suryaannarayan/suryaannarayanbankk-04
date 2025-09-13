-- Fix critical security vulnerability: Restrict admin_settings access to admin users only

-- First, drop the overly permissive existing policies
DROP POLICY IF EXISTS "Only authenticated users can view settings" ON admin_settings;
DROP POLICY IF EXISTS "Only authenticated users can modify settings" ON admin_settings;

-- Create a security definer function to check if current user is admin
-- Since the current system uses localStorage for admin status, we'll create a more secure approach
-- by checking against specific admin user IDs or emails
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, we'll restrict to specific admin emails
  -- In production, this should be replaced with proper role-based system
  RETURN auth.jwt() ->> 'email' IN (
    'suryaannarayan@gmail.com',
    'admin@example.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create restrictive RLS policies for admin_settings
CREATE POLICY "Only admin users can view admin settings"
ON admin_settings
FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "Only admin users can modify admin settings"
ON admin_settings
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Add audit logging for admin_settings access
CREATE TABLE IF NOT EXISTS public.admin_settings_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  setting_key TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit table
ALTER TABLE public.admin_settings_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admin users can view audit logs"
ON admin_settings_audit
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION public.audit_admin_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_settings_audit (
      user_id, user_email, action, setting_key, new_value
    ) VALUES (
      auth.uid(),
      auth.jwt() ->> 'email',
      'INSERT',
      NEW.setting_key,
      NEW.setting_value
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.admin_settings_audit (
      user_id, user_email, action, setting_key, old_value, new_value
    ) VALUES (
      auth.uid(),
      auth.jwt() ->> 'email',
      'UPDATE',
      NEW.setting_key,
      OLD.setting_value,
      NEW.setting_value
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_settings_audit (
      user_id, user_email, action, setting_key, old_value
    ) VALUES (
      auth.uid(),
      auth.jwt() ->> 'email',
      'DELETE',
      OLD.setting_key,
      OLD.setting_value
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging
CREATE TRIGGER audit_admin_settings
  AFTER INSERT OR UPDATE OR DELETE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_admin_settings_changes();