// src/components/positions/EmployerAndAdmin/MultiStepForm.js
'use client';

import { useForm } from "react-hook-form";
import MultiStepForm from "./MultiStepForm";
import { formatTime, convertDisplayTimeToInputValue } from "@/utils/applicationUtils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

const formatDateToInputValue = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  } catch (error) {
    return "";
  }
};

const newJobTemplate = {
  location: "",
  locationType: "INPERSON",
  maxTAs: 1,
  startDate: "",
  endDate: "",
  jobSchedules: [],
  courseCode: "",
  jobPositionStatus: 'PENDING_APPROVAL',
  sectionNumber: "",
  semesterCode: "",
  gradeRequirement: null,
  courseTakenRequirement: false,
};

export default function EditPositionModal({
  job,
  onClose,
  onSave,
}) {
  const isEditMode = !!job; 

  const formMethods = useForm({
    defaultValues: isEditMode
      ? {
          ...job,
          startDate: formatDateToInputValue(job.startDate),
          endDate: formatDateToInputValue(job.endDate),
          jobSchedules: (job.jobSchedules || []).map((sch) => ({
            ...sch,
            startTime: convertDisplayTimeToInputValue(formatTime(sch.startTime)),
            endTime: convertDisplayTimeToInputValue(formatTime(sch.endTime)),
          })),
        }
      : newJobTemplate,
  });

  const onSubmit = async (data) => {
    try {
      const payload = { ...data };

      if (payload.jobPositionStatus === 'REJECTED') {
        payload.jobPositionStatus = 'PENDING_APPROVAL';
      }
      
      payload.maxTAs = parseInt(data.maxTAs, 10) || 0;

      if (payload.startDate)
        payload.startDate = new Date(`${payload.startDate}T00:00:00.000Z`);
      if (payload.endDate)
        payload.endDate = new Date(`${payload.endDate}T00:00:00.000Z`);
      if (Array.isArray(payload.jobSchedules)) {
        payload.jobSchedules = payload.jobSchedules.map((schedule) => ({
          ...schedule,
          startTime: `1970-01-01T${schedule.startTime}:00.000Z`,
          endTime: `1970-01-01T${schedule.endTime}:00.000Z`,
        }));
      } else {
        payload.jobSchedules = [];
      }

      onSave(payload);

    } catch (error) {
      console.error("Failed to prepare position data:", error);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Typography variant="h2" component="div">
          {isEditMode ? "Edit Job Position" : "Create New Job Position"}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <MultiStepForm
          onSubmit={onSubmit}
          onClose={onClose}
          isEditMode={isEditMode}
          job={job}
          formMethods={formMethods}
        />
      </DialogContent>
    </Dialog>
  );
}