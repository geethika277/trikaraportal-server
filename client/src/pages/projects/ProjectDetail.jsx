import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/utils';
import { ArrowLeft, GitBranch, ExternalLink, Users, Code2, Globe, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { useState } from 'react';
import { usersApi } from '@/api/users';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import IssuesList from './IssuesList';
import RepoConnector from '@/components/github/RepoConnector';

const ENV_ICONS = { dev: '💻', staging: '🧪', qa: '🔍', production: '🚀' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'member' });

  const { data: project, isLoading } = useQuery({ queryKey: ['project', id], queryFn: () => projectsApi.get(id) });
  const { data: usersData } = useQuery({ queryKey: ['all-users'], queryFn: () => usersApi.list({ limit: 100 }) });

  const addMemberMutation = useMutation({
    mutationFn: (data) => projectsApi.addTeam(id, data),
    onSuccess: () => { qc.invalidateQueries(['project', id]); setAddMemberOpen(false); toast({ title: 'Team member added' }); },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => projectsApi.removeTeam(id, userId),
    onSuccess: () => { qc.invalidateQueries(['project', id]); toast({ title: 'Member removed' }); },
  });

  const syncMutation = useMutation({
    mutationFn: (repoId) => projectsApi.syncRepo(id, repoId),
    onSuccess: (data) => toast({ title: `Synced ${data.synced} issues` }),
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading project...</div>;
  if (!project) return <div className="text-center py-12">Project not found</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}><ArrowLeft className="h-4 w-4 mr-1" />Projects</Button>

      <div className="flex items-center gap-3">
        <div className="w-3 h-12 rounded-full" style={{ backgroundColor: project.color || '#6366f1' }} />
        <PageHeader
          title={project.title}
          description={project.account?.name}
          actions={
            <div className="flex gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>{project.status.replace('_', ' ')}</span>
              <span className={`text-xs px-3 py-1 rounded-full ${PRIORITY_COLORS[project.priority]}`}>{project.priority}</span>
            </div>
          }
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="repos">Repositories</TabsTrigger>
          <TabsTrigger value="environments">Environments</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 text-sm space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{project.type?.replace(/_/g, ' ')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Start</span><span>{formatDate(project.startDate)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">End</span><span>{formatDate(project.endDate)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span className="font-medium">{formatCurrency(project.budget)}</span></div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-sm">Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{project.description || 'No description'}</p>
                {project.techStack?.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {project.techStack.map(t => <span key={t} className="text-xs bg-secondary px-2 py-1 rounded">{t}</span>)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="mt-4">
          <IssuesList projectId={id} />
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAddMemberOpen(true)}><Users className="h-4 w-4 mr-2" />Add Member</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {project.team?.map(m => (
                <Card key={m.user._id}>
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                        {m.user.name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.user.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role} · {m.user.role?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => removeMemberMutation.mutate(m.user._id)}>Remove</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="repos" className="mt-4">
          <RepoConnector projectId={id} repos={project.repositories || []} onSync={(repoId) => syncMutation.mutate(repoId)} />
        </TabsContent>

        <TabsContent value="environments" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {['dev', 'staging', 'qa', 'production'].map(envName => {
              const env = project.environments?.find(e => e.name === envName);
              return (
                <Card key={envName} className={!env?.isActive ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{ENV_ICONS[envName]}</span>
                      <h3 className="font-semibold capitalize">{envName}</h3>
                      {env?.isActive && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
                    </div>
                    {env?.url ? (
                      <a href={env.url} target="_blank" className="text-sm text-primary hover:underline flex items-center gap-1">
                        <Globe className="h-3 w-3" />{env.url}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not configured</p>
                    )}
                    {env?.notes && <p className="text-xs text-muted-foreground mt-1">{env.notes}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {project.services?.map(s => (
              <Card key={s._id || s.name}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold capitalize">{s.name}</h3>
                  </div>
                  {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                  {s.techStack?.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {s.techStack.map(t => <span key={t} className="text-xs bg-secondary px-2 py-1 rounded">{t}</span>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {addMemberOpen && (
        <Dialog open onOpenChange={() => setAddMemberOpen(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>User</Label>
                <Select value={memberForm.userId} onValueChange={v => setMemberForm(p => ({ ...p, userId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {(usersData?.data || [])
                      .filter(u => !project.team?.some(m => m.user._id === u._id))
                      .map(u => <SelectItem key={u._id} value={u._id}>{u.name} ({u.role})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Role in Project</Label><Input value={memberForm.role} onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Lead Developer" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
              <Button onClick={() => addMemberMutation.mutate(memberForm)} disabled={!memberForm.userId || addMemberMutation.isPending}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
