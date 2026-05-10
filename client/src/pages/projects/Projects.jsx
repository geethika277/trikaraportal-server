import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { projectsApi } from '@/api/projects';
import { accountsApi } from '@/api/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { formatDate, STATUS_COLORS, PRIORITY_COLORS, formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

const TYPE_LABELS = { new_development: 'New Dev', modification_fix: 'Modification', maintenance_support: 'Maintenance' };
const TYPE_COLORS = { new_development: 'bg-indigo-100 text-indigo-700', modification_fix: 'bg-orange-100 text-orange-700', maintenance_support: 'bg-teal-100 text-teal-700' };

export default function Projects() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', account: '', type: 'new_development', priority: 'medium', startDate: '', endDate: '', budget: '', description: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { search, status }],
    queryFn: () => projectsApi.list({ search: search || undefined, status: status || undefined }),
  });

  const { data: accData } = useQuery({ queryKey: ['accounts-list'], queryFn: () => accountsApi.list({ limit: 100 }) });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => { qc.invalidateQueries(['projects']); setShowForm(false); toast({ title: 'Project created' }); },
  });

  const projects = data?.data || [];
  const canCreate = ['superadmin', 'project_manager'].includes(user?.role);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Projects"
        description="Active engagements and deliveries"
        actions={canCreate && <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />New Project</Button>}
      />

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {['scoping', 'active', 'on_hold', 'completed', 'cancelled'].map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(p => (
            <Card key={p._id} className="hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: p.color || '#6366f1' }} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/projects/${p._id}`} className="font-semibold text-sm hover:text-primary block">{p.title}</Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.account?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[p.status]}`}>{p.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[p.type]}`}>{TYPE_LABELS[p.type]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[p.priority]}`}>{p.priority}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex -space-x-1">
                    {(p.team || []).slice(0, 5).map((m, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary" title={m.user?.name}>
                        {m.user?.name?.[0]}
                      </div>
                    ))}
                    {p.team?.length > 5 && <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px]">+{p.team.length - 5}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.budget > 0 && <span className="font-medium">{formatCurrency(p.budget)}</span>}
                    {p.endDate && <span>Due {formatDate(p.endDate, 'dd MMM')}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {projects.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No projects found</div>}
        </div>
      )}

      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
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
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['low', 'medium', 'high', 'critical'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
              </div>
              <div><Label>Budget (INR)</Label><Input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} /></div>
              <div><Label>Description</Label><textarea className="w-full rounded-md border px-3 py-2 text-sm h-20 resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
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
