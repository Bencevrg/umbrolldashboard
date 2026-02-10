import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import umbrollLogo from '@/assets/umbroll-logo.png';
import { validatePassword, PASSWORD_REQUIREMENTS } from '@/lib/passwordValidation';

interface InvitationData {
  id: string;
  email: string;
  role: string;
}

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    supabase.rpc('get_invitation_by_token', { _token: token })
      .then(({ data, error }) => {
        if (error || !data || (data as any[]).length === 0) {
          setInvitation(null);
        } else {
          const inv = (data as any[])[0];
          setInvitation({ id: inv.id, email: inv.email, role: inv.role });
        }
        setLoading(false);
      });
  }, [token]);

  const passwordCheck = validatePassword(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !token) return;
    if (!passwordCheck.isValid) return;
    setSubmitting(true);

    try {
      // Register the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpError) throw signUpError;

      // Mark invitation as used via edge function (it also assigns role)
      const { error: fnError } = await supabase.functions.invoke('invite-user', {
        body: {
          action: 'accept',
          token,
          userId: signUpData.user?.id,
        },
      });
      if (fnError) {
        console.warn('Could not auto-assign role:', fnError);
      }

      toast({
        title: 'Regisztráció sikeres',
        description: 'Kérjük, erősítsd meg az email címedet a kiküldött linkkel.',
      });
      navigate('/auth');
    } catch (error: any) {
      toast({ title: 'Hiba', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!token || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <img src={umbrollLogo} alt="Umbroll" className="mx-auto mb-4 h-14" />
            <CardTitle>Érvénytelen meghívó</CardTitle>
            <CardDescription>Ez a meghívó link érvénytelen vagy lejárt.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/auth')}>
              Bejelentkezés
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <img src={umbrollLogo} alt="Umbroll" className="mx-auto mb-4 h-14" />
          <CardTitle>Meghívó elfogadása</CardTitle>
          <CardDescription>
            Meghívást kaptál <span className="font-semibold">{invitation.role}</span> szerepkörrel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Input type="email" value={invitation.email} disabled className="bg-muted" />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Válassz jelszót"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground mt-1">{PASSWORD_REQUIREMENTS}</p>
              {password.length > 0 && !passwordCheck.isValid && (
                <ul className="text-xs text-destructive mt-1 list-disc list-inside">
                  {passwordCheck.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !passwordCheck.isValid}>
              {submitting ? 'Regisztráció...' : 'Fiók létrehozása'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
