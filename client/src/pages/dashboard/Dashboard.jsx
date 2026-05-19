import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/users';
import { useAuth } from '@/hooks/useAuth';
import { StatCard } from '@/components/shared/StatCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, STATUS_COLORS } from '@/lib/utils';
import { ViewKanban, Error, CheckBox, AttachMoney, Group, TrendingUp, TrackChanges, InsertDriveFile } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Link } from 'react-router-dom';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading dashboard...</div>;

  const role = user?.role;

  if (role === 'superadmin' || role === 'project_manager') {
    const { stats, activeProjects, issuesByStatus, revenueByMonth } = data || {};
    const revenueData = (revenueByMonth || []).map(r => ({ month: MONTHS[r._id.month - 1], revenue: r.total }));

    return (
      <div className="space-y-6">
        <PageHeader title={`Good morning, ${user?.name?.split(' ')[0]}`} description="Here's what's happening at Trikara today." />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Active Projects" value={stats?.activeProjects} icon={ViewKanban} color="primary" />
          <StatCard title="Open Issues" value={stats?.openIssues} icon={Error} color="warning" />
          <StatCard title="Pending Tasks" value={stats?.pendingTasks} icon={CheckBox} color="info" />
          <StatCard title="Month Revenue" value={stats?.monthRevenue} icon={AttachMoney} isCurrency color="success" />
          <StatCard title="Team Members" value={stats?.teamCount} icon={Group} />
          <StatCard title="Pipeline Value" value={stats?.pipelineValue} icon={TrendingUp} isCurrency color="primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Revenue (This Year)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Issues by Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={issuesByStatus || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {(issuesByStatus || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Active Projects</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(activeProjects || []).map(p => (
                <Link to={`/projects/${p._id}`} key={p._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full" style={{ backgroundColor: p.color || '#6366f1' }} />
                    <div>
                      <p className="font-medium text-sm">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.account?.name}</p>
                    </div>
                  </div>
                  <Badge variant="success">{p.status}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === 'bde') {
    const { stats, opportunities, followUps, leadsBySource } = data || {};
    const sourceData = (leadsBySource || []).map(l => ({ name: l._id, value: l.count }));

    return (
      <div className="space-y-6">
        <PageHeader title={`Hello, ${user?.name?.split(' ')[0]}`} description="Your sales pipeline at a glance." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Active Leads" value={stats?.activeLeads} icon={TrackChanges} color="primary" />
          <StatCard title="Won This Month" value={stats?.wonThisMonth?.count} icon={TrendingUp} color="success" />
          <StatCard title="Won Value MTD" value={stats?.wonThisMonth?.total} icon={AttachMoney} isCurrency color="success" />
          <StatCard title="Follow-ups Due" value={followUps?.length} icon={CheckBox} color="warning" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Active Opportunities</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(opportunities || []).map(o => (
                  <Link to={`/opportunities/${o._id}`} key={o._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                    <div>
                      <p className="font-medium text-sm">{o.title}</p>
                      <p className="text-xs text-muted-foreground">{o.account?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(o.value)}</p>
                      <Badge variant="info" className="text-xs capitalize">{o.stage.replace('_', ' ')}</Badge>
                    </div>
                  </Link>
                ))}
                {!opportunities?.length && <p className="text-sm text-muted-foreground text-center py-4">No active opportunities</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Leads by Source</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (role === 'accounting') {
    const { summary, recentInvoices } = data || {};
    const s = summary || {};

    return (
      <div className="space-y-6">
        <PageHeader title="Finance Overview" description="Invoice and revenue summary." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Draft" value={s.draft?.[0]?.count || 0} description={formatCurrency(s.draft?.[0]?.total)} icon={InsertDriveFile} />
          <StatCard title="Outstanding" value={s.sent?.[0]?.count || 0} description={formatCurrency(s.sent?.[0]?.total)} icon={AttachMoney} color="info" />
          <StatCard title="Paid MTD" value={s.paid?.[0]?.count || 0} description={formatCurrency(s.paid?.[0]?.total)} icon={CheckBox} color="success" />
          <StatCard title="Overdue" value={s.overdue?.[0]?.count || 0} description={formatCurrency(s.overdue?.[0]?.total)} icon={Error} color="danger" />
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Invoices</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(recentInvoices || []).map(inv => (
                <Link to={`/invoices/${inv._id}`} key={inv._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">{inv.account?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(inv.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                      {inv.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { myTasks, myIssues } = data || {};

  return (
    <div className="space-y-6">
      <PageHeader title={`Hello, ${user?.name?.split(' ')[0]}`} description="Your tasks and issues for today." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">My Tasks ({myTasks?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(myTasks || []).slice(0, 10).map(t => (
                <Link to={`/tasks`} key={t._id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.project?.title}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>{t.status.replace('_', ' ')}</span>
                </Link>
              ))}
              {!myTasks?.length && <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">My Issues ({myIssues?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(myIssues || []).slice(0, 10).map(i => (
                <div key={i._id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <div>
                    <p className="text-sm font-medium">#{i.number} {i.title}</p>
                    <p className="text-xs text-muted-foreground">{i.repository?.name}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{i.mappedStatus}</span>
                </div>
              ))}
              {!myIssues?.length && <p className="text-sm text-muted-foreground text-center py-4">No open issues</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
