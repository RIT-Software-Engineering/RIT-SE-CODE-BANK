import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, CircularProgress,
  Alert, Chip, TextField, MenuItem, Paper, IconButton,
  ButtonGroup, Rating
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import WeightedScorePanel from './WeightedScorePanel';

const BASE = 'http://localhost:3000';
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3];
const SECTIONS = ['teaching', 'scholarship', 'service', 'administrative', 'overall'];

function SummarySection({ label, data, showDisseminated, onUpdate, onReject, sectionKey, isEditing, setEditMode, isRegenerating }) {
  const [editData, setEditData] = useState(data);

  if (!data) return null;

  const handleSave = () => { onUpdate(sectionKey, editData); setEditMode(false); };
  const handleCancel = () => { setEditData(data); setEditMode(false); };

  if (isEditing) {
    return (
      <Paper sx={{ p: 2, mb: 1.5, bgcolor: '#f5f5f5', border: '2px solid #2196f3' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Edit {label}</Typography>
          <ButtonGroup size="small">
            <Button startIcon={<SaveIcon />} onClick={handleSave} variant="contained" color="success">Save</Button>
            <Button startIcon={<CancelIcon />} onClick={handleCancel} variant="outlined">Cancel</Button>
          </ButtonGroup>
        </Box>

        {data?.rating != null && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>Rating: {editData?.rating || 0}</Typography>
            <Rating value={editData?.rating || 0} onChange={(_, v) => setEditData(p => ({ ...p, rating: v }))} max={5} />
          </Box>
        )}

        {showDisseminated && (
          <TextField select label="Disseminated?" value={editData?.disseminated || 'N'}
            onChange={e => setEditData(p => ({ ...p, disseminated: e.target.value }))}
            size="small" sx={{ mb: 1.5, display: 'block' }}>
            <MenuItem value="Y">Yes</MenuItem>
            <MenuItem value="N">No</MenuItem>
          </TextField>
        )}

        <TextField fullWidth multiline rows={4} value={editData?.comments || ''}
          onChange={e => setEditData(p => ({ ...p, comments: e.target.value }))}
          placeholder="Enter comments..." variant="outlined" size="small" />

        {JSON.stringify(editData) !== JSON.stringify(data) && (
          <Typography variant="caption" sx={{ color: '#ff9800', mt: 1, display: 'block' }}>• Changes made</Typography>
        )}
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 1.5, border: '1px solid #ddd' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box flex={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {label}{data?.rating != null ? ` — Rating: ${data.rating}` : ''}
            {showDisseminated && data?.disseminated ? `  |  Disseminated? ${data.disseminated}` : ''}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{data?.comments || ''}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
          <IconButton size="small" onClick={() => setEditMode(true)} title="Edit this section">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onReject(sectionKey)} disabled={isRegenerating}
            title="Regenerate this section" sx={{ color: 'error.main' }}>
            {isRegenerating ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}

export default function AnnualEvalPage({ facultyId, roles }) {
  const isAdmin = roles?.has('Admin');
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [summary, setSummary] = useState(null);
  const [editingSections, setEditingSections] = useState({});
  const [regeneratingSections, setRegeneratingSections] = useState({});
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [year, setYear] = useState(CURRENT_YEAR);

  const targetFacultyId = isAdmin ? selectedFacultyId : facultyId;

  // Load unique faculty list for admin dropdown
  useEffect(() => {
    if (!isAdmin) return;
    axios.get(`${BASE}/highlights/all`)
      .then(res => {
        const seen = new Set();
        setFacultyList(res.data.filter(r => seen.has(r.faculty_id) ? false : seen.add(r.faculty_id)));
      }).catch(() => {});
  }, [isAdmin]);

  // Load stored summary whenever selected faculty changes
  useEffect(() => {
    if (!targetFacultyId || targetFacultyId === -1) return;
    setSummary(null); setMeta(null); setError(''); setSaved(false);
    axios.get(`${BASE}/highlights/annual-eval/${targetFacultyId}`)
      .then(res => { if (res.data.summary) setSummary(res.data.summary); })
      .catch(() => {}); // 404 = none stored yet, that's fine
  }, [targetFacultyId]);

  const setEditMode = (key, val) => setEditingSections(prev => ({ ...prev, [key]: val }));

  const handleSectionUpdate = (sectionKey, updatedData) => {
    setSummary(prev => ({ ...prev, [sectionKey]: updatedData }));
    setSaved(false);
  };

  // Regenerate the full eval and pull out just the requested section
  const handleSectionReject = async (sectionKey) => {
    if (!targetFacultyId) return setError('Please select a faculty member.');
    setRegeneratingSections(prev => ({ ...prev, [sectionKey]: true }));
    setError('');
    try {
      const res = await axios.post(`${BASE}/highlights/annual-eval/${targetFacultyId}?refresh=true&year=${year}`);
      setSummary(prev => ({ ...prev, [sectionKey]: res.data.summary[sectionKey] }));
      setEditMode(sectionKey, false);
      setSaved(false);
    } catch (e) {
      setError(`Failed to regenerate ${sectionKey}: ${e.response?.data?.error || 'Unknown error'}`);
    } finally {
      setRegeneratingSections(prev => ({ ...prev, [sectionKey]: false }));
    }
  };

  // Generate — calls AI only if no stored summary exists; ?refresh=true forces regeneration
  const generate = async (force = false) => {
    if (!targetFacultyId) return setError('Please select a faculty member.');
    setLoading(true); setError(''); setSaved(false);
    try {
      const url = `${BASE}/highlights/annual-eval/${targetFacultyId}?year=${year}${force ? '&refresh=true' : ''}`;
      const res = await axios.post(url);
      setSummary(res.data.summary);
      if (res.data.meta) setMeta(res.data.meta);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate annual evaluation.');
    } finally {
      setLoading(false);
    }
  };

  // Finalize — saves the current (possibly edited) summary to DB
  const handleFinalize = async () => {
    if (!targetFacultyId || !summary) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      await axios.put(`${BASE}/highlights/annual-eval/${targetFacultyId}`, { summary });
      setSaved(true);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save evaluation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3, pt: 10 }} bgcolor="white">
      <Typography variant="h5" sx={{ mb: 0.5 }} color="black">Annual Evaluation</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        AI-generated evaluation summarizing all highlights forms and teaching evaluations submitted by this faculty member.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        {isAdmin && (
          <TextField select label="Faculty" size="small" value={selectedFacultyId}
            onChange={e => { setSelectedFacultyId(e.target.value); setSummary(null); setMeta(null); setSaved(false); }}
            sx={{ minWidth: 220 }}>
            {facultyList.map(f => <MenuItem key={f.faculty_id} value={f.faculty_id}>{f.faculty_name}</MenuItem>)}
          </TextField>
        )}
        <TextField select label="Year" size="small" value={year}
          onChange={e => setYear(e.target.value)} sx={{ width: 120 }}>
          {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </TextField>
        <Button variant="contained" onClick={() => generate(false)}
          disabled={loading || (isAdmin && !selectedFacultyId)}>
          {loading ? <><CircularProgress size={16} sx={{ mr: 1 }} />Generating...</> : summary ? 'Load / Refresh' : 'Generate'}
        </Button>
        {summary && (
          <Button variant="outlined" color="warning" onClick={() => generate(true)} disabled={loading}>
            Regenerate
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Evaluation saved.</Alert>}

      {meta && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={`${meta.forms} highlights form${meta.forms !== 1 ? 's' : ''}`} size="small" variant="outlined" />
          <Chip label={`${meta.publications} publications`} size="small" variant="outlined" />
          <Chip label={`${meta.grants} grants`} size="small" variant="outlined" />
        </Box>
      )}

      {summary && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button variant="contained" color="success" size="small"
              endIcon={saving ? <CircularProgress size={14} /> : <CheckCircleIcon />}
              onClick={handleFinalize} disabled={saving}>
              Finalize & Save
            </Button>
          </Box>

          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, my: 1, border: '1px solid', borderColor: 'divider' }}>
            {SECTIONS.map(key => (
              <SummarySection key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                data={summary[key]}
                showDisseminated={key === 'scholarship'}
                onUpdate={handleSectionUpdate}
                onReject={handleSectionReject}
                sectionKey={key}
                isEditing={!!editingSections[key]}
                isRegenerating={!!regeneratingSections[key]}
                setEditMode={val => setEditMode(key, val)}
              />
            ))}
            <WeightedScorePanel
              summary={summary}
              facultyId={targetFacultyId}
              teachingText={summary.teaching?.comments || ''}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
