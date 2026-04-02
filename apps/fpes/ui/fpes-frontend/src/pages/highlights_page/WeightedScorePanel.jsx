import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TextField, Button, Alert, Divider, Chip
} from '@mui/material';

const BASE = 'http://localhost:3000';

function qualitativeFeedback(teachingScore, scholarshipScore, perClass) {
  const lines = [];

  if (teachingScore?.level) {
    const classAbove = perClass?.filter(c => c.alignment === 'Above Average').length ?? 0;
    const classTotal = perClass?.length ?? 0;
    lines.push(`Teaching: ${teachingScore.level} overall (${teachingScore.percentile?.toFixed(1)}th percentile).` +
      (classTotal > 0 ? ` ${classAbove} of ${classTotal} course(s) above department average.` : '') +
      (teachingScore.bumped ? ' Course improvement efforts bumped score.' : ''));
  }

  if (scholarshipScore) {
    lines.push(`Scholarship: ${scholarshipScore.pubLevel} in publications (${scholarshipScore.pubCount} total).` +
      (scholarshipScore.hasNewGrant ? ' New/funded grant activity detected — score bumped.' : ''));
  }

  if (perClass?.some(c => c.alignment === 'Below Average')) {
    const weak = perClass.filter(c => c.alignment === 'Below Average').map(c => c.course_name).join(', ');
    lines.push(`Areas for improvement: ${weak} scored below department average — consider reviewing course delivery or materials.`);
  }

  return lines;
}

