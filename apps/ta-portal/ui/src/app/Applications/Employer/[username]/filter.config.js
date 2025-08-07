// app/applications/Employer/[username]/filter.config.js

export const generateApplicationsFilterConfig = (semesterOptions = []) => [
  {
    id: 'status',
    label: 'Application Status',
    type: 'checkbox',
    options: ['Applied', 'Accepted Offer', 'Pending Acceptance', 'Interview', 'Onhold', 'Rejected', 'Inactive'],
  },
  {
    id: 'level',
    label: 'Course Level',
    type: 'checkbox',
    options: ["100-level", "200-level", "300-level", "400-level", "500-level", "600-level", "700-level"]
  },
  {
    id: 'semester',
    label: 'Semester',
    type: 'select',
    placeholder: 'Any Semester',
    options: semesterOptions,
    optionLabel: (semester) => `Semester ${semester}`,
  },
  {
    id: 'hasApplications',
    label: 'Has Applications',
    type: 'radio',
    options: ["Yes", "No", "Any"],
  }
];