import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '@/api/crm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { ActivityFeed } from '@/components/shared/ActivityFeed';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency, STATUS_COLORS, STAGE_LABELS } from '@/lib/utils';
import { ArrowBack, Email, Phone, Public, Business, Person } from '@mui/icons-material';

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({ queryKey: ['account', id], queryFn: () => accountsApi.get(id) });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!data) return <div className="text-center py-12">Account not found</div>;

  const { account, contacts, opportunities, projects, invoices, totalRevenue } = data;

  return (
    <div className="space-y-6 max-w-6xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}><ArrowBack className="h-4 w-4 mr-1" />Accounts</Button>

      <PageHeader
        title={account.name}
        description={account.industry}
        actions={
          <div className="flex gap-2">
            <Badge variant={account.tier === 'active' ? 'success' : 'secondary'} className="text-sm px-3 py-1">{account.tier}</Badge>
            <Button asChild><Link to={`/opportunities?account=${id}`}>+ Opportunity</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Account Info</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {account.email && <div className="flex gap-2"><Email className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" /><a href={`mailto:${account.email}`} className="hover:text-primary break-all">{account.email}</a></div>}
              {account.phone && <div className="flex gap-2"><Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" /><span>{account.phone}</span></div>}
              {account.website && <div className="flex gap-2"><Public className="h-4 w-4 text-muted-foreground flex-shrink-0" /><a href={account.website} target="_blank" className="hover:text-primary text-xs">{account.website}</a></div>}
              {account.address?.city && <div className="flex gap-2"><Business className="h-4 w-4 text-muted-foreground flex-shrink-0" /><span>{[account.address.city, account.address.state, account.address.country].filter(Boolean).join(', ')}</span></div>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="contacts">
            <TabsList>
              <TabsTrigger value="contacts">Contacts ({contacts?.length})</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities ({opportunities?.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({projects?.length})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({invoices?.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="mt-4">
              <div className="space-y-2">
                {contacts?.map(c => (
                  <Card key={c._id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Person className="h-4 w-4 text-primary" /></div>
                      <div><p className="font-medium text-sm">{c.name}{c.isPrimary && <span className="ml-2 text-xs text-primary">(Primary)</span>}</p><p className="text-xs text-muted-foreground">{c.designation} · {c.email}</p></div>
                    </CardContent>
                  </Card>
                ))}
                {!contacts?.length && <p className="text-sm text-muted-foreground text-center py-4">No contacts</p>}
              </div>
            </TabsContent>

            <TabsContent value="opportunities" className="mt-4">
              <div className="space-y-2">
                {opportunities?.map(o => (
                  <Card key={o._id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <Link to={`/opportunities/${o._id}`} className="font-medium text-sm hover:text-primary">{o.title}</Link>
                        <p className="text-xs text-muted-foreground">{STAGE_LABELS[o.stage]}</p>
                      </div>
                      <p className="font-semibold text-sm">{formatCurrency(o.value)}</p>
                    </CardContent>
                  </Card>
                ))}
                {!opportunities?.length && <p className="text-sm text-muted-foreground text-center py-4">No opportunities</p>}
              </div>
            </TabsContent>

            <TabsContent value="projects" className="mt-4">
              <div className="space-y-2">
                {projects?.map(p => (
                  <Card key={p._id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <Link to={`/projects/${p._id}`} className="font-medium text-sm hover:text-primary">{p.title}</Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    </CardContent>
                  </Card>
                ))}
                {!projects?.length && <p className="text-sm text-muted-foreground text-center py-4">No projects</p>}
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="mt-4">
              <div className="space-y-2">
                {invoices?.map(inv => (
                  <Card key={inv._id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <Link to={`/invoices/${inv._id}`} className="font-medium text-sm hover:text-primary">{inv.invoiceNumber}</Link>
                        <p className="text-xs text-muted-foreground">Due: {formatDate(inv.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(inv.total)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!invoices?.length && <p className="text-sm text-muted-foreground text-center py-4">No invoices</p>}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <ActivityFeed relatedModel="Account" relatedId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