export default function WeightedScorePanel({ summary, facultyId, teachingText, formId }) {
  const [weights, setWeights] = useState(null);
  const [editWeights, setEditWeights] = useState(null);
  const [result, setResult] = useState(null);
  const [teachingScore, setTeachingScore] = useState(null);
  const [scholarshipScore, setScholarshipScore] = useState(null);
  const [perClass, setPerClass] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(`${BASE}/weighted_score/weights`).then(r => {
      setWeights(r.data);
      setEditWeights(r.data);
    });
  }, []);

  useEffect(() => {
    if (!facultyId) return;
    const params = teachingText ? `?teaching_text=${encodeURIComponent(teachingText)}` : '';
    axios.get(`${BASE}/teaching_evals/score/${facultyId}${params}`).then(r => setTeachingScore(r.data)).catch(() => {});
    axios.get(`${BASE}/weighted_score/per-class/${facultyId}`).then(r => setPerClass(r.data)).catch(() => {});
    const grantParam = formId ? `?form_id=${formId}` : '';
    axios.get(`${BASE}/weighted_score/scholarship-score/${facultyId}${grantParam}`).then(r => setScholarshipScore(r.data)).catch(() => {});
  }, [facultyId, teachingText, formId]);

  useEffect(() => {
    if (!summary || !weights) return;
    const ratings = {
      teaching: teachingScore?.score ?? summary.teaching?.rating ?? 0,
      scholarship: scholarshipScore?.score ?? summary.scholarship?.rating ?? 0,
      service: summary.service?.rating ?? 0,
      administrative: summary.administrative?.rating ?? 0,
    };
    axios.post(`${BASE}/weighted_score/calculate`, ratings)
      .then(r => setResult(r.data))
      .catch(e => setError(e.response?.data?.error || 'Calculation failed'));
  }, [summary, weights, teachingScore, scholarshipScore]);

  const handleSaveWeights = async () => {
    setError(''); setSaved(false);
    try {
      await axios.put(`${BASE}/weighted_score/weights`, editWeights);
      setWeights(editWeights);
      setSaved(true);
    } catch (e) { setError(e.response?.data?.error || 'Failed to save weights'); }
  };

  const weightTotal = editWeights ? Object.values(editWeights).reduce((s, v) => s + Number(v), 0) : 0;
  const feedback = qualitativeFeedback(teachingScore, scholarshipScore, perClass);

  if (!summary) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle1" fontWeight="bold">Weighted Final Score</Typography>

      {/* Teaching score breakdown */}
      {teachingScore && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">Teaching (from eval data)</Typography>
          <Box sx={{ display: 'flex', gap: 3, mt: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="body2">Score: <b>{teachingScore.score ?? 'N/A'}</b></Typography>
            <Typography variant="body2">Level: <b>{teachingScore.level}</b></Typography>
            {teachingScore.percentile != null && <Typography variant="body2">Percentile: <b>{teachingScore.percentile?.toFixed(1)}%</b></Typography>}
            {teachingScore.bumped && <Chip label="⬆ Bumped: course improvement" size="small" color="success" />}
          </Box>
        </Box>
      )}

      {/* Per-class breakdown */}
      {perClass.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">Per-Class Alignment</Typography>
          <Table size="small" sx={{ mt: 0.5 }}>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell align="center">Avg</TableCell>
                <TableCell align="center">Dept Avg</TableCell>
                <TableCell align="center">Diff</TableCell>
                <TableCell align="center">Alignment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {perClass.map((c, i) => (
                <TableRow key={i}>
                  <TableCell>{c.course_name}</TableCell>
                  <TableCell>{c.semester} {c.year}</TableCell>
                  <TableCell align="center">{c.class_avg?.toFixed(2)}</TableCell>
                  <TableCell align="center">{c.dept_avg?.toFixed(2)}</TableCell>
                  <TableCell align="center" sx={{ color: c.diff >= 0 ? 'success.main' : 'error.main' }}>
                    {c.diff >= 0 ? '+' : ''}{c.diff}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={c.alignment} size="small"
                      color={c.alignment === 'Above Average' ? 'success' : c.alignment === 'Below Average' ? 'error' : 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Scholarship score breakdown */}
      {scholarshipScore && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">Scholarship (from publication & grant data)</Typography>
          <Box sx={{ display: 'flex', gap: 3, mt: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="body2">Score: <b>{scholarshipScore.score}</b></Typography>
            <Typography variant="body2">Publications: <b>{scholarshipScore.pubCount}</b></Typography>
            <Typography variant="body2">Level: <b>{scholarshipScore.pubLevel}</b></Typography>
            {scholarshipScore.bumped && <Chip label="⬆ Bumped: new grant" size="small" color="success" />}
          </Box>
        </Box>
      )}

      {/* Weighted breakdown table */}
      {result && (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="center">Rating</TableCell>
              <TableCell align="center">Weight</TableCell>
              <TableCell align="center">Contribution</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {result.breakdown.map(b => (
              <TableRow key={b.category}>
                <TableCell sx={{ textTransform: 'capitalize' }}>{b.category}</TableCell>
                <TableCell align="center">{b.rating}</TableCell>
                <TableCell align="center">{b.weight}</TableCell>
                <TableCell align="center">{b.contribution.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Final Score</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{result.finalScore}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}

      {/* Final score display */}
      {result?.finalScore != null && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Final Score:</Typography>
          <Chip label={result.finalScore.toFixed(2)} color="primary" />
        </Box>
      )}

      {/* Qualitative feedback */}
      {feedback.length > 0 && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
          <Typography variant="caption" color="text.secondary">Qualitative Feedback</Typography>
          {feedback.map((line, i) => (
            <Typography key={i} variant="body2" sx={{ mt: 0.5 }}>{line}</Typography>
          ))}
        </Box>
      )}

      {/* Weight editor */}
      {editWeights && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Adjust weights (must sum to 10, current total: {weightTotal.toFixed(2)})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            {['teaching', 'scholarship', 'service', 'administrative'].map(cat => (
              <TextField key={cat} label={cat} type="number" size="small" sx={{ width: 130 }}
                value={editWeights[cat]} inputProps={{ step: 0.5, min: 0, max: 10 }}
                onChange={e => setEditWeights(prev => ({ ...prev, [cat]: Number(e.target.value) }))} />
            ))}
            <Button variant="outlined" size="small" onClick={handleSaveWeights}
              disabled={Math.abs(weightTotal - 10) > 0.01}>
              Save Weights
            </Button>
          </Box>
          {saved && <Alert severity="success" sx={{ mt: 1 }}>Weights saved.</Alert>}
          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </Box>
      )}
    </Box>
  );
}
