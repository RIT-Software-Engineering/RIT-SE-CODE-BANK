// app/applications/Employer/[username]/filter.config.js

/**
 * Generates the configuration array for the application filtering UI for the employer view.
 * This function dynamically populates the semester filter based on the provided options.
 *
 * @param {string[]} [semesterOptions=[]] - An array of semester code strings (e.g., ['2241', '2235'])
 * to be used as options for the semester dropdown filter.
 * @returns {object[]} An array of objects, where each object defines a filter's properties,
 * such as its ID, display label, type (e.g., 'checkbox', 'select'), and available options.
 */
export const generateApplicationsFilterConfig = (semesterOptions = []) => [
  {
    id: 'status',
    label: 'Application Status',
    type: 'checkbox',
    options: ['Applied', 'Accepted Offer', 'Declined Offer', 'Hired', 'Pending Offer', 'Interview', 'Onhold', 'Rejected', 'Inactive'],
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