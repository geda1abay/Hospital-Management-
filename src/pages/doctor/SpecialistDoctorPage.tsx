import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { downloadCsv } from '@/lib/export';
import { ClipboardPlus, Download, FlaskConical, History } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost:3001/api';

const SpecialistDoctorPage = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  
  const [treatOpen, setTreatOpen] = useState(false);
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');

  const [labOpen, setLabOpen] = useState(false);
  const [testDescription, setTestDescription] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    const token = localStorage.getItem('auth_token');
    try {
      const [patRes, labRes] = await Promise.all([
        fetch(`${API_URL}/patients`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/lab_requests`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      const patData = await patRes.json();
      const labData = await labRes.json();
      
      setPatients(patData || []);
      setLabRequests(labData || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Failed to load data');
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTreatment = async () => {
    if (!selectedPatient || !user) return;
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`${API_URL}/diagnoses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          doctor_id: user.id,
          diagnosis: treatment,
          notes: notes || null,
        })
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('Treatment recorded');
      setTreatOpen(false);
      setTreatment('');
      setNotes('');
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  const handleRequestLab = async () => {
    if (!selectedPatient || !user) return;
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`${API_URL}/lab_requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          test_description: testDescription
        })
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('Lab test requested');
      setLabOpen(false);
      setTestDescription('');
      fetchData();
    } catch (err) {
      toast.error('Failed to request lab');
    }
  };

  const handleExport = () => {
    downloadCsv('specialist-referred-patients.csv', patients.map((patient) => ({
      Name: patient.name,
      Age: patient.age,
      Gender: patient.gender,
      Contact: patient.contact,
      MedicalHistory: patient.medical_history || '-',
    })));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">Specialist Dashboard</h2>
            <p className="text-muted-foreground">Manage your patients, treatments, and lab requests</p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={patients.length === 0}>
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
        </div>

        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="patients">Referred Patients</TabsTrigger>
            <TabsTrigger value="labs">Lab History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="patients" className="pt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>History</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell>{patient.contact}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{patient.medical_history || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedPatient(patient); setTreatOpen(true); }}>
                              <ClipboardPlus className="mr-1 h-3 w-3" />Treat
                            </Button>
                            <Button variant="ghost" size="sm" className="text-primary" onClick={() => { setSelectedPatient(patient); setLabOpen(true); }}>
                              <FlaskConical className="mr-1 h-3 w-3" />Request Lab
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {patients.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No referred patients</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="labs" className="pt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test Requested</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{patients.find(p => p.id === request.patient_id)?.name || 'Unknown'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{request.test_description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={request.payment_status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                            {request.payment_status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate italic text-sm">
                          {request.result_note || 'Awaiting results...'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.status.toUpperCase()}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {labRequests.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No lab records</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={treatOpen} onOpenChange={setTreatOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Treatment - {selectedPatient?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Diagnosis/Treatment</Label>
                <Textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Describe diagnosis and treatment..." />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button onClick={handleTreatment} className="w-full">Save Treatment</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={labOpen} onOpenChange={setLabOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                Request Laboratory Test - {selectedPatient?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Test Description</Label>
                <Textarea 
                  value={testDescription} 
                  onChange={(e) => setTestDescription(e.target.value)} 
                  placeholder="E.g. Full Blood Count, Malaria Parasite, etc..."
                  className="min-h-[100px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">The lab technician will receive this request and provide results once payment is confirmed.</p>
              <Button onClick={handleRequestLab} className="w-full">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SpecialistDoctorPage;


