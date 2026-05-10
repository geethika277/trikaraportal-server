import { useMutation, useQuery } from '@tanstack/react-query';
import { leadsApi } from '@/api/crm';
import { usersApi } from '@/api/users';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/useToast';

export default function LeadForm({ lead, onClose, onSuccess }) {
  const isEdit = !!lead;
  const [form, setForm] = useState({
    title: '', company: '', contactName: '', email: '', phone: '',
    source: 'other', status: 'new', priority: 'medium', budget: '',
    assignedTo: '', notes: '', nextFollowUp: '', website: '',
  });

  useEffect(() => {
    if (lead) {
      setForm({
        title: lead.title || '',
        company: lead.company || '',
        contactName: lead.contactName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || 'other',
        status: lead.status || 'new',
        priority: lead.priority || 'medium',
        budget: lead.budget || '',
        assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
        notes: lead.notes || '',
        nextFollowUp: lead.nextFollowUp ? lead.nextFollowUp.slice(0, 10) : '',
        website: lead.website || '',
      });
    }
  }, [lead]);

  const { data: usersData } = useQuery({ queryKey: ['users', { role: 'bde' }], queryFn: () => usersApi.list({ role: 'bde' }) });
  const bdes = usersData?.data || [];

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? leadsApi.update(lead._id, data) : leadsApi.create(data),
    onSuccess: () => { toast({ title: isEdit ? 'Lead updated' : 'Lead created' }); onSuccess(); },
    onError: (e) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  const setVal = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Lead' : 'New Lead'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title *</Label><Input value={form.title} onChange={setVal('title')} placeholder="Lead title" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Company</Label><Input value={form.company} onChange={setVal('company')} /></div>
            <div><Label>Contact Name</Label><Input value={form.contactName} onChange={setVal('contactName')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={setVal('email')} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={setVal('phone')} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Source</Label>
              <Select value={form.source} onValueChange={set('source')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['website', 'referral', 'linkedin', 'cold_call', 'event', 'partner', 'other'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={set('status')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['new', 'contacted', 'qualified', 'unqualified'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={set('priority')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['low', 'medium', 'high'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Budget (INR)</Label><Input type="number" value={form.budget} onChange={setVal('budget')} /></div>
            <div><Label>Next Follow-up</Label><Input type="date" value={form.nextFollowUp} onChange={setVal('nextFollowUp')} /></div>
          </div>
          <div>
            <Label>Assigned To (BDE)</Label>
            <Select value={form.assignedTo} onValueChange={set('assignedTo')}>
              <SelectTrigger><SelectValue placeholder="Select BDE" /></SelectTrigger>
              <SelectContent>
                {bdes.map(u => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><textarea className="w-full rounded-md border px-3 py-2 text-sm resize-none h-20" value={form.notes} onChange={setVal('notes')} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.title}>
            {mutation.isPending ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
