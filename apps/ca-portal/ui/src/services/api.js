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
 * Searches for open positions using the provided search term.
 * Constructs the search URL with the search term as a query parameter,
 * sends a GET request to the backend, and returns the API response.
 *
 * @param {string} searchTerm - The term to search for open positions.
 * @returns {Promise<any>} The result of the API response handler.
 * @throws {Error} If required API URL components are not defined.
 */
export async function searchOpenPositions(searchTerm) {
  console.log("Base API URL:", BASE_API_URL);
  console.log("Database API Extension:", DATABASE_API_EXTENSION);
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file.");
  }

  const params = new URLSearchParams({term: searchTerm});
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/search-open-positions?${params.toString()}`;
  console.log(`Searching from: ${url}`);

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

export async function getUserProfile(UID) {
  if (!UID) {
    throw new Error("A UID is required to fetch a user profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/users/${UID}`;
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

// api call to apply for a job position
export async function applyForJobPosition(jobPositionApplicationData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/apply-for-job-position`;
  console.log(`Applying for job position at: ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobPositionApplicationData),
  });
  return handleApiResponse(response);
}


// api call to upsert (update or create) employer profile
export async function upsertEmployerProfile(employerData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/upsert-employer-profile`;
  console.log(`Upserting employer profile at: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employerData),
  });
  return handleApiResponse(response);
}