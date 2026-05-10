import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { ROLE_LABELS } from '@/lib/utils';
import { toast } from '@/hooks/useToast';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', designation: user?.designation || '', githubUsername: user?.githubUsername || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const profileMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (data) => { setUser(data); toast({ title: 'Profile updated' }); },
  });

  const pwdMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => { toast({ title: 'Password changed' }); setPwdForm({ currentPassword: '', newPassword: '', confirm: '' }); },
    onError: (e) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Profile" description="Manage your personal information" />

      <Card>
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-primary font-medium mt-0.5">{ROLE_LABELS[user?.role]}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Full Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} /></div>
            <div><Label>GitHub Username</Label><Input value={form.githubUsername} onChange={e => setForm(p => ({ ...p, githubUsername: e.target.value }))} placeholder="github_handle" /></div>
          </div>
          <Button onClick={() => profileMutation.mutate(form)} disabled={profileMutation.isPending}>
            {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Current Password</Label><Input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))} /></div>
          <div><Label>New Password</Label><Input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))} /></div>
          <div><Label>Confirm New Password</Label><Input type="password" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} /></div>
          <Button
            onClick={() => {
              if (pwdForm.newPassword !== pwdForm.confirm) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }
              pwdMutation.mutate({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
            }}
            disabled={!pwdForm.currentPassword || !pwdForm.newPassword || pwdMutation.isPending}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
