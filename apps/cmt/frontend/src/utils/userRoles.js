// src/utils/userRoles.js

/**
 * Check if user has a specific role
 */
export function hasRole(user, role) {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
}

/**
 * Check if user is a professor/instructor
 */
export function isProfessor(user) {
  return hasRole(user, 'instructor') || hasRole(user, 'professor');
}

/**
 * Check if user is a student
 */
export function isStudent(user) {
  return hasRole(user, 'student');
}

/**
 * Check if user is a TA
 */
export function isTA(user) {
  return hasRole(user, 'ta');
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user, roles) {
  if (!user || !user.roles) return false;
  return roles.some(role => user.roles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user, roles) {
  if (!user || !user.roles) return false;
  return roles.every(role => user.roles.includes(role));
}

/**
 * Get user's primary role (first role in array)
 */
export function getPrimaryRole(user) {
  if (!user || !user.roles || user.roles.length === 0) return null;
  return user.roles[0];
}

/**
 * Check if user can edit (professor, TA, or admin)
 */
export function canEdit(user) {
  return hasAnyRole(user, ['instructor', 'professor', 'ta', 'admin']);
}

/**
 * Check if user can only view (student)
 */
export function isViewOnly(user) {
  return isStudent(user) && !canEdit(user);
}