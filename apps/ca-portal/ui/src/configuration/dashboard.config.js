// src/app/dashboard.config.js

// export const ROLES = {
//   STUDENT: 'STUDENT',
//   CA: 'CA'
// };

export const ROLES = {
  STUDENT: "STUDENT",
  CA: "CA",
  ADMIN: "ADMIN",
  FACULTY: "FACULTY",
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
    roles: [ROLES.CA]
  },
  {
    category: 'Personal',
    text: 'My Positions',
    link: '',
    roles: [ROLES.CA]
  },
  {
    category: 'Personal',
    text: 'Send Message',
    link: '/Messaging',
    roles: [ROLES.STUDENT]
  },
  // --- CA-SPECIFIC PERSONAL OPTIONS ---
  {
    category: 'Personal',
    text: 'Timecard',
    link: '/Timecard',
    roles: [ROLES.CA]
  },
    {
    category: 'Personal',
    text: 'Send Message',
    link: '/Users',
    roles: [ROLES.CA]
  },

  // --- EXPLORE SECTION ---
  {
    category: 'Explore',
    text: 'Find Positions',
    link: '/Positions', 
    isLarge: true, // Custom flag to render the big button style
    roles: [ROLES.STUDENT, ROLES.CA]
  }
];