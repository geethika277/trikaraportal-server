import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, activitiesApi } from '@/api/crm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ActivityFeed } from '@/components/shared/ActivityFeed';
import { formatDate, formatCurrency, STATUS_COLORS } from '@/lib/utils';
import { ArrowLeft, Building2, Mail, Phone, Globe, RefreshCcw } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { useState } from 'react';
import LeadForm from './LeadForm';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [actNote, setActNote] = useState('');
  const [actType, setActType] = useState('note');

  const { data: lead, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => leadsApi.get(id) });

  const convertMutation = useMutation({
    mutationFn: () => leadsApi.convert(id, { accountName: lead.company }),
    onSuccess: (data) => {
      toast({ title: 'Lead converted to account!' });
      navigate(`/accounts/${data.account._id}`);
    },
    onError: (e) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const activityMutation = useMutation({
    mutationFn: (data) => activitiesApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['activities', 'Lead', id]); setActNote(''); },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!lead) return <div className="text-center py-12 text-muted-foreground">Lead not found</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}><ArrowLeft className="h-4 w-4 mr-1" />Leads</Button>
      </div>

      <PageHeader
        title={lead.title}
        description={lead.company}
        actions={
          <div className="flex gap-2">
            {lead.status !== 'converted' && (
              <Button variant="outline" onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Convert to Account
              </Button>
            )}
            {lead.convertedToAccount && (
              <Button variant="outline" asChild>
                <Link to={`/accounts/${lead.convertedToAccount._id}`}><Building2 className="h-4 w-4 mr-2" />View Account</Link>
              </Button>
            )}
            <Button onClick={() => setShowEdit(true)}>Edit</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Lead Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Status</p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>{lead.status}</span></div>
                <div><p className="text-muted-foreground">Priority</p><p className="font-medium capitalize">{lead.priority}</p></div>
                <div><p className="text-muted-foreground">Source</p><p className="font-medium capitalize">{lead.source?.replace('_', ' ')}</p></div>
                <div><p className="text-muted-foreground">Budget</p><p className="font-medium">{lead.budget ? formatCurrency(lead.budget) : '—'}</p></div>
                <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{lead.contactName || '—'}</p></div>
                <div><p className="text-muted-foreground">Assigned To</p><p className="font-medium">{lead.assignedTo?.name || '—'}</p></div>
                <div><p className="text-muted-foreground">Next Follow-up</p><p className={`font-medium ${lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date() ? 'text-red-500' : ''}`}>{formatDate(lead.nextFollowUp)}</p></div>
                <div><p className="text-muted-foreground">Created</p><p className="font-medium">{formatDate(lead.createdAt)}</p></div>
              </div>
              {lead.notes && <div className="pt-2 border-t"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-sm whitespace-pre-wrap">{lead.notes}</p></div>}
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
                <Button size="sm" onClick={() => activityMutation.mutate({ type: actType, relatedModel: 'Lead', relatedId: id, notes: actNote })} disabled={!actNote || activityMutation.isPending}>Add</Button>
              </div>
              <ActivityFeed relatedModel="Lead" relatedId={id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {lead.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${lead.email}`} className="hover:text-primary">{lead.email}</a></div>}
              {lead.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{lead.phone}</span></div>}
              {lead.website && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><a href={lead.website} target="_blank" className="hover:text-primary text-xs">{lead.website}</a></div>}
              {lead.company && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{lead.company}</span></div>}
            </CardContent>
          </Card>
        </div>
      </div>

      {showEdit && <LeadForm lead={lead} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); qc.invalidateQueries(['lead', id]); }} />}
    </div>
  );
}
