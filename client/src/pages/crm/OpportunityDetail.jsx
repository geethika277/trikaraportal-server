import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesApi, activitiesApi } from '@/api/crm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { ActivityFeed } from '@/components/shared/ActivityFeed';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate, STAGE_LABELS, STAGE_COLORS } from '@/lib/utils';
import { ArrowLeft, FolderKanban } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const STAGES = ['qualification', 'proposal', 'negotiation', 'contract_sent', 'won', 'lost'];

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showConvert, setShowConvert] = useState(false);
  const [convertForm, setConvertForm] = useState({ title: '', type: 'new_development' });
  const [actNote, setActNote] = useState('');
  const [actType, setActType] = useState('note');

  const { data: opp, isLoading } = useQuery({ queryKey: ['opportunity', id], queryFn: () => opportunitiesApi.get(id) });

  const stageMutation = useMutation({
    mutationFn: (stage) => opportunitiesApi.update(id, { stage }),
    onSuccess: () => qc.invalidateQueries(['opportunity', id]),
    onError: (e) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const convertMutation = useMutation({
    mutationFn: (data) => opportunitiesApi.convert(id, data),
    onSuccess: (data) => { toast({ title: 'Converted to project!' }); navigate(`/projects/${data.project._id}`); },
  });

  const activityMutation = useMutation({
    mutationFn: (data) => activitiesApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['activities', 'Opportunity', id]); setActNote(''); },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!opp) return <div className="text-center py-12">Opportunity not found</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')}><ArrowLeft className="h-4 w-4 mr-1" />Opportunities</Button>

      <PageHeader
        title={opp.title}
        description={opp.account?.name}
        actions={
          <div className="flex gap-2">
            {!opp.convertedToProject && opp.stage !== 'lost' && (
              <Button variant="outline" onClick={() => { setConvertForm({ title: opp.title, type: 'new_development' }); setShowConvert(true); }}>
                <FolderKanban className="h-4 w-4 mr-2" />Convert to Project
              </Button>
            )}
            {opp.convertedToProject && (
              <Button variant="outline" asChild><Link to={`/projects/${opp.convertedToProject._id}`}>View Project</Link></Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Stage</p>
                <div className="flex gap-2 flex-wrap">
                  {STAGES.map(s => (
                    <button
                      key={s}
                      onClick={() => stageMutation.mutate(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${opp.stage === s ? 'text-white border-transparent' : 'bg-background border-border hover:bg-muted'}`}
                      style={opp.stage === s ? { backgroundColor: STAGE_COLORS[s], borderColor: STAGE_COLORS[s] } : {}}
                    >
                      {STAGE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Value</p><p className="font-semibold text-lg">{formatCurrency(opp.value)}</p></div>
                <div><p className="text-muted-foreground">Probability</p><p className="font-medium">{opp.probability}%</p></div>
                <div><p className="text-muted-foreground">Service Type</p><p className="font-medium capitalize">{opp.serviceType?.replace(/_/g, ' ')}</p></div>
                <div><p className="text-muted-foreground">Assigned To</p><p className="font-medium">{opp.assignedTo?.name || '—'}</p></div>
                <div><p className="text-muted-foreground">Expected Close</p><p className="font-medium">{formatDate(opp.expectedCloseDate)}</p></div>
                <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{opp.contact?.name || '—'}</p></div>
              </div>
              {opp.description && <div className="pt-3 border-t mt-3"><p className="text-xs text-muted-foreground mb-1">Description</p><p className="text-sm">{opp.description}</p></div>}
              {opp.nextStep && <div className="pt-3 border-t mt-3 bg-blue-50 dark:bg-blue-950 p-3 rounded"><p className="text-xs font-medium text-blue-600 mb-1">Next Step</p><p className="text-sm">{opp.nextStep}</p></div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Activities</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <select className="rounded-md border px-3 py-2 text-sm" value={actType} onChange={e => setActType(e.target.value)}>
                  {['note', 'call', 'email', 'meeting', 'follow_up', 'demo'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
                <input className="flex-1 rounded-md border px-3 py-2 text-sm" placeholder="Add a note..." value={actNote} onChange={e => setActNote(e.target.value)} />
                <Button size="sm" onClick={() => activityMutation.mutate({ type: actType, relatedModel: 'Opportunity', relatedId: id, notes: actNote })} disabled={!actNote}>Add</Button>
              </div>
              <ActivityFeed relatedModel="Opportunity" relatedId={id} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Account</CardTitle></CardHeader>
            <CardContent>
              <Link to={`/accounts/${opp.account?._id}`} className="font-medium text-sm hover:text-primary">{opp.account?.name}</Link>
              {opp.account?.industry && <p className="text-xs text-muted-foreground mt-1">{opp.account.industry}</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {showConvert && (
        <Dialog open onOpenChange={() => setShowConvert(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Convert to Project</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Project Title *</Label><Input value={convertForm.title} onChange={e => setConvertForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div>
                <Label>Project Type</Label>
                <Select value={convertForm.type} onValueChange={v => setConvertForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['new_development', 'modification_fix', 'maintenance_support'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConvert(false)}>Cancel</Button>
              <Button onClick={() => convertMutation.mutate(convertForm)} disabled={!convertForm.title || convertMutation.isPending}>Convert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
