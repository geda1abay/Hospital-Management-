import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { downloadCsv } from '@/lib/export';
import { Download, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { API_URL } from '@/lib/api-config';

const SpecialistTreatmentsPage = () => {
  const { user } = useAuth();
  const [treatments, setTreatments] = useState<any[]>([]);
  const [editTreatment, setEditTreatment] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ diagnosis: '', notes: '' });

  const refreshTreatments = useCallback(async () => {
    if (!user) return;
    const token = localStorage.getItem('auth_token');
    try {
      const [diagRes, patRes] = await Promise.all([
        fetch(`${API_URL}/diagnoses`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/patients`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      const [diagData, patData] = await Promise.all([
        diagRes.json(),
        patRes.json(),
      ]);

      const myTreatments = (diagData || []).filter((d: any) => d.doctor_id === user.id);
      setTreatments(myTreatments.map((treatment: any) => ({
        ...treatment,
        patient_name: (patData || []).find((patient: any) => patient.id === treatment.patient_id)?.name,
      })));
    } catch (err) {
      console.error('Failed to fetch treatments', err);
      toast.error('Failed to load treatments');
    }
  }, [user]);

  useEffect(() => {
    refreshTreatments();
  }, [refreshTreatments]);

  const handleEdit = (row: any) => {
    setEditTreatment(row);
    setForm({ diagnosis: row.diagnosis, notes: row.notes || '' });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!editTreatment) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_URL}/diagnoses/${editTreatment.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          diagnosis: form.diagnosis,
          notes: form.notes || null,
        })
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Treatment updated');
      setOpen(false);
      setEditTreatment(null);
      await refreshTreatments();
    } catch (err) {
      toast.error('Failed to update treatment');
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_URL}/diagnoses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Treatment deleted');
      await refreshTreatments();
    } catch (err) {
      toast.error('Failed to delete treatment');
    }
  };

  const handleExport = () => {
    downloadCsv('specialist-treatments.csv', treatments.map((row) => ({
      Patient: row.patient_name || '-',
      Treatment: row.diagnosis,
      Notes: row.notes || '-',
      Date: new Date(row.created_at).toLocaleString(),
    })));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">Treatments</h2>
            <p className="text-muted-foreground">All treatments you've recorded</p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={treatments.length === 0}>
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell className="font-medium">{treatment.patient_name}</TableCell>
                    <TableCell>{treatment.diagnosis}</TableCell>
                    <TableCell>{treatment.notes || '-'}</TableCell>
                    <TableCell>{new Date(treatment.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(treatment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(treatment.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {treatments.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No treatments</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Treatment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Treatment" />
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
              <Button onClick={handleSave} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SpecialistTreatmentsPage;

