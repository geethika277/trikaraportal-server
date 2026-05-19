import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Add, Search, Email, Phone } from '@mui/icons-material';
import { contactsApi, accountsApi } from '@/api/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { toast } from '@/hooks/useToast';

export default function Contacts() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ account: '', name: '', email: '', phone: '', designation: '', department: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', { search }],
    queryFn: () => contactsApi.list({ search: search || undefined }),
  });

  const { data: accountsData } = useQuery({ queryKey: ['accounts-list'], queryFn: () => accountsApi.list({ limit: 100 }) });
  const accounts = accountsData?.data || [];

  const createMutation = useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => { qc.invalidateQueries(['contacts']); setShowForm(false); toast({ title: 'Contact created' }); },
  });

  const contacts = data?.data || [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contacts"
        description="People at your client accounts"
        actions={<Button onClick={() => setShowForm(true)}><Add className="h-4 w-4 mr-2" />Add Contact</Button>}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {contacts.map(c => (
            <Card key={c._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                    {c.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{c.name}{c.isPrimary && <span className="ml-1 text-xs text-primary">★</span>}</p>
                    {c.designation && <p className="text-xs text-muted-foreground">{c.designation}</p>}
                    {c.account && <Link to={`/accounts/${c.account._id}`} className="text-xs text-primary hover:underline">{c.account.name}</Link>}
                    <div className="mt-2 space-y-0.5">
                      {c.email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Email className="h-3 w-3" />{c.email}</div>}
                      {c.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</div>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {contacts.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No contacts found</div>}
        </div>
      )}

      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Account *</Label>
                <Select value={form.account} onValueChange={v => setForm(p => ({ ...p, account: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>{accounts.map(a => <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} /></div>
                <div><Label>Department</Label><Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.account || createMutation.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
