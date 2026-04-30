'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import BugReportIcon from '@mui/icons-material/BugReport';
import {
  animalApi,
  medicalApi,
  VaccinationRecord,
  MedicationRecord,
  DewormingRecord,
} from '@/lib/api/apiService';
import type { AnimalRecord } from '@/types';

// ─── helpers ────────────────────────────────────────────────

interface TabPanelProps { children?: React.ReactNode; value: number; index: number; }
function TabPanel({ children, value, index }: TabPanelProps) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}

const TODAY = new Date().toISOString().split('T')[0];

// ─── 疫苗接种弹窗 ────────────────────────────────────────────

interface VaccFormProps { open: boolean; onClose: () => void; onSave: () => void; animalId: number; }
function VaccinationFormDialog({ open, onClose, onSave, animalId }: VaccFormProps) {
  const [form, setForm] = useState({
    vaccine_name: '', batch_number: '', vaccination_date: TODAY,
    next_due_date: '', dose_ml: '', vaccinator: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setForm({ vaccine_name: '', batch_number: '', vaccination_date: TODAY, next_due_date: '', dose_ml: '', vaccinator: '', notes: '' }); setError(null); }
  }, [open]);

  const handleSave = async () => {
    if (!form.vaccine_name.trim()) { setError('请输入疫苗名称'); return; }
    setSaving(true); setError(null);
    try {
      await medicalApi.createVaccination({
        animal_id: animalId,
        vaccine_name: form.vaccine_name,
        batch_number: form.batch_number || undefined,
        vaccination_date: form.vaccination_date,
        next_due_date: form.next_due_date || undefined,
        dose_ml: form.dose_ml ? Number(form.dose_ml) : undefined,
        vaccinator: form.vaccinator || undefined,
        notes: form.notes || undefined,
      });
      onSave(); onClose();
    } catch (e: any) { setError(e.message || '操作失败'); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新增疫苗接种记录</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField size="small" label="疫苗名称*" value={form.vaccine_name} onChange={(e) => setForm(p => ({ ...p, vaccine_name: e.target.value }))} />
          <TextField size="small" label="批次号" value={form.batch_number} onChange={(e) => setForm(p => ({ ...p, batch_number: e.target.value }))} />
          <TextField size="small" type="date" label="接种日期*" value={form.vaccination_date} onChange={(e) => setForm(p => ({ ...p, vaccination_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label="下次接种日期" value={form.next_due_date} onChange={(e) => setForm(p => ({ ...p, next_due_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="number" label="接种剂量 (mL)" value={form.dose_ml} onChange={(e) => setForm(p => ({ ...p, dose_ml: e.target.value }))} inputProps={{ min: 0, step: 0.1 }} />
          <TextField size="small" label="接种人员" value={form.vaccinator} onChange={(e) => setForm(p => ({ ...p, vaccinator: e.target.value }))} />
          <TextField size="small" label="备注" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} multiline rows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : null}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 用药记录弹窗 ────────────────────────────────────────────

interface MedFormProps { open: boolean; onClose: () => void; onSave: () => void; animalId: number; }
function MedicationFormDialog({ open, onClose, onSave, animalId }: MedFormProps) {
  const [form, setForm] = useState({
    disease_name: '', drug_name: '', dosage: '', treatment_start: TODAY,
    treatment_end: '', vet_name: '', outcome: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setForm({ disease_name: '', drug_name: '', dosage: '', treatment_start: TODAY, treatment_end: '', vet_name: '', outcome: '', notes: '' }); setError(null); }
  }, [open]);

  const handleSave = async () => {
    if (!form.disease_name.trim() || !form.drug_name.trim()) { setError('请输入疾病名称和药品名称'); return; }
    setSaving(true); setError(null);
    try {
      await medicalApi.createMedication({
        animal_id: animalId,
        disease_name: form.disease_name,
        drug_name: form.drug_name,
        dosage: form.dosage || undefined,
        treatment_start: form.treatment_start,
        treatment_end: form.treatment_end || undefined,
        vet_name: form.vet_name || undefined,
        outcome: form.outcome || undefined,
        notes: form.notes || undefined,
      });
      onSave(); onClose();
    } catch (e: any) { setError(e.message || '操作失败'); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新增用药记录</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField size="small" label="疾病名称*" value={form.disease_name} onChange={(e) => setForm(p => ({ ...p, disease_name: e.target.value }))} />
          <TextField size="small" label="药品名称*" value={form.drug_name} onChange={(e) => setForm(p => ({ ...p, drug_name: e.target.value }))} />
          <TextField size="small" label="剂量与用法" value={form.dosage} onChange={(e) => setForm(p => ({ ...p, dosage: e.target.value }))} />
          <TextField size="small" type="date" label="治疗开始日期*" value={form.treatment_start} onChange={(e) => setForm(p => ({ ...p, treatment_start: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label="治疗结束日期" value={form.treatment_end} onChange={(e) => setForm(p => ({ ...p, treatment_end: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="兽医姓名" value={form.vet_name} onChange={(e) => setForm(p => ({ ...p, vet_name: e.target.value }))} />
          <FormControl size="small" fullWidth>
            <InputLabel>治疗结果</InputLabel>
            <Select value={form.outcome} label="治疗结果" onChange={(e: SelectChangeEvent) => setForm(p => ({ ...p, outcome: e.target.value }))}>
              <MenuItem value="">未设置</MenuItem>
              <MenuItem value="ongoing">治疗中</MenuItem>
              <MenuItem value="recovered">已痊愈</MenuItem>
              <MenuItem value="died">死亡</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" label="备注" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} multiline rows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : null}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 驱虫记录弹窗 ────────────────────────────────────────────

interface DewFormProps { open: boolean; onClose: () => void; onSave: () => void; animalId: number; }
function DewormingFormDialog({ open, onClose, onSave, animalId }: DewFormProps) {
  const [form, setForm] = useState({
    drug_name: '', dose_ml: '', deworming_date: TODAY, next_due_date: '', operator: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setForm({ drug_name: '', dose_ml: '', deworming_date: TODAY, next_due_date: '', operator: '', notes: '' }); setError(null); }
  }, [open]);

  const handleSave = async () => {
    if (!form.drug_name.trim()) { setError('请输入驱虫药名称'); return; }
    setSaving(true); setError(null);
    try {
      await medicalApi.createDeworming({
        animal_id: animalId,
        drug_name: form.drug_name,
        dose_ml: form.dose_ml ? Number(form.dose_ml) : undefined,
        deworming_date: form.deworming_date,
        next_due_date: form.next_due_date || undefined,
        operator: form.operator || undefined,
        notes: form.notes || undefined,
      });
      onSave(); onClose();
    } catch (e: any) { setError(e.message || '操作失败'); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新增驱虫记录</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField size="small" label="驱虫药名称*" value={form.drug_name} onChange={(e) => setForm(p => ({ ...p, drug_name: e.target.value }))} />
          <TextField size="small" type="number" label="剂量 (mL)" value={form.dose_ml} onChange={(e) => setForm(p => ({ ...p, dose_ml: e.target.value }))} inputProps={{ min: 0, step: 0.1 }} />
          <TextField size="small" type="date" label="驱虫日期*" value={form.deworming_date} onChange={(e) => setForm(p => ({ ...p, deworming_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label="下次驱虫日期" value={form.next_due_date} onChange={(e) => setForm(p => ({ ...p, next_due_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="操作人员" value={form.operator} onChange={(e) => setForm(p => ({ ...p, operator: e.target.value }))} />
          <TextField size="small" label="备注" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} multiline rows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : null}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

const outcomeConfig: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'error' }> = {
  ongoing: { label: '治疗中', color: 'warning' },
  recovered: { label: '已痊愈', color: 'success' },
  died: { label: '死亡', color: 'error' },
};

// ─── Main Page ──────────────────────────────────────────────

export default function AnimalMedicalPage() {
  const params = useParams();
  const router = useRouter();
  const animalId = Number(params.id);

  const [animal, setAnimal] = useState<AnimalRecord | null>(null);
  const [loadingAnimal, setLoadingAnimal] = useState(true);
  const [tab, setTab] = useState(0);

  // 疫苗接种
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [vaccTotal, setVaccTotal] = useState(0);
  const [vaccPage, setVaccPage] = useState(0);
  const [loadingVacc, setLoadingVacc] = useState(false);
  const [openVaccForm, setOpenVaccForm] = useState(false);

  // 用药记录
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [medTotal, setMedTotal] = useState(0);
  const [medPage, setMedPage] = useState(0);
  const [loadingMed, setLoadingMed] = useState(false);
  const [openMedForm, setOpenMedForm] = useState(false);

  // 驱虫记录
  const [dewormings, setDewormings] = useState<DewormingRecord[]>([]);
  const [dewTotal, setDewTotal] = useState(0);
  const [dewPage, setDewPage] = useState(0);
  const [loadingDew, setLoadingDew] = useState(false);
  const [openDewForm, setOpenDewForm] = useState(false);

  const PAGE_SIZE = 10;

  useEffect(() => {
    animalApi.getAnimal(animalId)
      .then(setAnimal)
      .catch(() => setAnimal(null))
      .finally(() => setLoadingAnimal(false));
  }, [animalId]);

  const fetchVaccinations = useCallback(async (page: number) => {
    setLoadingVacc(true);
    try {
      const res = await medicalApi.getVaccinations({ animal_id: animalId, page: page + 1, page_size: PAGE_SIZE });
      setVaccinations(res.items);
      setVaccTotal(res.total);
    } catch { setVaccinations([]); } finally { setLoadingVacc(false); }
  }, [animalId]);

  const fetchMedications = useCallback(async (page: number) => {
    setLoadingMed(true);
    try {
      const res = await medicalApi.getMedications({ animal_id: animalId, page: page + 1, page_size: PAGE_SIZE });
      setMedications(res.items);
      setMedTotal(res.total);
    } catch { setMedications([]); } finally { setLoadingMed(false); }
  }, [animalId]);

  const fetchDewormings = useCallback(async (page: number) => {
    setLoadingDew(true);
    try {
      const res = await medicalApi.getDewormings({ animal_id: animalId, page: page + 1, page_size: PAGE_SIZE });
      setDewormings(res.items);
      setDewTotal(res.total);
    } catch { setDewormings([]); } finally { setLoadingDew(false); }
  }, [animalId]);

  useEffect(() => { fetchVaccinations(vaccPage); }, [fetchVaccinations, vaccPage]);
  useEffect(() => { fetchMedications(medPage); }, [fetchMedications, medPage]);
  useEffect(() => { fetchDewormings(dewPage); }, [fetchDewormings, dewPage]);

  const handleDeleteVacc = async (id: number) => {
    if (!confirm('确认删除此接种记录？')) return;
    try { await medicalApi.deleteVaccination(id); fetchVaccinations(vaccPage); } catch { }
  };
  const handleDeleteMed = async (id: number) => {
    if (!confirm('确认删除此用药记录？')) return;
    try { await medicalApi.deleteMedication(id); fetchMedications(medPage); } catch { }
  };
  const handleDeleteDew = async (id: number) => {
    if (!confirm('确认删除此驱虫记录？')) return;
    try { await medicalApi.deleteDeworming(id); fetchDewormings(dewPage); } catch { }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* 页面标题 */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} size="small">返回</Button>
        <Box flex={1}>
          {loadingAnimal ? <Skeleton width={200} /> : (
            <Typography variant="h5" fontWeight={700}>
              防疫档案 — {animal?.name ?? `ID: ${animalId}`}
            </Typography>
          )}
          {!loadingAnimal && animal && (
            <Typography variant="body2" color="text.secondary">
              {animal.breed} · {animal.gender === 'male' ? '公' : '母'} · {animal.age}月龄
            </Typography>
          )}
        </Box>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tab icon={<VaccinesIcon fontSize="small" />} iconPosition="start" label="疫苗接种" />
          <Tab icon={<MedicalServicesIcon fontSize="small" />} iconPosition="start" label="用药记录" />
          <Tab icon={<BugReportIcon fontSize="small" />} iconPosition="start" label="驱虫记录" />
        </Tabs>

        {/* ─── Tab 0: 疫苗接种 ─── */}
        <TabPanel value={tab} index={0}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenVaccForm(true)}>新增接种记录</Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>疫苗名称</TableCell>
                    <TableCell>批次号</TableCell>
                    <TableCell>接种日期</TableCell>
                    <TableCell>下次接种</TableCell>
                    <TableCell>剂量(mL)</TableCell>
                    <TableCell>接种人</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingVacc ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={7}><Skeleton /></TableCell></TableRow>
                    ))
                  ) : vaccinations.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 4 }}>暂无接种记录</TableCell></TableRow>
                  ) : vaccinations.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.vaccine_name}</TableCell>
                      <TableCell>{r.batch_number ?? '-'}</TableCell>
                      <TableCell>{r.vaccination_date}</TableCell>
                      <TableCell>
                        {r.next_due_date ? (
                          <Chip label={r.next_due_date} size="small" color="info" variant="outlined" />
                        ) : '-'}
                      </TableCell>
                      <TableCell>{r.dose_ml ?? '-'}</TableCell>
                      <TableCell>{r.vaccinator ?? '-'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="删除">
                          <IconButton size="small" color="error" onClick={() => handleDeleteVacc(r.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={vaccTotal}
              page={vaccPage}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              onPageChange={(_, p) => setVaccPage(p)}
            />
          </Box>
        </TabPanel>

        {/* ─── Tab 1: 用药记录 ─── */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenMedForm(true)}>新增用药记录</Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>疾病名称</TableCell>
                    <TableCell>药品名称</TableCell>
                    <TableCell>剂量用法</TableCell>
                    <TableCell>开始日期</TableCell>
                    <TableCell>结束日期</TableCell>
                    <TableCell>兽医</TableCell>
                    <TableCell>治疗结果</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingMed ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={8}><Skeleton /></TableCell></TableRow>
                    ))
                  ) : medications.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 4 }}>暂无用药记录</TableCell></TableRow>
                  ) : medications.map((r) => {
                    const cfg = r.outcome ? outcomeConfig[r.outcome] : null;
                    return (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.disease_name}</TableCell>
                        <TableCell>{r.drug_name}</TableCell>
                        <TableCell>{r.dosage ?? '-'}</TableCell>
                        <TableCell>{r.treatment_start}</TableCell>
                        <TableCell>{r.treatment_end ?? '-'}</TableCell>
                        <TableCell>{r.vet_name ?? '-'}</TableCell>
                        <TableCell>
                          {cfg ? <Chip label={cfg.label} color={cfg.color} size="small" /> : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="删除">
                            <IconButton size="small" color="error" onClick={() => handleDeleteMed(r.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={medTotal}
              page={medPage}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              onPageChange={(_, p) => setMedPage(p)}
            />
          </Box>
        </TabPanel>

        {/* ─── Tab 2: 驱虫记录 ─── */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenDewForm(true)}>新增驱虫记录</Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>驱虫药名称</TableCell>
                    <TableCell>剂量(mL)</TableCell>
                    <TableCell>驱虫日期</TableCell>
                    <TableCell>下次驱虫</TableCell>
                    <TableCell>操作人</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingDew ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={6}><Skeleton /></TableCell></TableRow>
                    ))
                  ) : dewormings.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>暂无驱虫记录</TableCell></TableRow>
                  ) : dewormings.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.drug_name}</TableCell>
                      <TableCell>{r.dose_ml ?? '-'}</TableCell>
                      <TableCell>{r.deworming_date}</TableCell>
                      <TableCell>
                        {r.next_due_date ? (
                          <Chip label={r.next_due_date} size="small" color="info" variant="outlined" />
                        ) : '-'}
                      </TableCell>
                      <TableCell>{r.operator ?? '-'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="删除">
                          <IconButton size="small" color="error" onClick={() => handleDeleteDew(r.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={dewTotal}
              page={dewPage}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              onPageChange={(_, p) => setDewPage(p)}
            />
          </Box>
        </TabPanel>
      </Paper>

      {/* Dialogs */}
      <VaccinationFormDialog open={openVaccForm} onClose={() => setOpenVaccForm(false)} onSave={() => fetchVaccinations(vaccPage)} animalId={animalId} />
      <MedicationFormDialog open={openMedForm} onClose={() => setOpenMedForm(false)} onSave={() => fetchMedications(medPage)} animalId={animalId} />
      <DewormingFormDialog open={openDewForm} onClose={() => setOpenDewForm(false)} onSave={() => fetchDewormings(dewPage)} animalId={animalId} />
    </Container>
  );
}
