// ui/src/services/api.js

const BASE_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL + process.env.NEXT_PUBLIC_API_EXTENSION;
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
export async function searchAndFilterOpenPositions(
  searchTerm,
  appliedFilters,
  candidateUID
) {
  console.log("Base API URL:", BASE_API_URL);
  console.log("Database API Extension:", DATABASE_API_EXTENSION);
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file."
    );
  }

  const params = new URLSearchParams({
    searchTerm: searchTerm,
    filters: JSON.stringify(appliedFilters),
    candidateUID: candidateUID,
  });
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/search-and-filter-open-positions?${params.toString()}`;
  console.log(`Searching from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

export async function modifyPosition(jobID, positionData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
 
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/modify-position/${jobID}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    // Pass the positionData to be stringified
    body: JSON.stringify(positionData),
  });

  // Check if the request was successful
  if (!response.ok) {
    // Throw an error to be caught by the calling function
    throw new Error(`API call failed with status: ${response.status}`);
  }

  // Parse the JSON from the response and return it
  return response.json();
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

export async function getCandidateApplications(UID) {
  if (!UID) {
    throw new Error("A UID is required to fetch a user profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/${UID}`;
  console.log(`Fetching user profile from: ${url}`);
  const response = await fetch(url);
  return handleApiResponse(response);
}

export async function getCandidateApplicationsForFaculty(employeerUID) {
  if (!employeerUID) {
    throw new Error("A UID is required to fetch a user profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/employer/${employeerUID}`;
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
export async function applyForJobPositionWithNewResume(jobPositionApplicationData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/apply-for-job-position-with-new-resume`;
  console.log(`Applying for job position at: ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    body: jobPositionApplicationData, 
  });

  return handleApiResponse(response);
}

/**
 * Deletes a candidate's application for a specific job position.
 * @param {number} candidateUID - The UID of the candidate withdrawing the application.
 * @param {string} jobPositionId - The ID of the job position to withdraw from.
 * @returns {Promise<object>} A promise that resolves to the data of the deleted application record.
 */
export async function deleteApplication(candidateUID, jobPositionId) {
  // 1. Validate the inputs
  if (!candidateUID || !jobPositionId) {
    throw new Error("Candidate UID and Job Position ID are required to delete an application.");
  }
  
  // 2. Check for environment variables
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  // 3. Construct the correct URL with path and query parameters
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/${candidateUID}?jobPositionId=${jobPositionId}`;
  console.log(`Deleting application at: ${url}`); // For debugging

  // 4. Make the DELETE request using fetch
  const response = await fetch(url, {
    method: 'DELETE',
  });

  // 5. Process the response
  return handleApiResponse(response);
}


// api call to upsert (update or create) employer profile
export async function upsertEmployerProfile(employerData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/upsert-employer-profile`;
  console.log(`Upserting employer profile at: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employerData),
  });
  return handleApiResponse(response);
}
