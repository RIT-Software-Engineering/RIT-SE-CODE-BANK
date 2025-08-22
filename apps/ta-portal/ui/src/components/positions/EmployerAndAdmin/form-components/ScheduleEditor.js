// src/components/positions/EmployerAndAdmin/form-components/ScheduleEditor.js
'use client';

import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Delete as TrashIcon } from "@mui/icons-material";

/**
 * ScheduleEditor component allows editing a weekly schedule with days and time ranges.
 * Users can add, update, and remove schedule entries, and the changes are
 * propagated to a parent component via `onSchedulesChange`.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Array<{dayOfWeek: string, startTime: string, endTime: string, id?: string|number}>} [props.initialSchedules=[]] - Initial schedule entries
 * @param {function(Array): void} props.onSchedulesChange - Callback triggered when schedules are updated
 */

export default function ScheduleEditor({
  initialSchedules = [],
  onSchedulesChange,
}) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: "Monday",
    startTime: "",
    endTime: "",
  });

  const triggerParentUpdate = (updatedSchedules) => {
    setSchedules(updatedSchedules);
    if (onSchedulesChange) {
      onSchedulesChange(updatedSchedules);
    }
  };

  const handleTimeChange = (index, field, value) => {
    const updatedSchedules = schedules.map((schedule, i) => {
      if (i === index) {
        return { ...schedule, [field]: value };
      }
      return schedule;
    });
    triggerParentUpdate(updatedSchedules);
  };

  const handleRemoveSchedule = (index) => {
    const updatedSchedules = schedules.filter((_, i) => i !== index);
    triggerParentUpdate(updatedSchedules);
  };

  const handleNewScheduleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSchedule = () => {
    if (!newSchedule.startTime || !newSchedule.endTime) {
      alert("Please set a start and end time.");
      return;
    }
    const updatedSchedules = [...schedules, newSchedule];
    triggerParentUpdate(updatedSchedules);
    setNewSchedule({ dayOfWeek: "Monday", startTime: "", endTime: "" });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
      <Typography variant="h3" gutterBottom>
        Edit Weekly Schedule
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
        {schedules.map((schedule, index) => (
          <Grid container spacing={2} key={schedule.id || index} alignItems="center">
            <Grid item xs={4}>
              <Typography sx={{ textTransform: 'capitalize' }}>
                {schedule.dayOfWeek.toLowerCase()}
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <TextField
                type="time"
                value={schedule.startTime}
                onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                type="time"
                value={schedule.endTime}
                onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={2} sx={{ textAlign: 'right' }}>
              <IconButton onClick={() => handleRemoveSchedule(index)} aria-label="Remove schedule" size="small">
                <TrashIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h3" gutterBottom>Add a New Day</Typography>
      {/* Replaced Grid with a Flexbox container for better control */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ flex: 1.5, width: '100%' }}>
          <InputLabel>Day</InputLabel>
          <Select
            name="dayOfWeek"
            label="Day"
            value={newSchedule.dayOfWeek}
            onChange={handleNewScheduleInputChange}
          >
            <MenuItem value="Monday">Monday</MenuItem>
            <MenuItem value="Tuesday">Tuesday</MenuItem>
            <MenuItem value="Wednesday">Wednesday</MenuItem>
            <MenuItem value="Thursday">Thursday</MenuItem>
            <MenuItem value="Friday">Friday</MenuItem>
          </Select>
        </FormControl>
        <TextField
          type="time"
          name="startTime"
          label="Start Time"
          value={newSchedule.startTime}
          onChange={handleNewScheduleInputChange}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1, width: '100%' }}
        />
        <TextField
          type="time"
          name="endTime"
          label="End Time"
          value={newSchedule.endTime}
          onChange={handleNewScheduleInputChange}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1, width: '100%' }}
        />
        <Button
          onClick={handleAddSchedule}
          variant="contained"
          sx={{ height: '40px', width: { xs: '100%', sm: 'auto' } }}
        >
          Add
        </Button>
      </Box>
    </Paper>
  );
}