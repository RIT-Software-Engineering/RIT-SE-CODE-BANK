import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, CircularProgress,
  Alert, Chip, TextField, MenuItem
} from '@mui/material';
import WeightedScorePanel from './WeightedScorePanel';

const BASE = 'http://localhost:3000';
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3];

function SummarySection({ label, data, showDisseminated }) {
  if (!data) return null;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        {label}{data?.rating != null ? ` — Rating: ${data.rating}` : ''}
        {showDisseminated && data?.disseminated ? `  |  Disseminated? ${data.disseminated}` : ''}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.primary' }}>{data?.comments || ''}</Typography>
    </Box>
  );
}

export default function AnnualEvalPage({ facultyId, roles }) {
  const isAdmin = roles?.has('Admin');
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [summary, setSummary] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [year, setYear] = useState(CURRENT_YEAR);

  useEffect(() => {
    if (isAdmin) {
      axios.get(`${BASE}/highlights/all`)
        .then(res => {
          const seen = new Set();
          const unique = res.data.filter(r => {
            if (seen.has(r.faculty_id)) return false;
            seen.add(r.faculty_id);
            return true;
          });
          setFacultyList(unique);
        }).catch(() => {});
    }
  }, [isAdmin]);

  const targetFacultyId = isAdmin ? selectedFacultyId : facultyId;

  const generate = async () => {
    if (!targetFacultyId || targetFacultyId === -1) return setError('Please select a faculty member.');
    setLoading(true); setError(''); setSummary(null);
    try {
      const res = await axios.post(`${BASE}/highlights/annual-eval/${targetFacultyId}?year=${year}`);
      setSummary(res.data.summary);
      setMeta(res.data.meta);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate annual evaluation.');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3, pt: 10 }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>Annual Evaluation</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        AI-generated evaluation summarizing all highlights forms and teaching evaluations submitted by this faculty member.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        {isAdmin && (
          <TextField select label="Faculty" size="small" value={selectedFacultyId}
            onChange={e => { setSelectedFacultyId(e.target.value); setSummary(null); setMeta(null); }}
            sx={{ minWidth: 220 }}>
            {facultyList.map(f => (
              <MenuItem key={f.faculty_id} value={f.faculty_id}>{f.faculty_name}</MenuItem>
            ))}
          </TextField>
        )}
        <TextField select label="Year" size="small" value={year}
          onChange={e => setYear(e.target.value)}
          sx={{ width: 120 }}>
          {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </TextField>
        <Button variant="contained" onClick={generate}
          disabled={loading || (isAdmin && !selectedFacultyId)}>
          {loading ? <><CircularProgress size={16} sx={{ mr: 1 }} />Generating...</> : summary ? 'Regenerate' : 'Generate'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {meta && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={`${meta.forms} highlights form${meta.forms !== 1 ? 's' : ''}`} size="small" variant="outlined" />
          <Chip label={`${meta.publications} publications`} size="small" variant="outlined" />
          <Chip label={`${meta.grants} grants`} size="small" variant="outlined" />
        </Box>
      )}

      {summary && (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, my: 1, border: '1px solid', borderColor: 'divider' }}>
          <SummarySection label="Teaching" data={summary.teaching} />
          <SummarySection label="Scholarship" data={summary.scholarship} showDisseminated />
          <SummarySection label="Service" data={summary.service} />
          <SummarySection label="Administrative" data={summary.administrative} />
          <SummarySection label="Overall" data={summary.overall} />
          <WeightedScorePanel
            summary={summary}
            facultyId={targetFacultyId}
            teachingText={summary.teaching?.comments || ''}
          />
        </Box>
      )}
    </Box>
  );
}
