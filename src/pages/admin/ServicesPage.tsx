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
import { downloadCsv } from '@/lib/export';
import { Download, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost:3001/api';

const categories = ['consultation', 'lab_test', 'medicine', 'room_charge', 'procedure', 'other'] as const;

const ServicesPage = () => {
  const [services, setServices] = useState<{ id: string; name: string; price: number; category: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', category: 'consultation' });

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/services`);
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      setServices(data || []);
    } catch (err) {
      console.error('Failed to fetch services', err);
      toast.error('Failed to load services');
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const resetForm = () => {
    setOpen(false);
    setEditServiceId(null);
    setForm({ name: '', price: '', category: 'consultation' });
  };

  const handleCreate = async () => {
    const token = localStorage.getItem('auth_token');
    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
    };
    
    try {
      const url = editServiceId ? `${API_URL}/services/${editServiceId}` : `${API_URL}/services`;
      const method = editServiceId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      toast.success(editServiceId ? 'Service updated' : 'Service created');
      resetForm();
      fetchServices();
    } catch (err) {
      toast.error(editServiceId ? 'Failed to update' : 'Failed to create');
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Service deleted');
      fetchServices();
    } catch (err) {
      toast.error('Failed to delete service');
    }
  };

  const handleEdit = (service: { id: string; name: string; price: number; category: string }) => {
    setEditServiceId(service.id);
    setForm({ name: service.name, price: String(service.price), category: service.category });
    setOpen(true);
  };

  const handleExport = () => {
    downloadCsv('services.csv', services.map((service) => ({
      Name: service.name,
      Category: service.category,
      Price: formatBirr(service.price),
    })));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">Services</h2>
            <p className="text-muted-foreground">Manage billable services</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={services.length === 0}>
              <Download className="mr-2 h-4 w-4" />Export
            </Button>
            <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Service</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editServiceId ? 'Edit Service' : 'Add Service'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Price (Birr)</Label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">{editServiceId ? 'Update Service' : 'Create Service'}</Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell><Badge variant="secondary">{s.category.replace('_', ' ')}</Badge></TableCell>
                    <TableCell>{formatBirr(s.price)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {services.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No services</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ServicesPage;

