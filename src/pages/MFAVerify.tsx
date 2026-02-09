import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const MFAVerify = () => {
  const { user, session, mfaRequired, mfaVerified, setMfaVerified, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaType, setMfaType] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc('get_my_mfa_info')
      .then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data;
        setMfaType(row?.mfa_type ?? null);
      });
  }, [user]);

  // Send email code when MFA type is email
  useEffect(() => {
    if (mfaType === 'email' && !emailSent && user && session) {
      sendEmailCode();
    }
  }, [mfaType, user, session]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (!mfaRequired || mfaVerified) return <Navigate to="/" replace />;

  const sendEmailCode = async () => {
    try {
      const response = await supabase.functions.invoke('send-mfa-code', {
        body: { userId: user!.id },
      });
      if (response.error) throw response.error;
      setEmailSent(true);
      toast({ title: 'Kód elküldve', description: 'Ellenőrizd az email fiókodat.' });
    } catch (error: any) {
      toast({
        title: 'Hiba',
        description: error?.message || 'Nem sikerült elküldeni a kódot. Ellenőrizd, hogy be van-e állítva az email szolgáltatás.',
        variant: 'destructive',
      });
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('verify-mfa', {
        body: { userId: user!.id, code, mfaType },
      });
      if (response.error) throw response.error;
      const data = response.data as { verified?: boolean; error?: string };
      if (data.verified) {
        setMfaVerified(true);
        navigate('/');
      } else {
        toast({ title: 'Hibás kód', description: data.error || 'Próbáld újra.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Hiba', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <CardTitle>Kétlépcsős azonosítás</CardTitle>
          <CardDescription>
            {mfaType === 'email'
              ? 'Add meg az emailben kapott 6 jegyű kódot'
              : 'Add meg az Authenticator alkalmazásból a 6 jegyű kódot'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button onClick={handleVerify} className="w-full" disabled={loading || code.length !== 6}>
            {loading ? 'Ellenőrzés...' : 'Megerősítés'}
          </Button>

          {mfaType === 'email' && (
            <Button variant="ghost" className="w-full" onClick={sendEmailCode}>
              Kód újraküldése
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MFAVerify;
