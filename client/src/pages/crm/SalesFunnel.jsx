import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesApi } from '@/api/crm';
import { KanbanBoard } from '@/components/shared/KanbanBoard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, STAGE_COLORS, STAGE_LABELS } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import { toast } from '@/hooks/useToast';

export default function SalesFunnel() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities-funnel'],
    queryFn: opportunitiesApi.funnel,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, stage }) => opportunitiesApi.update(id, { stage }),
    onSuccess: () => qc.invalidateQueries(['opportunities-funnel']),
    onError: (e) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const stages = ['qualification', 'proposal', 'negotiation', 'contract_sent', 'won', 'lost'];

  const columns = (data || []).map(s => ({
    id: s.stage,
    label: STAGE_LABELS[s.stage] || s.stage,
    color: STAGE_COLORS[s.stage],
    items: s.items || [],
    count: s.count,
    totalValue: formatCurrency(s.totalValue),
  }));

  const chartData = (data || []).filter(s => !['won', 'lost'].includes(s.stage)).map(s => ({
    stage: STAGE_LABELS[s.stage],
    value: s.totalValue,
    count: s.count,
  }));

  const handleDrop = (itemId, fromStage, toStage) => {
    if (fromStage !== toStage) updateMutation.mutate({ id: itemId, stage: toStage });
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading funnel...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Funnel" description="Drag opportunities across stages to update them" />

      <Card>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} width={110} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <KanbanBoard
        columns={columns}
        onDrop={handleDrop}
        renderCard={(opp) => (
          <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <Link to={`/opportunities/${opp._id}`} className="block" onClick={e => e.stopPropagation()}>
                <p className="font-medium text-sm hover:text-primary">{opp.title}</p>
              </Link>
              <p className="text-xs text-muted-foreground mt-1">{opp.account?.name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-green-600">{formatCurrency(opp.value)}</span>
                <span className="text-xs text-muted-foreground">{opp.probability}%</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                {opp.assignedTo && (
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {opp.assignedTo.name?.[0]}
                    </div>
                    <span className="text-xs text-muted-foreground">{opp.assignedTo.name?.split(' ')[0]}</span>
                  </div>
                )}
                {opp.expectedCloseDate && (
                  <span className={`text-xs ${new Date(opp.expectedCloseDate) < new Date() ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {formatDate(opp.expectedCloseDate, 'dd MMM')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      />
    </div>
  );
}
