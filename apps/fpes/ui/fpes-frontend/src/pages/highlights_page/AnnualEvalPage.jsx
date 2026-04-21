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
import CloseIcon from '@mui/icons-material/Close';
import WeightedScorePanel from './WeightedScorePanel';

const BASE = 'http://localhost:3000';
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3];

function SummarySection({ label, data, showDisseminated, onUpdate, onReject, sectionKey, isEditing, setEditMode, isRegenerating }) {
  const [editData, setEditData] = useState(data);

  if (!data) return null;

  const isModified = JSON.stringify(editData) !== JSON.stringify(data);

  const handleSave = () => {
    onUpdate(sectionKey, editData);
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditData(data);
    setEditMode(false);
  };

  const handleRatingChange = (newRating) => {
    setEditData({ ...editData, rating: newRating });
  };

  const handleCommentsChange = (e) => {
    setEditData({ ...editData, comments: e.target.value });
  };

  const handleDisseminatedChange = (e) => {
    setEditData({ ...editData, disseminated: e.target.value });
  };

  if (isEditing) {
    return (
      <Paper sx={{ p: 2, mb: 1.5, bgcolor: '#f5f5f5', border: '2px solid #2196f3' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Edit {label}
          </Typography>
          <ButtonGroup size="small">
            <Button startIcon={<SaveIcon />} onClick={handleSave} variant="contained" color="success">
              Save
            </Button>
            <Button startIcon={<CancelIcon />} onClick={handleCancel} variant="outlined">
              Cancel
            </Button>
          </ButtonGroup>
        </Box>

        {data?.rating != null && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>Rating: {editData?.rating || 0}</Typography>
            <Rating
              value={editData?.rating || 0}
              onChange={(e, newValue) => handleRatingChange(newValue)}
              max={5}
            />
          </Box>
        )}

        {showDisseminated && (
          <TextField
            select
            label="Disseminated?"
            value={editData?.disseminated || 'N'}
            onChange={handleDisseminatedChange}
            size="small"
            sx={{ mb: 1.5, display: 'block' }}
          >
            <MenuItem value="Y">Yes</MenuItem>
            <MenuItem value="N">No</MenuItem>
          </TextField>
        )}

        <TextField
          fullWidth
          multiline
          rows={4}
          value={editData?.comments || ''}
          onChange={handleCommentsChange}
          placeholder="Enter comments..."
          variant="outlined"
          size="small"
        />

        {isModified && (
          <Typography variant="caption" sx={{ color: '#ff9800', mt: 1, display: 'block' }}>
            • Changes made
          </Typography>
        )}
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 1.5, border: '1px solid #ddd', position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box flex={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            {label}{data?.rating != null ? ` — Rating: ${data.rating}` : ''}
            {showDisseminated && data?.disseminated ? `  |  Disseminated? ${data.disseminated}` : ''}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', mt: 1, whiteSpace: 'pre-wrap' }}>
            {data?.comments || ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
          <IconButton
            size="small"
            onClick={() => setEditMode(true)}
            title="Edit this section"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onReject(sectionKey)}
            disabled={isRegenerating}
            title="Regenerate this section"
            sx={{ color: 'error.main' }}
          >
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
  const [acceptedSections, setAcceptedSections] = useState({});
  const [regeneratingSections, setRegeneratingSections] = useState({});
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

  const handleSectionUpdate = (sectionKey, updatedData) => {
    setSummary(prev => ({
      ...prev,
      [sectionKey]: updatedData
    }));
    setAcceptedSections(prev => ({
      ...prev,
      [sectionKey]: true
    }));
  };

  const handleSectionReject = async (sectionKey) => {
    if (!targetFacultyId || targetFacultyId === -1) return setError('Please select a faculty member.');
    
    setRegeneratingSections(prev => ({ ...prev, [sectionKey]: true }));
    setError('');
    
    try {
      const res = await axios.post(`${BASE}/highlights/annual-eval/${targetFacultyId}?year=${year}`);
      setSummary(prevSummary => ({
        ...prevSummary,
        [sectionKey]: res.data.summary[sectionKey]
      }));
      setAcceptedSections(prev => {
        const updated = { ...prev };
        delete updated[sectionKey];
        return updated;
      });
      setEditingSections(prev => ({
        ...prev,
        [sectionKey]: false
      }));
    } catch (e) {
      setError(`Failed to regenerate ${sectionKey} section: ${e.response?.data?.error || 'Unknown error'}`);
    } finally {
      setRegeneratingSections(prev => ({ ...prev, [sectionKey]: false }));
    }
  };

  const generate = async () => {
    if (!targetFacultyId || targetFacultyId === -1) return setError('Please select a faculty member.');
    setLoading(true); 
    setError(''); 
    setSummary(null);
    setEditingSections({});
    setAcceptedSections({});
    try {
      const res = await axios.post(`${BASE}/highlights/annual-eval/${targetFacultyId}?year=${year}`);
      setSummary(res.data.summary);
      setMeta(res.data.meta);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate annual evaluation.');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3, pt: 10 }} bgcolor="white" >
      <Typography variant="h5" sx={{ mb: 0.5 }} color='black'>Annual Evaluation</Typography>
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
        <Box>
          <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 1, mb: 2, border: '1px solid #4caf50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                Review & Edit Summary
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setEditingSections({});
                    setAcceptedSections({
                      teaching: true,
                      scholarship: true,
                      service: true,
                      administrative: true,
                      overall: true
                    });
                  }}
                >
                  Save Draft
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  endIcon={<CheckCircleIcon />}
                  disabled={Object.keys(acceptedSections).length < 5}
                  title={Object.keys(acceptedSections).length < 5 ? 'Accept or edit all sections first' : 'Save this summary'}
                >
                  Finalize
                </Button>
              </Box>
            </Box>
            <Typography variant="body2" color="#1b5e20">
              Edit any section by clicking the edit icon or click on "REGENERATE" to generate new summarys, or review each individually.
              Progress: {Object.keys(acceptedSections).length}/5 sections
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, my: 1, border: '1px solid', borderColor: 'divider' }}>
            <SummarySection
              label="Teaching"
              data={summary.teaching}
              onUpdate={handleSectionUpdate}
              onReject={handleSectionReject}
              sectionKey="teaching"
              isEditing={editingSections.teaching}
              isRegenerating={regeneratingSections.teaching}
              setEditMode={(isEditing) => setEditingSections(prev => ({ ...prev, teaching: isEditing }))}
            />
            <SummarySection
              label="Scholarship"
              data={summary.scholarship}
              showDisseminated
              onUpdate={handleSectionUpdate}
              onReject={handleSectionReject}
              sectionKey="scholarship"
              isEditing={editingSections.scholarship}
              isRegenerating={regeneratingSections.scholarship}
              setEditMode={(isEditing) => setEditingSections(prev => ({ ...prev, scholarship: isEditing }))}
            />
            <SummarySection
              label="Service"
              data={summary.service}
              onUpdate={handleSectionUpdate}
              onReject={handleSectionReject}
              sectionKey="service"
              isEditing={editingSections.service}
              isRegenerating={regeneratingSections.service}
              setEditMode={(isEditing) => setEditingSections(prev => ({ ...prev, service: isEditing }))}
            />
            <SummarySection
              label="Administrative"
              data={summary.administrative}
              onUpdate={handleSectionUpdate}
              onReject={handleSectionReject}
              sectionKey="administrative"
              isEditing={editingSections.administrative}
              isRegenerating={regeneratingSections.administrative}
              setEditMode={(isEditing) => setEditingSections(prev => ({ ...prev, administrative: isEditing }))}
            />
            <SummarySection
              label="Overall"
              data={summary.overall}
              onUpdate={handleSectionUpdate}
              onReject={handleSectionReject}
              sectionKey="overall"
              isEditing={editingSections.overall}
              isRegenerating={regeneratingSections.overall}
              setEditMode={(isEditing) => setEditingSections(prev => ({ ...prev, overall: isEditing }))}
            />
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
