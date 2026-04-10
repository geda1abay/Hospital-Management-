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

const GeneralDiagnosesPage = () => {
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [editDiagnosis, setEditDiagnosis] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ diagnosis: '', notes: '' });

  const refreshDiagnoses = useCallback(async () => {
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

      const myDiagnoses = (diagData || []).filter((d: any) => d.doctor_id === user.id);
      setDiagnoses(myDiagnoses.map((diagnosis: any) => ({
        ...diagnosis,
        patient_name: (patData || []).find((patient: any) => patient.id === diagnosis.patient_id)?.name,
      })));
    } catch (err) {
      console.error('Failed to fetch diagnoses', err);
      toast.error('Failed to load diagnoses');
    }
  }, [user]);

  useEffect(() => {
    refreshDiagnoses();
  }, [refreshDiagnoses]);

  const handleEdit = (row: any) => {
    setEditDiagnosis(row);
    setForm({ diagnosis: row.diagnosis, notes: row.notes || '' });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!editDiagnosis) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_URL}/diagnoses/${editDiagnosis.id}`, {
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
      toast.success('Diagnosis updated');
      setOpen(false);
      setEditDiagnosis(null);
      await refreshDiagnoses();
    } catch (err) {
      toast.error('Failed to update diagnosis');
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
      toast.success('Diagnosis deleted');
      await refreshDiagnoses();
    } catch (err) {
      toast.error('Failed to delete diagnosis');
    }
  };

  const handleExport = () => {
    downloadCsv('general-diagnoses.csv', diagnoses.map((row) => ({
      Patient: row.patient_name || '-',
      Diagnosis: row.diagnosis,
      Notes: row.notes || '-',
      Date: new Date(row.created_at).toLocaleString(),
    })));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">My Diagnoses</h2>
            <p className="text-muted-foreground">View all diagnoses you've recorded</p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={diagnoses.length === 0}>
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnoses.map((diagnosis) => (
                  <TableRow key={diagnosis.id}>
                    <TableCell className="font-medium">{diagnosis.patient_name}</TableCell>
                    <TableCell>{diagnosis.diagnosis}</TableCell>
                    <TableCell>{diagnosis.notes || '-'}</TableCell>
                    <TableCell>{new Date(diagnosis.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(diagnosis)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(diagnosis.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {diagnoses.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No diagnoses</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Diagnosis</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Diagnosis" />
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
              <Button onClick={handleSave} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default GeneralDiagnosesPage;

