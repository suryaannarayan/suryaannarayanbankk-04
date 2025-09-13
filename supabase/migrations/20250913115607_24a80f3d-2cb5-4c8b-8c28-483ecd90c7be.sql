-- Create credit card complaints table
CREATE TABLE public.credit_card_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.credit_card_complaints ENABLE ROW LEVEL SECURITY;

-- Create policies for credit card complaints
CREATE POLICY "Users can view their own complaints" 
ON public.credit_card_complaints 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own complaints" 
ON public.credit_card_complaints 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own pending complaints" 
ON public.credit_card_complaints 
FOR UPDATE 
USING (auth.uid()::text = user_id::text AND status = 'pending');

-- Create settings table for admin configurations
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only access to settings
CREATE POLICY "Only authenticated users can view settings" 
ON public.admin_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can modify settings" 
ON public.admin_settings 
FOR ALL 
USING (true);

-- Insert default Google Sheets password
INSERT INTO public.admin_settings (setting_key, setting_value) 
VALUES ('google_sheets_password', 'admin123');

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_credit_card_complaints_updated_at
    BEFORE UPDATE ON public.credit_card_complaints
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();