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
import { Textarea } from '@/components/ui/textarea';
import { downloadCsv } from '@/lib/export';
import { Plus, Trash2, Edit, Download } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost:3001/api';

const PatientsPage = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [generalDoctors, setGeneralDoctors] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '', age: '', gender: 'male', contact: '', address: '',
    assigned_general_doctor_id: '', medical_history: ''
  });

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const [pRes, prRes, rRes] = await Promise.all([
        fetch(`${API_URL}/patients`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/profiles`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/user_roles`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      
      const [pData, prData, rData] = await Promise.all([
        pRes.json(),
        prRes.json(),
        rRes.json(),
      ]);

      setPatients(pData || []);
      const gDocs = (prData || []).filter((p: any) =>
        (rData || []).some((r: any) => r.user_id === p.user_id && r.role === 'general_doctor')
      );
      setGeneralDoctors(gDocs);
    } catch (err) {
      console.error('Failed to fetch patients data', err);
      toast.error('Failed to load patient records');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ name: '', age: '', gender: 'male', contact: '', address: '', assigned_general_doctor_id: '', medical_history: '' });
    setEditPatient(null);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('auth_token');
    const payload = {
      name: form.name,
      age: parseInt(form.age),
      gender: form.gender,
      contact: form.contact,
      address: form.address || null,
      assigned_general_doctor_id: form.assigned_general_doctor_id || null,
      medical_history: form.medical_history || null,
    };

    try {
      if (editPatient) {
        const res = await fetch(`${API_URL}/patients/${editPatient.id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update');
        toast.success('Patient updated');
      } else {
        const res = await fetch(`${API_URL}/patients`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create');
        toast.success('Patient created');
      }
      setOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(editPatient ? 'Failed to update patient' : 'Failed to create patient');
    }
  };

  const handleEdit = (p: any) => {
    setEditPatient(p);
    setForm({
      name: p.name, age: String(p.age), gender: p.gender, contact: p.contact,
      address: p.address || '', assigned_general_doctor_id: p.assigned_general_doctor_id || '',
      medical_history: p.medical_history || ''
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_URL}/patients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Patient deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete patient');
    }
  };

  const getDoctorName = (id: string | null) => {
    if (!id) return '—';
    return generalDoctors.find(d => d.user_id === id)?.full_name || '—';
  };

  const statusColor = (s: string) => {
    if (s === 'active') return 'bg-success/10 text-success';
    if (s === 'referred') return 'bg-warning/10 text-warning';
    return 'bg-muted text-muted-foreground';
  };

  const handleExport = () => {
    downloadCsv('patients.csv', patients.map((patient) => ({
      Name: patient.name,
      Age: patient.age,
      Gender: patient.gender,
      Contact: patient.contact,
      Doctor: getDoctorName(patient.assigned_general_doctor_id),
      Status: patient.status,
    })));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">Patients</h2>
            <p className="text-muted-foreground">Manage patient records and assignments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={patients.length === 0}>
              <Download className="mr-2 h-4 w-4" />Export
            </Button>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Patient</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editPatient ? 'Edit Patient' : 'Add Patient'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact</Label>
                    <Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Assign General Doctor</Label>
                  <Select value={form.assigned_general_doctor_id} onValueChange={v => setForm({ ...form, assigned_general_doctor_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                    <SelectContent>
                      {generalDoctors.map(d => (
                        <SelectItem key={d.user_id} value={d.user_id}>{d.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Medical History</Label>
                  <Textarea value={form.medical_history} onChange={e => setForm({ ...form, medical_history: e.target.value })} />
                </div>
                <Button onClick={handleSave} className="w-full">{editPatient ? 'Update' : 'Create'} Patient</Button>
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
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.age}</TableCell>
                    <TableCell className="capitalize">{p.gender}</TableCell>
                    <TableCell>{p.contact}</TableCell>
                    <TableCell>{getDoctorName(p.assigned_general_doctor_id)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColor(p.status)}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {patients.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No patients found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PatientsPage;

