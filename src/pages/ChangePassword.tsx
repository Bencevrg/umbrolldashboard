import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { validatePassword, PASSWORD_REQUIREMENTS } from '@/lib/passwordValidation';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const check = validatePassword(newPassword);
    if (!check.isValid) {
      setError(check.errors.join(', '));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Az új jelszavak nem egyeznek.');
      return;
    }

    setLoading(true);

    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? '',
        password: currentPassword,
      });

      if (signInError) {
        setError('A jelenlegi jelszó helytelen.');
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch {
      setError('Hiba történt a jelszó változtatás során.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>Jelszó változtatás</CardTitle>
          </div>
          <CardDescription>Add meg a jelenlegi jelszavadat, majd válassz egy újat.</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Jelszó sikeresen megváltoztatva! Átirányítás...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Jelenlegi jelszó</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Új jelszó</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">{PASSWORD_REQUIREMENTS}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Új jelszó megerősítése</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Vissza
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Változtatás...' : 'Jelszó változtatás'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePassword;
