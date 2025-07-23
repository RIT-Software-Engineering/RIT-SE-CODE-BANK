// ui/src/services/api.js

const BASE_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL + process.env.NEXT_PUBLIC_API_EXTENSION;
const DATABASE_API_EXTENSION = process.env.NEXT_PUBLIC_DATABASE_API_EXTENSION;

// Basic error handler for API responses
async function handleApiResponse(response) {
  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    const errorMessage =
      errorBody.error ||
      errorBody.message ||
      `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Fetches all open positions with associated course and schedule details.
 * @returns {Promise<Array>} A promise that resolves to an array of open positions.
 */
export async function getOpenPositions() {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/open-positions`;
  console.log(`Fetching from: ${url}`); // For debugging

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Searches and filters for open positions using the provided search term and applied filters.
 * Constructs the search URL with the search term as a query parameter,
 * sends a GET request to the backend, and returns the API response.
 *
 * @param {string} searchTerm - The term to search for open positions.
 * @param {Object} appliedFilters - The filters applied to the search.
 * @param {number} candidateUID - The UID of the candidate.
 * @returns {Promise<any>} The result of the API response handler.
 * @throws {Error} If required API URL components are not defined.
 */
export async function searchAndFilterOpenPositions(searchTerm, appliedFilters, candidateUID) {
  console.log("Base API URL:", BASE_API_URL);
  console.log("Database API Extension:", DATABASE_API_EXTENSION);
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file."
    );
  }

  const params = new URLSearchParams({ searchTerm: searchTerm, filters: JSON.stringify(appliedFilters), candidateUID: candidateUID});
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/search-and-filter-open-positions?${params.toString()}`;
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
    throw new Error(
      "Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file."
    );
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/users`;
  console.log(`Fetching from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

export async function getAllCourses() {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file."
    );
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
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/users/${UID}`;
  console.log(`Fetching user profile from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

export async function getCandidateApplications(employeerUID) {
  if (!employeerUID) {
    throw new Error("A UID is required to fetch a user profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/${employeerUID}`;
  console.log(`Fetching user profile from: ${url}`);
  const response = await fetch(url);
  return handleApiResponse(response);
}

// api call to upsert (update or create) candidate profile
export async function upsertCandidateProfile(candidateData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/upsert-candidate-profile`;
  console.log(`Upserting candidate profile at: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(candidateData),
  });
  return handleApiResponse(response);
}

// api call to apply for a job position
export async function applyForJobPosition(jobPositionApplicationData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/apply-for-job-position`;
  console.log(`Applying for job position at: ${url}`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobPositionApplicationData),
  });
  return handleApiResponse(response);
}

// api call to apply for a job position with a new resume
export async function applyForJobPositionWithNewResume(formData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/apply-for-job-position-with-new-resume`;
  console.log(`Applying for job position at: ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    body: formData, 
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

/**
 * Fetches the current weekly timecard for a given job.
 * @param {number} jobPositionHistoryId - The ID of the job history record.
 * @returns {Promise<object>} A promise that resolves to the timecard data.
 */
export async function getEmployeeTimecard(jobPositionHistoryId) {
    if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
      throw new Error("Backend API URL components are not defined.");
    }
  
    const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/timecard/${jobPositionHistoryId}`;
  
    const response = await fetch(url);
    return handleApiResponse(response);
  }

/**
 * Fetches the most recent timecard for a given job position history ID.
 * @param {number} jobPositionHistoryId - The ID of the job history record.
 * @returns {Promise<object>} A promise that resolves to the timecard data.
 */
export async function getMostRecentTimecard(jobPositionHistoryId) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/timecard/most-recent/${jobPositionHistoryId}`;
  console.log(`Fetching most recent timecard from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Creates or updates a single day's entry, primarily for saving notes.
 * @param {object} dayData - The data for the day, including jobPositionHistoryId, date, and notes.
 * @returns {Promise<object>}
 */
export async function upsertTimecardDay(dayData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
      throw new Error("Backend API URL components are not defined.");
    }
    
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/timecard/day/notes`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dayData),
  });
  return handleApiResponse(response);
}

/**
 * Submits a weekly timecard for an employee.
 * @param {object} timecardData - The payload containing jobPositionHistoryId and time entries.
 * @returns {Promise<object>} A promise that resolves to the server's response.
 */
export async function upsertTimecard(timecardData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/upsert-timecard`;
  console.log(`Submitting timecard to: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(timecardData),
  });
  return handleApiResponse(response);
}