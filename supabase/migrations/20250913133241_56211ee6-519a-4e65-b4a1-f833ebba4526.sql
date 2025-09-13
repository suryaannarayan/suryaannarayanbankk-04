-- Fix security warning: Set search_path for security definer function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Restrict to specific admin emails (replace with proper role-based system in production)
  RETURN auth.jwt() ->> 'email' IN (
    'suryaannarayan@gmail.com',
    'admin@example.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;