import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DeviceHub, Refresh, DeleteOutlineOutlined, OpenInNew } from '@mui/icons-material';
import { timeAgo } from '@/lib/utils';
import { toast } from '@/hooks/useToast';

export default function RepoConnector({ projectId, repos, onSync }) {
  const [showAdd, setShowAdd] = useState(false);
  const [token, setToken] = useState('');
  const [ghRepos, setGhRepos] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const qc = useQueryClient();

  const fetchRepos = async () => {
    if (!token) return;
    setFetching(true);
    try {
      const data = await projectsApi.listGithubRepos(token);
      setGhRepos(data);
    } catch {
      toast({ title: 'Failed to fetch repos. Check your token.', variant: 'destructive' });
    } finally {
      setFetching(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: (data) => projectsApi.addRepo(projectId, data),
    onSuccess: () => { qc.invalidateQueries(['project', projectId]); setShowAdd(false); toast({ title: 'Repository connected' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (repoId) => projectsApi.deleteRepo(projectId, repoId),
    onSuccess: () => { qc.invalidateQueries(['project', projectId]); toast({ title: 'Repository removed' }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAdd(true)}><DeviceHub className="h-4 w-4 mr-2" />Connect Repository</Button>
      </div>

      <div className="space-y-3">
        {repos.map(repo => (
          <Card key={repo._id}>
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <DeviceHub className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{repo.fullName}</p>
                    {repo.isPrivate && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Private</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{repo.description || 'No description'}</p>
                  {repo.lastSyncedAt && <p className="text-xs text-muted-foreground mt-1">Last synced {timeAgo(repo.lastSyncedAt)}</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {repo.labelMappings?.slice(0, 4).map(m => (
                      <span key={m.label} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: m.color }}>
                        {m.label} → {m.mappedStatus}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {repo.url && <a href={repo.url} target="_blank" className="text-muted-foreground hover:text-primary"><OpenInNew className="h-4 w-4" /></a>}
                <Button variant="ghost" size="sm" onClick={() => onSync(repo._id)}><Refresh className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(repo._id)}><DeleteOutlineOutlined className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {repos.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <DeviceHub className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No repositories connected</p>
            <p className="text-xs text-muted-foreground mt-1">Connect a GitHub repository to sync issues</p>
          </div>
        )}
      </div>

      {showAdd && (
        <Dialog open onOpenChange={() => setShowAdd(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Connect GitHub Repository</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Personal Access Token (with repo scope)</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_xxxx..." />
                  <Button variant="outline" onClick={fetchRepos} disabled={!token || fetching}>{fetching ? '...' : 'Fetch'}</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Create a PAT at GitHub → Settings → Developer settings → Personal access tokens</p>
              </div>

              {ghRepos.length > 0 && (
                <div>
                  <Label>Select Repository</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-md mt-1">
                    {ghRepos.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRepo(r)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-b-0 ${selectedRepo?.id === r.id ? 'bg-primary/10' : ''}`}
                      >
                        <p className="font-medium">{r.fullName}</p>
                        {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button
                disabled={!selectedRepo || addMutation.isPending}
                onClick={() => addMutation.mutate({
                  name: selectedRepo.name,
                  fullName: selectedRepo.fullName,
                  url: selectedRepo.url,
                  githubId: selectedRepo.id,
                  description: selectedRepo.description,
                  isPrivate: selectedRepo.isPrivate,
                  defaultBranch: selectedRepo.defaultBranch,
                  token,
                })}
              >
                {addMutation.isPending ? 'Connecting...' : 'Connect'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
