import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { timeAgo, PRIORITY_COLORS } from '@/lib/utils';
import { ExternalLink, Search } from 'lucide-react';
import { usersApi } from '@/api/users';
import { toast } from '@/hooks/useToast';

export default function IssuesList({ projectId }) {
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [state, setState] = useState('open');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['issues', projectId, { search, state }],
    queryFn: () => projectsApi.listIssues(projectId, { search: search || undefined, state: state || undefined }),
  });

  const { data: boardData } = useQuery({
    queryKey: ['issues-board', projectId],
    queryFn: () => projectsApi.issuesBoard(projectId),
    enabled: view === 'board',
  });

  const { data: usersData } = useQuery({ queryKey: ['all-users'], queryFn: () => usersApi.list({ limit: 100 }) });

  const updateMutation = useMutation({
    mutationFn: ({ issueId, data }) => projectsApi.updateIssue(projectId, issueId, data),
    onSuccess: () => { qc.invalidateQueries(['issues', projectId]); qc.invalidateQueries(['issues-board', projectId]); toast({ title: 'Issue updated' }); setSelectedIssue(null); },
  });

  const issues = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search issues..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={state || 'all'} onValueChange={v => setState(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-md overflow-hidden">
          {['list', 'board'].map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-2 text-sm ${view === v ? 'bg-primary text-white' : 'hover:bg-muted'}`}>{v}</button>
          ))}
        </div>
      </div>

      {view === 'board' ? (
        <div className="kanban-board">
          {(boardData || []).map(group => (
            <div key={group._id} className="kanban-column">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-sm">{group._id}</h3>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{group.count}</span>
              </div>
              <div className="space-y-2">
                {group.issues.slice(0, 20).map(issue => (
                  <IssueCard key={issue._id} issue={issue} onClick={() => setSelectedIssue(issue)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        isLoading ? <div className="text-center py-8 text-muted-foreground">Loading issues...</div> : (
          <div className="space-y-2">
            {issues.map(issue => (
              <IssueCard key={issue._id} issue={issue} onClick={() => setSelectedIssue(issue)} />
            ))}
            {issues.length === 0 && <div className="text-center py-8 text-muted-foreground">No issues found. Connect a GitHub repository and sync issues.</div>}
          </div>
        )
      )}

      {selectedIssue && (
        <Dialog open onOpenChange={() => setSelectedIssue(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>#{selectedIssue.number} {selectedIssue.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="flex gap-2 flex-wrap">
                {selectedIssue.labels?.map(l => (
                  <span key={l.name} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: `#${l.color}` }}>{l.name}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Status: <strong>{selectedIssue.mappedStatus}</strong></p>
              {selectedIssue.body && <p className="text-sm whitespace-pre-wrap text-muted-foreground line-clamp-10">{selectedIssue.body}</p>}
              <div>
                <Label className="text-xs">Internal Notes</Label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm h-20 resize-none mt-1"
                  defaultValue={selectedIssue.internalNotes}
                  id="internal-notes"
                />
              </div>
              <div>
                <Label className="text-xs">Assign Internally</Label>
                <Select
                  value={selectedIssue.assignedInternally?.[0]?._id || ''}
                  onValueChange={(v) => setSelectedIssue(p => ({ ...p, _assignTo: v }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select team member" /></SelectTrigger>
                  <SelectContent>
                    {(usersData?.data || []).map(u => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority Override</Label>
                <Select value={selectedIssue.priority || 'medium'} onValueChange={v => setSelectedIssue(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{['low', 'medium', 'high', 'critical'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <a href={selectedIssue.htmlUrl} target="_blank" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mr-auto">
                <ExternalLink className="h-3 w-3" />View on GitHub
              </a>
              <Button variant="outline" onClick={() => setSelectedIssue(null)}>Close</Button>
              <Button onClick={() => {
                const notes = document.getElementById('internal-notes')?.value;
                updateMutation.mutate({
                  issueId: selectedIssue._id,
                  data: {
                    internalNotes: notes,
                    priority: selectedIssue.priority,
                    assignedInternally: selectedIssue._assignTo ? [selectedIssue._assignTo] : selectedIssue.assignedInternally?.map(u => u._id || u),
                  },
                });
              }} disabled={updateMutation.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function IssueCard({ issue, onClick }) {
  return (
    <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${issue.state === 'open' ? 'bg-green-500' : 'bg-purple-500'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium line-clamp-1">#{issue.number} {issue.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${PRIORITY_COLORS[issue.priority] || 'bg-gray-100 text-gray-600'}`}>{issue.priority}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs bg-muted px-2 py-0.5 rounded">{issue.mappedStatus}</span>
              {issue.labels?.slice(0, 3).map(l => (
                <span key={l.name} className="text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: `#${l.color}` }}>{l.name}</span>
              ))}
              <span className="text-xs text-muted-foreground ml-auto">{timeAgo(issue.githubUpdatedAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
