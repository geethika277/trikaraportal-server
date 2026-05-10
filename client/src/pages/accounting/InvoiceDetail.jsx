import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/api/invoices';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDate, formatCurrency, STATUS_COLORS } from '@/lib/utils';
import { ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { useState } from 'react';
import InvoiceForm from './InvoiceForm';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);

  const { data: invoice, isLoading } = useQuery({ queryKey: ['invoice', id], queryFn: () => invoicesApi.get(id) });

  const statusMutation = useMutation({
    mutationFn: (status) => invoicesApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries(['invoice', id]); qc.invalidateQueries(['invoices']); },
    onError: (e) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!invoice) return <div className="text-center py-12">Invoice not found</div>;

  const canEdit = !['paid', 'cancelled'].includes(invoice.status);

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}><ArrowLeft className="h-4 w-4 mr-1" />Invoices</Button>

      <PageHeader
        title={invoice.invoiceNumber}
        description={invoice.account?.name}
        actions={
          <div className="flex gap-2">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[invoice.status]}`}>{invoice.status}</span>
            {invoice.status === 'draft' && <Button variant="outline" onClick={() => statusMutation.mutate('sent')}><Send className="h-4 w-4 mr-2" />Mark Sent</Button>}
            {['sent', 'viewed', 'overdue'].includes(invoice.status) && <Button onClick={() => statusMutation.mutate('paid')}><CheckCircle className="h-4 w-4 mr-2" />Mark Paid</Button>}
            {canEdit && <Button variant="outline" onClick={() => setShowEdit(true)}>Edit</Button>}
          </div>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between mb-8">
            <div>
              <p className="font-bold text-lg">Trikara</p>
              <p className="text-sm text-muted-foreground">Software Development Agency</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold">INVOICE</p>
              <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
              <p className="mt-1">Issued: {formatDate(invoice.issuedDate)}</p>
              <p>Due: {formatDate(invoice.dueDate)}</p>
              {invoice.paidDate && <p className="text-green-600">Paid: {formatDate(invoice.paidDate)}</p>}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-1">Bill To</p>
            <p className="font-semibold">{invoice.account?.name}</p>
            {invoice.contact?.name && <p className="text-sm">{invoice.contact.name}</p>}
            {invoice.account?.email && <p className="text-sm text-muted-foreground">{invoice.account.email}</p>}
            {invoice.account?.address && (
              <p className="text-sm text-muted-foreground">{[invoice.account.address.city, invoice.account.address.state, invoice.account.address.country].filter(Boolean).join(', ')}</p>
            )}
          </div>

          {invoice.project && <p className="text-sm text-muted-foreground mb-4">Project: <span className="font-medium text-foreground">{invoice.project.title}</span></p>}

          <table className="w-full text-sm mb-4">
            <thead><tr className="border-b"><th className="text-left py-2">Description</th><th className="text-right py-2 w-20">Qty</th><th className="text-right py-2 w-28">Rate</th><th className="text-right py-2 w-32">Amount</th></tr></thead>
            <tbody>
              {invoice.lineItems?.map((item, i) => (
                <tr key={i} className="border-b"><td className="py-3">{item.description}</td><td className="text-right py-3">{item.quantity}</td><td className="text-right py-3">{formatCurrency(item.unitPrice)}</td><td className="text-right py-3 font-medium">{formatCurrency(item.amount)}</td></tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST ({invoice.taxRate}%)</span><span>{formatCurrency(invoice.taxAmount)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{formatCurrency(invoice.total, invoice.currency)}</span></div>
          </div>

          {invoice.notes && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            <p>Payment Terms: {invoice.paymentTerms}</p>
          </div>
        </CardContent>
      </Card>

      {showEdit && <InvoiceForm invoice={invoice} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); qc.invalidateQueries(['invoice', id]); }} />}
    </div>
  );
}
