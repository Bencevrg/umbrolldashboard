import { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'user';

interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  isApproved: boolean;
  mfaVerified: boolean;
  mfaRequired: boolean;
  mfaConfigured: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  setMfaVerified: (v: boolean) => void;
  refreshRole: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    role: null,
    isApproved: false,
    mfaVerified: false,
    mfaRequired: false,
    mfaConfigured: false,
    loading: true,
  });

  const fetchRole = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const role = (data?.role as AppRole) ?? null;
      const isApproved = !!data;

      // Check MFA settings via safe RPC (doesn't expose secrets)
      const { data: mfa } = await supabase.rpc('get_my_mfa_info');
      const mfaRow = Array.isArray(mfa) ? mfa[0] : mfa;
      const mfaRequired = !!mfaRow?.is_verified;

      setState(prev => ({
        ...prev,
        role,
        isApproved,
        mfaRequired,
        mfaConfigured: mfaRequired,
        loading: false,
      }));
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const refreshRole = useCallback(async () => {
    if (state.user) await fetchRole(state.user.id);
  }, [state.user, fetchRole]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          mfaVerified: !session ? false : prev.mfaVerified,
        }));
        if (session?.user) {
          // Use setTimeout to avoid deadlock with Supabase auth
          setTimeout(() => fetchRole(session.user.id), 0);
        } else {
          setState(prev => ({
            ...prev,
            role: null,
            isApproved: false,
            mfaRequired: false,
            mfaConfigured: false,
            mfaVerified: false,
            loading: false,
          }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null }));
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      session: null,
      user: null,
      role: null,
      isApproved: false,
      mfaVerified: false,
      mfaRequired: false,
      mfaConfigured: false,
      loading: false,
    });
  }, []);

  const setMfaVerified = useCallback((v: boolean) => {
    setState(prev => ({ ...prev, mfaVerified: v }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signOut, setMfaVerified, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};
