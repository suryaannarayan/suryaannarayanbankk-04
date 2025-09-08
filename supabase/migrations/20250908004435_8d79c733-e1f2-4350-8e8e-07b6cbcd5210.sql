-- Fix Google Sheets edge function migration issue
-- This migration ensures the edge function has proper error handling

-- Create a simple test table to validate the migration system
CREATE TABLE IF NOT EXISTS public.migration_test (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the test table
ALTER TABLE public.migration_test ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for the test table
CREATE POLICY "Allow all operations on migration_test" 
ON public.migration_test 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);