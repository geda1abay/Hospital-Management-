import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatBirr } from '@/lib/currency';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { API_URL } from '@/lib/api-config';

const BillsPage = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patient_id: '', tax: '0', discount: '0' });

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const [bRes, pRes] = await Promise.all([
        fetch(`${API_URL}/bills`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/patients`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      const [bData, pData] = await Promise.all([
        bRes.json(),
        pRes.json(),
      ]);
      setPatients(pData || []);
      setBills((bData || []).map((b: any) => ({
        ...b,
        patient_name: (pData || []).find((p: any) => p.id === b.patient_id)?.name
      })));
    } catch (err) {
      console.error('Failed to fetch bills data', err);
      toast.error('Failed to load billing records');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const token = localStorage.getItem('auth_token');
    const tax = parseFloat(form.tax) || 0;
    const discount = parseFloat(form.discount) || 0;
    const totalAmount = 0;
    const finalAmount = tax - discount;

    try {
      const res = await fetch(`${API_URL}/bills`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_id: form.patient_id,
          total_amount: totalAmount,
          tax, discount, final_amount: finalAmount
        })
      });
      if (!res.ok) throw new Error('Failed to create');
      toast.success('Bill created');
      setOpen(false);
      setForm({ patient_id: '', tax: '0', discount: '0' });
      fetchData();
    } catch (err) {
      toast.error('Failed to create bill');
    }
  };

  const statusColor = (s: string) => {
    if (s === 'paid') return 'bg-success/10 text-success';
    if (s === 'partial') return 'bg-warning/10 text-warning';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">Bills</h2>
            <p className="text-muted-foreground">Manage patient bills and invoices</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Create Bill</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
              <DialogHeader><DialogTitle>Create Bill</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={form.patient_id} onValueChange={v => setForm({ ...form, patient_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tax (Birr)</Label>
                    <Input type="number" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount (Birr)</Label>
                    <Input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
                  </div>
                </div>

                <Button onClick={handleCreate} className="w-full">Create Bill</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Final</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.patient_name}</TableCell>
                    <TableCell>{formatBirr(Number(b.total_amount))}</TableCell>
                    <TableCell>{formatBirr(Number(b.tax))}</TableCell>
                    <TableCell>{formatBirr(Number(b.discount))}</TableCell>
                    <TableCell className="font-semibold">{formatBirr(Number(b.final_amount))}</TableCell>
                    <TableCell><Badge variant="secondary" className={statusColor(b.status)}>{b.status}</Badge></TableCell>
                    <TableCell>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {bills.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No bills</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BillsPage;

