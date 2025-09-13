-- Fix function search path security warnings

-- Update is_admin_user function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Update audit trigger function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;