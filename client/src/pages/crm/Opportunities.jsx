import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Add, Search } from '@mui/icons-material';
import { opportunitiesApi, accountsApi } from '@/api/crm';
import { usersApi } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatCurrency, formatDate, STAGE_LABELS, STAGE_COLORS } from '@/lib/utils';
import { toast } from '@/hooks/useToast';

const STAGES = ['qualification', 'proposal', 'negotiation', 'contract_sent', 'won', 'lost'];

export default function Opportunities() {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', account: '', stage: 'qualification', value: '', expectedCloseDate: '', serviceType: 'new_development', assignedTo: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities', { search, stage }],
    queryFn: () => opportunitiesApi.list({ search: search || undefined, stage: stage || undefined }),
  });

  const { data: accData } = useQuery({ queryKey: ['accounts-list'], queryFn: () => accountsApi.list({ limit: 100 }) });
  const { data: bdeData } = useQuery({ queryKey: ['users-bde'], queryFn: () => usersApi.list({ role: 'bde' }) });

  const createMutation = useMutation({
    mutationFn: opportunitiesApi.create,
    onSuccess: () => { qc.invalidateQueries(['opportunities']); setShowForm(false); toast({ title: 'Opportunity created' }); },
  });

  const opps = data?.data || [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Opportunities"
        description="Track deals and proposals"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/sales-funnel">Funnel View</Link></Button>
            <Button onClick={() => setShowForm(true)}><Add className="h-4 w-4 mr-2" />Add Opportunity</Button>
          </div>
        }
      />

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={stage || 'all'} onValueChange={v => setStage(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-2">
          {opps.map(opp => (
            <Card key={opp._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link to={`/opportunities/${opp._id}`} className="font-semibold text-sm hover:text-primary">{opp.title}</Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{opp.account?.name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(opp.value)}</p>
                      <p className="text-xs text-muted-foreground">{opp.probability}% probability</p>
                    </div>
                    <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: STAGE_COLORS[opp.stage] }} />
                    <div className="min-w-24">
                      <p className="text-xs font-medium" style={{ color: STAGE_COLORS[opp.stage] }}>{STAGE_LABELS[opp.stage]}</p>
                      {opp.expectedCloseDate && <p className="text-xs text-muted-foreground">Close: {formatDate(opp.expectedCloseDate)}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {opps.length === 0 && <div className="text-center py-12 text-muted-foreground">No opportunities found</div>}
        </div>
      )}

      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Opportunity</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div>
                <Label>Account *</Label>
                <Select value={form.account} onValueChange={v => setForm(p => ({ ...p, account: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>{(accData?.data || []).map(a => <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Stage</Label>
                  <Select value={form.stage} onValueChange={v => setForm(p => ({ ...p, stage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.slice(0, 4).map(s => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Service Type</Label>
                  <Select value={form.serviceType} onValueChange={v => setForm(p => ({ ...p, serviceType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['new_development', 'modification', 'maintenance', 'support', 'consulting'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Value (INR)</Label><Input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} /></div>
                <div><Label>Expected Close Date</Label><Input type="date" value={form.expectedCloseDate} onChange={e => setForm(p => ({ ...p, expectedCloseDate: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Assigned BDE</Label>
                <Select value={form.assignedTo} onValueChange={v => setForm(p => ({ ...p, assignedTo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select BDE" /></SelectTrigger>
                  <SelectContent>{(bdeData?.data || []).map(u => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.account || createMutation.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
