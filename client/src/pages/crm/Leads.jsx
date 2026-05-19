import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Add, Search, FilterList } from '@mui/icons-material';
import { leadsApi } from '@/api/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate, formatCurrency, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import LeadForm from './LeadForm';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'unqualified', 'converted'];
const SOURCE_OPTIONS = ['website', 'referral', 'linkedin', 'cold_call', 'event', 'partner', 'other'];

export default function Leads() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leads', { search, status, source, page }],
    queryFn: () => leadsApi.list({ search: search || undefined, status: status || undefined, source: source || undefined, page }),
  });

  const deleteMutation = useMutation({
    mutationFn: leadsApi.delete,
    onSuccess: () => { qc.invalidateQueries(['leads']); toast({ title: 'Lead deleted' }); },
  });

  const leads = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leads"
        description="Manage your sales leads pipeline"
        actions={<Button onClick={() => { setEditLead(null); setShowForm(true); }}><Add className="h-4 w-4 mr-2" />Add Lead</Button>}
      />

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={status || 'all'} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={source || 'all'} onValueChange={v => { setSource(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Sources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading leads...</div>
      ) : (
        <div className="grid gap-3">
          {leads.map(lead => (
            <Card key={lead._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/leads/${lead._id}`} className="font-semibold text-sm hover:text-primary transition-colors">{lead.title}</Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] || ''}`}>{lead.status}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[lead.priority] || ''}`}>{lead.priority}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {lead.company && <span>{lead.company}</span>}
                      {lead.contactName && <span>· {lead.contactName}</span>}
                      {lead.source && <span>· {lead.source.replace('_', ' ')}</span>}
                      {lead.budget > 0 && <span>· {formatCurrency(lead.budget)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {lead.assignedTo && (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary" title={lead.assignedTo.name}>
                        {lead.assignedTo.name?.[0]}
                      </div>
                    )}
                    {lead.nextFollowUp && (
                      <span className={`text-xs ${new Date(lead.nextFollowUp) < new Date() ? 'text-red-500' : 'text-muted-foreground'}`}>
                        Follow-up: {formatDate(lead.nextFollowUp)}
                      </span>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setEditLead(lead); setShowForm(true); }}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(lead._id)}>Delete</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {leads.length === 0 && <div className="text-center py-12 text-muted-foreground">No leads found</div>}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground py-2">{page} / {pagination.pages}</span>
          <Button variant="outline" size="sm" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {showForm && (
        <LeadForm
          lead={editLead}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries(['leads']); }}
        />
      )}
    </div>
  );
}
