import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { formatDate, ROLE_LABELS } from '@/lib/utils';
import { Plus, UserX, Search } from 'lucide-react';
import { toast } from '@/hooks/useToast';

const ROLES = ['superadmin', 'project_manager', 'developer', 'tester', 'bde', 'accounting'];
const ROLE_COLORS = { superadmin: 'destructive', project_manager: 'info', developer: 'default', tester: 'warning', bde: 'success', accounting: 'secondary' };

export default function Users() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: 'Test@123', role: 'developer', phone: '', designation: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', { search, role }],
    queryFn: () => usersApi.list({ search: search || undefined, role: role || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => { qc.invalidateQueries(['users']); setShowForm(false); toast({ title: 'User created' }); },
    onError: (e) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const deactivateMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => { qc.invalidateQueries(['users']); toast({ title: 'User deactivated' }); },
  });

  const users = data?.data || [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team Members"
        description="Manage user accounts and roles"
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Add User</Button>}
      />

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {users.map(u => (
            <Card key={u._id} className={!u.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{u.name}{!u.isActive && <span className="ml-2 text-xs text-muted-foreground">(Inactive)</span>}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    {u.designation && <p className="text-xs text-muted-foreground">{u.designation}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">Joined {formatDate(u.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={ROLE_COLORS[u.role] || 'default'}>{ROLE_LABELS[u.role]}</Badge>
                  {u.isActive && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deactivateMutation.mutate(u._id)} title="Deactivate">
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {users.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No users found</div>}
        </div>
      )}

      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Temporary Password</Label><Input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
              <div>
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.email || createMutation.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
