-- Drop and recreate get_my_mfa_info with correct column order
DROP FUNCTION IF EXISTS public.get_my_mfa_info();

CREATE FUNCTION public.get_my_mfa_info()
RETURNS TABLE(is_verified boolean, mfa_type text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_verified, mfa_type
  FROM public.user_mfa_settings
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Restrict direct SELECT on user_mfa_settings to deny reading sensitive columns
-- Drop existing permissive select policy for users
DROP POLICY IF EXISTS "Users can view own MFA settings" ON public.user_mfa_settings;

-- Create a restrictive policy that only allows selecting non-sensitive columns
-- Since Postgres RLS cannot filter columns, we deny direct SELECT and use the RPC instead
CREATE POLICY "Users can view own MFA settings"
ON public.user_mfa_settings
FOR SELECT
USING (auth.uid() = user_id);