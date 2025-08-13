// src/app/dashboard.config.js

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
    roles: [ROLES.EMPLOYEE, ROLES.ADMIN]
  },
  {
    category: 'Personal',
    text: 'Oracle',
    link: 'https://myinfo.rit.edu',
    roles: [ROLES.EMPLOYEE, ROLES.ADMIN]
  },
  {
    category: 'Personal',
    text: 'Send Message',
    link: '/Messaging',
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.EMPLOYER, ROLES.ADMIN]
  },
  {
    category: 'Personal',
    text: 'View Timecards',
    link: '/Timecard/Admin/[username]',
    roles: [ROLES.ADMIN]
  },
  {
    category: 'Personal',
    text: 'View Timecards',
    link: '/Timecard/Employer/[username]',
    roles: [ROLES.EMPLOYER]
  },
  {
    category: 'Personal',
    text: 'Manage Profile',
    link: '/Profile',
    roles: [ROLES.CANDIDATE, ROLES.EMPLOYEE, ROLES.EMPLOYER, ROLES.ADMIN]
  },
  // --- EMPLOYEE-SPECIFIC PERSONAL OPTIONS ---
  {
    category: 'Personal',
    text: 'My Timecards',
    link: '/Timecard/Employee/[username]',
    roles: [ROLES.EMPLOYEE]
  },
  {
    category: 'Personal',
    text: 'My Applications',
    link: '/Applications/Employee/[username]',
    roles: [ROLES.EMPLOYEE]
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
    text: 'Manage My Positions',
    link: '/Positions/Admin/[username]?tab=my-positions',
    roles: [ROLES.ADMIN]
  },
  {
    category: 'Personal',
    text: 'Hire Candidate',
    link: '/Applications/Admin/[username]?tab=hiring',
    roles: [ROLES.ADMIN]
  },
  {
    category: 'Personal',
    text: 'Manage All Positions',
    link: '/Positions/Admin/[username]?tab=all-positions',
    roles: [ROLES.ADMIN]
  },
  {
    category: 'Personal',
    text: 'View Applications',
    link: '/Applications/Admin/[username]?tab=applications',
    roles: [ROLES.ADMIN]
  },
  // --- EMPLOYER SPECIFIC OPTIONS ---
  {
    category: 'Personal',
    text: 'View Applications',
    link: '/Applications/Employer/[username]',
    roles: [ROLES.EMPLOYER],
  },
  {
    category: 'Personal',
    text: 'Manage My Positions',
    link: '/Positions/Employer/[username]?tab=my-positions',
    roles: [ROLES.EMPLOYER]
  },
  // --- CANDIDATE-SPECIFIC OPTIONS ---
  {
    category: 'Personal',
    text: 'My Applications',
    link: '/Applications/Candidate/[username]',
    roles: [ROLES.CANDIDATE],
  },
];