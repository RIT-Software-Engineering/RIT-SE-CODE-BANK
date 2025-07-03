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
    link: '',
    roles: [ROLES.EMPLOYEE, ROLES.ADMIN]
  },
  {
    category: 'Personal',
    text: 'My Positions',
    link: '',
    roles: [ROLES.EMPLOYEE, ROLES.ADMIN]
  },
  {
    category: 'Personal',
    text: 'Send Message',
    link: '/Messaging',
    roles: [ROLES.CANDIDATE,ROLES.ADMIN]
  },
  // --- EMPLOYEE-SPECIFIC PERSONAL OPTIONS ---
  {
    category: 'Personal',
    text: 'Timecard',
    link: '/Timecard',
    roles: [ROLES.EMPLOYEE, ROLES.ADMIN]
  },
    {
    category: 'Personal',
    text: 'Send Message',
    link: '/Users',
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
    text: 'Manage Positions',
    link: '/Positions',
    roles: [ROLES.ADMIN]
  },
];