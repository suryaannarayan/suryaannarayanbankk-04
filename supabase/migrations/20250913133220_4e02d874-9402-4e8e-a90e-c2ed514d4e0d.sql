-- Fix critical security vulnerability: Restrict admin_settings access to admin users only

-- First, check and drop existing policies with exact names
DROP POLICY IF EXISTS "Only authenticated users can view settings" ON admin_settings;
DROP POLICY IF EXISTS "Only authenticated users can modify settings" ON admin_settings;
DROP POLICY IF EXISTS "Only admin users can view admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Only admin users can modify admin settings" ON admin_settings;

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Restrict to specific admin emails (replace with proper role-based system in production)
  RETURN auth.jwt() ->> 'email' IN (
    'suryaannarayan@gmail.com',
    'admin@example.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create restrictive RLS policies for admin_settings
CREATE POLICY "Admin only view settings"
ON admin_settings
FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "Admin only modify settings"
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
CREATE POLICY "Admin only view audit"
ON admin_settings_audit
FOR SELECT
TO authenticated
USING (public.is_admin_user());