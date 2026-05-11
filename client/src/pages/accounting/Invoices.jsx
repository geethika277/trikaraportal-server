import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { invoicesApi } from '@/api/invoices';
import { accountsApi, opportunitiesApi } from '@/api/crm';
import { projectsApi } from '@/api/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { formatDate, formatCurrency, STATUS_COLORS } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import InvoiceForm from './InvoiceForm';

const STATUS_ICONS = { draft: Clock, sent: Clock, viewed: Clock, paid: CheckCircle, overdue: AlertCircle, cancelled: AlertCircle };

export default function Invoices() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { status }],
    queryFn: () => invoicesApi.list({ status: status || undefined }),
  });

  const { data: summary } = useQuery({ queryKey: ['invoices-summary'], queryFn: invoicesApi.summary });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => invoicesApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries(['invoices']); qc.invalidateQueries(['invoices-summary']); },
  });

  const invoices = data?.data || [];

  const NEXT_STATUS = { draft: 'sent', sent: 'paid', viewed: 'paid' };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Billing and payment tracking"
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />New Invoice</Button>}
      />

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Outstanding" value={summary.outstanding?.total} isCurrency description={`${summary.outstanding?.count} invoices`} icon={Clock} color="info" />
          <StatCard title="Overdue" value={summary.overdue?.total} isCurrency description={`${summary.overdue?.count} invoices`} icon={AlertCircle} color="danger" />
          <StatCard title="Paid (MTD)" value={summary.monthRevenue} isCurrency icon={CheckCircle} color="success" />
          <StatCard title="Year Revenue" value={summary.yearRevenue} isCurrency icon={DollarSign} color="primary" />
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={status || 'all'} onValueChange={v => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-2">
          {invoices
            .filter(inv => !search || inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || inv.account?.name?.toLowerCase().includes(search.toLowerCase()))
            .map(inv => {
              const Icon = STATUS_ICONS[inv.status] || Clock;
              return (
                <Card key={inv._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${STATUS_COLORS[inv.status] || 'bg-gray-100'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <Link to={`/invoices/${inv._id}`} className="font-semibold text-sm hover:text-primary">{inv.invoiceNumber}</Link>
                          <p className="text-xs text-muted-foreground">{inv.account?.name}</p>
                        </div>
                      </div>
                      <div className="hidden md:block text-sm text-muted-foreground">
                        <p>Issued: {formatDate(inv.issuedDate)}</p>
                        <p>Due: {formatDate(inv.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(inv.total, inv.currency)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                          {NEXT_STATUS[inv.status] && (
                            <button
                              onClick={() => statusMutation.mutate({ id: inv._id, status: NEXT_STATUS[inv.status] })}
                              className="text-xs text-primary hover:underline"
                            >
                              → Mark {NEXT_STATUS[inv.status]}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          {invoices.length === 0 && <div className="text-center py-12 text-muted-foreground">No invoices found</div>}
        </div>
      )}

      {showForm && <InvoiceForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); qc.invalidateQueries(['invoices']); }} />}
    </div>
  );
}
