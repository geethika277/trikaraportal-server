import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { projectsApi } from '@/api/projects';
import { projectsApi as projects } from '@/api/projects';
import { usersApi } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { formatDate, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/utils';
import { Add, CheckCircle, RadioButtonUnchecked, AccessTime, Error } from '@mui/icons-material';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { accountsApi } from '@/api/crm';

const STATUS_ICONS = { todo: RadioButtonUnchecked, in_progress: AccessTime, review: Error, done: CheckCircle, blocked: Error };

export default function MyTasks() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ title: '', description: '', type: 'other', priority: 'medium', dueDate: '', assignedTo: [] });
  const qc = useQueryClient();

  const isManager = ['superadmin', 'project_manager'].includes(user?.role);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { status: filterStatus || undefined }],
    queryFn: () => tasksApi.list({ status: filterStatus || undefined }),
  });

  const { data: projectsData } = useQuery({ queryKey: ['projects-list'], queryFn: () => projects.list({ limit: 100 }) });
  const { data: usersData } = useQuery({ queryKey: ['all-users'], queryFn: () => usersApi.list({ limit: 100 }) });

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => { qc.invalidateQueries(['tasks']); setShowForm(false); toast({ title: 'Task created' }); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => tasksApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(['tasks']),
  });

  const tasks = data?.data || [];

  const grouped = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    blocked: tasks.filter(t => t.status === 'blocked'),
    done: tasks.filter(t => t.status === 'done'),
  };

  const NEXT_STATUS = { todo: 'in_progress', in_progress: 'review', review: 'done', blocked: 'in_progress' };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={isManager ? "All team tasks" : "My tasks"}
        actions={<Button onClick={() => setShowForm(true)}><Add className="h-4 w-4 mr-2" />New Task</Button>}
      />

      <div className="flex gap-2">
        {['', 'todo', 'in_progress', 'review', 'done', 'blocked'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
      ) : filterStatus ? (
        <div className="space-y-2">
          {tasks.map(task => <TaskCard key={task._id} task={task} onStatusChange={(id, st) => statusMutation.mutate({ id, status: st })} nextStatus={NEXT_STATUS} />)}
          {tasks.length === 0 && <p className="text-center py-8 text-muted-foreground">No tasks</p>}
        </div>
      ) : (
        <div className="kanban-board">
          {Object.entries(grouped).map(([status, items]) => (
            <div key={status} className="kanban-column">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-sm capitalize">{status.replace('_', ' ')}</h3>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(task => <TaskCard key={task._id} task={task} onStatusChange={(id, st) => statusMutation.mutate({ id, status: st })} nextStatus={NEXT_STATUS} compact />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Description</Label><textarea className="w-full rounded-md border px-3 py-2 text-sm h-16 resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['development', 'testing', 'review', 'bde', 'accounting', 'design', 'other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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
                <div>
                  <Label>Project</Label>
                  <Select value={form.project || ''} onValueChange={v => setForm(p => ({ ...p, project: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>{(projectsData?.data || []).map(p => <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Assign To</Label>
                <Select value={form.assignedTo?.[0] || ''} onValueChange={v => setForm(p => ({ ...p, assignedTo: [v] }))}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>{(usersData?.data || []).map(u => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TaskCard({ task, onStatusChange, nextStatus, compact }) {
  const Icon = STATUS_ICONS[task.status] || RadioButtonUnchecked;
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className={`${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start gap-2">
          <button
            onClick={() => nextStatus[task.status] && onStatusChange(task._id, nextStatus[task.status])}
            className={`mt-0.5 flex-shrink-0 ${task.status === 'done' ? 'text-green-500' : 'text-muted-foreground hover:text-primary'}`}
          >
            <Icon className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
            {!compact && task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {task.project && <span className="text-xs text-muted-foreground">{task.project.title}</span>}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
              {task.dueDate && <span className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-500' : 'text-muted-foreground'}`}>{formatDate(task.dueDate)}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
