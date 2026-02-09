
-- =============================================
-- Fix 1: user_mfa_settings - remove admin SELECT (secrets exposure), fix RESTRICTIVE→PERMISSIVE
-- =============================================
DROP POLICY IF EXISTS "Users can view own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Admins can view all MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users can insert own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users can update own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Admins can update MFA settings" ON public.user_mfa_settings;

-- Users can view own MFA settings (permissive, authenticated only)
CREATE POLICY "Users can view own MFA settings"
ON public.user_mfa_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert own MFA settings
CREATE POLICY "Users can insert own MFA settings"
ON public.user_mfa_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own MFA settings
CREATE POLICY "Users can update own MFA settings"
ON public.user_mfa_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admin update only (no admin SELECT - secrets must stay hidden)
CREATE POLICY "Admins can update MFA settings"
ON public.user_mfa_settings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Safe RPC for reading MFA info without exposing secrets
CREATE OR REPLACE FUNCTION public.get_my_mfa_info()
RETURNS TABLE(mfa_type text, is_verified boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mfa_type, is_verified
  FROM public.user_mfa_settings
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- =============================================
-- Fix 2: user_invitations - fix RESTRICTIVE→PERMISSIVE, add authenticated
-- =============================================
DROP POLICY IF EXISTS "Admins can create invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can view invitations" ON public.user_invitations;

CREATE POLICY "Admins can create invitations"
ON public.user_invitations FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete invitations"
ON public.user_invitations FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update invitations"
ON public.user_invitations FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view invitations"
ON public.user_invitations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- Fix 3: user_roles - fix RESTRICTIVE→PERMISSIVE, add authenticated
-- =============================================
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
