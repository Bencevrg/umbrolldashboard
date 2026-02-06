-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create user_invitations table
CREATE TABLE public.user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on user_invitations
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create user_mfa_settings table
CREATE TABLE public.user_mfa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  mfa_type text CHECK (mfa_type IN ('totp', 'email')) DEFAULT 'email',
  is_verified boolean DEFAULT false,
  totp_secret text,
  email_code text,
  email_code_expires_at timestamptz,
  email_code_attempts int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_mfa_settings
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- Create has_role helper function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create is_approved_user helper function
CREATE OR REPLACE FUNCTION public.is_approved_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  )
$$;

-- RLS Policies for user_roles

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_invitations

-- Admins can view all invitations
CREATE POLICY "Admins can view invitations"
ON public.user_invitations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
ON public.user_invitations FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update invitations
CREATE POLICY "Admins can update invitations"
ON public.user_invitations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete invitations
CREATE POLICY "Admins can delete invitations"
ON public.user_invitations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public can check invitation by token (for accepting invites)
CREATE POLICY "Anyone can check invitation by token"
ON public.user_invitations FOR SELECT
TO anon
USING (true);

-- RLS Policies for user_mfa_settings

-- Users can view their own MFA settings
CREATE POLICY "Users can view own MFA settings"
ON public.user_mfa_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own MFA settings
CREATE POLICY "Users can insert own MFA settings"
ON public.user_mfa_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own MFA settings
CREATE POLICY "Users can update own MFA settings"
ON public.user_mfa_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all MFA settings
CREATE POLICY "Admins can view all MFA settings"
ON public.user_mfa_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update MFA settings (for reset)
CREATE POLICY "Admins can update MFA settings"
ON public.user_mfa_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updating updated_at on user_mfa_settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_mfa_settings_updated_at
BEFORE UPDATE ON public.user_mfa_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();