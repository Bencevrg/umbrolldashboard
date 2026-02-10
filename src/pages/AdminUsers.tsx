import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { UserPlus, Send, Trash2 } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'user';
  used: boolean;
  expires_at: string;
}

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [rolesRes, invRes] = await Promise.all([
      supabase.from('user_roles').select('*'),
      supabase.from('user_invitations').select('*').order('created_at', { ascending: false }),
    ]);
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    if (invRes.data) setInvitations(invRes.data as Invitation[]);
  };

  const sendInvite = async () => {
    if (!newEmail || !user) return;
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('invite-user', {
        body: {
          action: 'invite',
          email: newEmail,
          role: newRole,
        },
      });
      if (response.error) throw response.error;
      const data = response.data as { error?: string };
      if (data.error) throw new Error(data.error);

      toast({ title: 'Meghívó elküldve', description: `Meghívó elküldve: ${newEmail}` });
      setNewEmail('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Hiba', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteInvitation = async (id: string) => {
    await supabase.from('user_invitations').delete().eq('id', id);
    fetchData();
  };

  const updateRole = async (roleId: string, newRoleValue: 'admin' | 'user') => {
    await supabase.from('user_roles').update({ role: newRoleValue }).eq('id', roleId);
    fetchData();
    toast({ title: 'Szerep módosítva' });
  };

  return (
    <DashboardLayout activeTab="admin" onTabChange={(tab) => navigate(`/?tab=${tab}`)}>
      <div className="space-y-8">
        {/* Invite Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Felhasználó meghívása
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Input
                type="email"
                placeholder="Email cím"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="max-w-xs"
              />
              <Select value={newRole} onValueChange={(v: 'admin' | 'user') => setNewRole(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={sendInvite} disabled={loading || !newEmail}>
                <Send className="h-4 w-4 mr-2" />
                Meghívó küldése
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Section */}
        <Card>
          <CardHeader>
            <CardTitle>Felhasználók ({roles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Szerep</TableHead>
                  <TableHead>Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.user_id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant={r.role === 'admin' ? 'default' : 'secondary'}>{r.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={r.role}
                        onValueChange={(v: 'admin' | 'user') => updateRole(r.id, v)}
                        disabled={r.user_id === user?.id}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Invitations Section */}
        <Card>
          <CardHeader>
            <CardTitle>Meghívók ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Szerep</TableHead>
                  <TableHead>Státusz</TableHead>
                  <TableHead>Lejárat</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant={inv.role === 'admin' ? 'default' : 'secondary'}>{inv.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.used ? 'secondary' : 'outline'}>
                        {inv.used ? 'Felhasználva' : 'Aktív'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(inv.expires_at).toLocaleDateString('hu-HU')}
                    </TableCell>
                    <TableCell>
                      {!inv.used && (
                        <Button variant="ghost" size="icon" onClick={() => deleteInvitation(inv.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
