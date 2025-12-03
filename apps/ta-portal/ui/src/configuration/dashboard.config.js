// src/app/dashboard.config.js

import { FEATURES } from './featureFlags';

export const ROLES = {
  CANDIDATE: "CANDIDATE",
  EMPLOYEE: "EMPLOYEE",
  ADMIN: "ADMIN",
  EMPLOYER: "EMPLOYER",
}

// Used to map roles options in the Login component
export const ROLES_ARRAY = Object.values(ROLES);

// Define all possible dashboard options
export const DASHBOARD_OPTIONS = [
  // --- PERSONAL SECTION ---
  {
    category: 'Personal',
    text: 'Kronos',
    link: 'https://kronosapps.rit.edu/kronosTimecard/login',
    roles: [ROLES.EMPLOYEE, ROLES.ADMIN],
    feature: FEATURES.KRONOS
  },
  {
    category: 'Personal',
    text: 'Oracle',
    link: 'https://myinfo.rit.edu',
    roles: [ROLES.EMPLOYEE, ROLES.ADMIN],
    feature: FEATURES.ORACLE
  },
  {
    category: 'Personal',
    text: 'Send Message',
    link: '/Messaging',
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.EMPLOYER, ROLES.ADMIN],
    feature: FEATURES.MESSAGING
  },
  {
    category: 'Personal',
    text: 'View Timecards',
    link: '/Timecard/Admin/[username]',
    roles: [ROLES.ADMIN],
    feature: FEATURES.TIMECARD
  },
  {
    category: 'Personal',
    text: 'View Timecards',
    link: '/Timecard/Employer/[username]',
    roles: [ROLES.EMPLOYER],
    feature: FEATURES.TIMECARD
  },
  // --- EMPLOYEE-SPECIFIC PERSONAL OPTIONS ---
  {
    category: 'Personal',
    text: 'My Timecards',
    link: '/Timecard/Employee/[username]',
    roles: [ROLES.EMPLOYEE],
    feature: FEATURES.TIMECARD
  },
  {
    category: 'Personal',
    text: 'My Applications',
    link: '/Applications/Employee/[username]',
    roles: [ROLES.EMPLOYEE],
    feature: FEATURES.APPLICATIONS
  },
  // --- ADMIN-SPECIFIC PERSONAL OPTIONS ---
  {
    category: 'Personal',
    text: 'Manage Users',
    link: '/Users',
    roles: [ROLES.ADMIN]
  },
  {
    category: 'Personal',
    text: 'Manage Positions',
    link: '/Positions/Admin/[username]?tab=my-positions',
    roles: [ROLES.ADMIN],
    feature: FEATURES.POSITIONS
  },
  {
    category: 'Personal',
    text: 'Manage Applications',
    link: '/Applications/Admin/[username]',
    roles: [ROLES.ADMIN],
    feature: FEATURES.APPLICATIONS
  },
  // --- EMPLOYER SPECIFIC OPTIONS ---
  {
    category: 'Personal',
    text: 'View Applications',
    link: '/Applications/Employer/[username]',
    roles: [ROLES.EMPLOYER],
    feature: FEATURES.APPLICATIONS
  },
  {
    category: 'Personal',
    text: 'Manage Positions',
    link: '/Positions/Employer/[username]?tab=my-positions',
    roles: [ROLES.EMPLOYER],
    feature: FEATURES.POSITIONS
  },
  // --- CANDIDATE-SPECIFIC OPTIONS ---
  {
    category: 'Personal',
    text: 'My Applications',
    link: '/Applications/Candidate/[username]',
    roles: [ROLES.CANDIDATE],
    feature: FEATURES.APPLICATIONS
  },
  // --- WORKFLOWS (ALL ROLES) ---
  {
    category: 'Personal',
    text: 'My Workflows',
    link: '/Workflows/[username]',
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.EMPLOYER, ROLES.ADMIN]
  },
];