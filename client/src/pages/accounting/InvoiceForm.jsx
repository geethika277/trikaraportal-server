import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { invoicesApi } from '@/api/invoices';
import { accountsApi } from '@/api/crm';
import { projectsApi } from '@/api/projects';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/useToast';

export default function InvoiceForm({ invoice, onClose, onSuccess }) {
  const isEdit = !!invoice;
  const [form, setForm] = useState({
    account: invoice?.account?._id || '',
    project: invoice?.project?._id || '',
    dueDate: invoice?.dueDate?.slice(0, 10) || '',
    taxRate: invoice?.taxRate ?? 18,
    notes: invoice?.notes || '',
    paymentTerms: invoice?.paymentTerms || 'Net 30',
    lineItems: invoice?.lineItems || [{ description: '', quantity: 1, unitPrice: '', amount: 0 }],
  });

  const { data: accData } = useQuery({ queryKey: ['accounts-list'], queryFn: () => accountsApi.list({ limit: 100 }) });
  const { data: projData } = useQuery({ queryKey: ['projects-list'], queryFn: () => projectsApi.list({ limit: 100 }) });

  const updateItem = (i, field, val) => {
    setForm(p => {
      const items = [...p.lineItems];
      items[i] = { ...items[i], [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        items[i].amount = parseFloat(items[i].quantity || 0) * parseFloat(items[i].unitPrice || 0);
      }
      return { ...p, lineItems: items };
    });
  };

  const addItem = () => setForm(p => ({ ...p, lineItems: [...p.lineItems, { description: '', quantity: 1, unitPrice: '', amount: 0 }] }));
  const removeItem = (i) => setForm(p => ({ ...p, lineItems: p.lineItems.filter((_, idx) => idx !== i) }));

  const subtotal = form.lineItems.reduce((s, i) => s + (i.amount || 0), 0);
  const taxAmount = subtotal * form.taxRate / 100;
  const total = subtotal + taxAmount;

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? invoicesApi.update(invoice._id, data) : invoicesApi.create(data),
    onSuccess: () => { toast({ title: isEdit ? 'Invoice updated' : 'Invoice created' }); onSuccess(); },
    onError: (e) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Invoice' : 'New Invoice'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Account *</Label>
              <Select value={form.account} onValueChange={v => setForm(p => ({ ...p, account: v }))}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{(accData?.data || []).map(a => <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project</Label>
              <Select value={form.project} onValueChange={v => setForm(p => ({ ...p, project: v }))}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{(projData?.data || []).map(p => <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Due Date *</Label><Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
            <div><Label>GST (%)</Label><Input type="number" value={form.taxRate} onChange={e => setForm(p => ({ ...p, taxRate: e.target.value }))} /></div>
            <div><Label>Payment Terms</Label><Input value={form.paymentTerms} onChange={e => setForm(p => ({ ...p, paymentTerms: e.target.value }))} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items</Label>
              <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Add Item</Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted"><tr><th className="text-left p-2">Description</th><th className="text-right p-2 w-20">Qty</th><th className="text-right p-2 w-28">Rate</th><th className="text-right p-2 w-28">Amount</th><th className="p-2 w-8"></th></tr></thead>
                <tbody>
                  {form.lineItems.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-1"><Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="border-0 h-8" placeholder="Item description" /></td>
                      <td className="p-1"><Input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} className="border-0 h-8 text-right" /></td>
                      <td className="p-1"><Input type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} className="border-0 h-8 text-right" placeholder="0" /></td>
                      <td className="p-2 text-right font-medium">₹{(item.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-1"><button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t p-3 space-y-1 bg-muted/30 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GST ({form.taxRate}%)</span><span>₹{taxAmount.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          <div><Label>Notes</Label><textarea className="w-full rounded-md border px-3 py-2 text-sm h-16 resize-none" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={!form.account || !form.dueDate || mutation.isPending}>
            {mutation.isPending ? 'Saving...' : (isEdit ? 'Update' : 'Create Invoice')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
