/**
 * The single source of truth for all grade-related data.
 * - label: The user-facing string (e.g., 'A-').
 * - value: The internal enum used for storage and APIs (e.g., 'A_MINUS').
 * - comparisonValue: The numeric value for validation (e.g., is A > B+).
 */
export const gradeData = [
  { label: 'A',  value: 'A',       comparisonValue: 10 },
  { label: 'A-', value: 'A_MINUS', comparisonValue: 9 },
  { label: 'B+', value: 'B_PLUS',  comparisonValue: 8 },
  { label: 'B',  value: 'B',       comparisonValue: 7 },
  { label: 'B-', value: 'B_MINUS', comparisonValue: 6 },
  { label: 'C+', value: 'C_PLUS',  comparisonValue: 5 },
  { label: 'C',  value: 'C',       comparisonValue: 4 },
  { label: 'C-', value: 'C_MINUS', comparisonValue: 3 },
  { label: 'D',  value: 'D',       comparisonValue: 2 },
  { label: 'F',  value: 'F',       comparisonValue: 1 },
];

// --- GENERATED HELPER MAPS ---
// These are created programmatically from `gradeData` for performance and convenience.

// For populating UI selectors (e.g., the new GradeSelector component)
export const gradeOptions = gradeData.map(({ label, value }) => ({ label, value }));

// For converting an enum to a display string (e.g., 'A_MINUS' -> 'A-')
export const gradeEnumToStringValue = gradeData.reduce((acc, grade) => {
  acc[grade.value] = grade.label;
  return acc;
}, {});

// For converting a display string back to an enum (e.g., 'A-' -> 'A_MINUS')
export const gradeStringToEnumValue = gradeData.reduce((acc, grade) => {
  acc[grade.label] = grade.value;
  return acc;
}, {});

// For validation logic (e.g., is 'A-' > 'B+')
export const letterToGradeValue = gradeData.reduce((acc, grade) => {
  acc[grade.label] = grade.comparisonValue;
  return acc;
}, {});