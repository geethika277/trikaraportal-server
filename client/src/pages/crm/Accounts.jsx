import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, Globe, Mail } from 'lucide-react';
import { accountsApi } from '@/api/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/useToast';

const TIER_COLORS = { prospect: 'secondary', active: 'success', churned: 'destructive' };

export default function Accounts() {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '', website: '', email: '', phone: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', { search, tier }],
    queryFn: () => accountsApi.list({ search: search || undefined, tier: tier || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => { qc.invalidateQueries(['accounts']); setShowForm(false); toast({ title: 'Account created' }); },
  });

  const accounts = data?.data || [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Accounts"
        description="Client and prospect accounts"
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Add Account</Button>}
      />

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Tiers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Tiers</SelectItem>
            {['prospect', 'active', 'churned'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map(acc => (
            <Card key={acc._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <Link to={`/accounts/${acc._id}`} className="font-semibold text-sm hover:text-primary block truncate">{acc.name}</Link>
                      <p className="text-xs text-muted-foreground truncate">{acc.industry || 'No industry'}</p>
                    </div>
                  </div>
                  <Badge variant={TIER_COLORS[acc.tier] || 'secondary'}>{acc.tier}</Badge>
                </div>
                <div className="mt-3 space-y-1">
                  {acc.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{acc.email}</div>}
                  {acc.website && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Globe className="h-3 w-3" />{acc.website}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
          {accounts.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No accounts found</div>}
        </div>
      )}

      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Account</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} /></div>
              <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
