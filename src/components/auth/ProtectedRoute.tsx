import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isApproved, mfaRequired, mfaVerified, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (!isApproved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Hozzáférés függőben</h2>
          <p className="text-muted-foreground mb-6">A fiókod még nem lett jóváhagyva. Kérjük, várd meg az admin jóváhagyását.</p>
          <Button variant="outline" onClick={() => signOut()}>Kijelentkezés</Button>
        </div>
      </div>
    );
  }
  if (mfaRequired && !mfaVerified) return <Navigate to="/mfa-verify" replace />;

  return <>{children}</>;
};
