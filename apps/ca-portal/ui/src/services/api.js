// ui/src/services/api.js

const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;
const DATABASE_API_EXTENSION = process.env.NEXT_PUBLIC_DATABASE_API_EXTENSION;

// Basic error handler for API responses
async function handleApiResponse(response) {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
    const errorMessage = errorBody.error || errorBody.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Fetches all open positions with associated course and schedule details.
 * @returns {Promise<Array>} A promise that resolves to an array of open positions.
 */
export async function getOpenPositions() {
  console.log("Base API URL:", BASE_API_URL);
  console.log("Database API Extension:", DATABASE_API_EXTENSION);
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/open-positions`;
  console.log(`Fetching from: ${url}`); // For debugging
  
  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Fetches all users from the backend API. (temporary function until Shibb auth is implemented)
 * @returns {Promise<Array>} A promise that resolves to an array of users.
 */
export async function getAllUsers() {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file.");
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/users`;
  console.log(`Fetching from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

export async function getAllCourses() {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file.");
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/courses`;
  console.log(`Fetching from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

export async function getUserProfile(studentUID) {
  if (!studentUID) {
    throw new Error("A studentUID is required to fetch a user profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/users/${studentUID}`;
  console.log(`Fetching user profile from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

// api call to upsert (update or create) student profile
export async function upsertStudentProfile(studentData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/upsert-student-profile`;
  console.log(`Upserting student profile at: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(studentData),
  });
  return handleApiResponse(response);
}