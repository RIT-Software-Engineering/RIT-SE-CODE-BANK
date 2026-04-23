// ui/src/services/db-apis.js

// --- API Configuration ---
const BASE_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL + process.env.NEXT_PUBLIC_API_EXTENSION;
const DATABASE_API_EXTENSION = process.env.NEXT_PUBLIC_DATABASE_API_EXTENSION;

/**
 * A centralized handler for processing API fetch responses.
 * It checks for successful responses and parses the JSON body.
 * For failed responses, it attempts to parse an error message from the body.
 * @param {Response} response - The raw Response object from a fetch call.
 * @returns {Promise<any>} A promise that resolves to the JSON body of the response.
 * @throws {Error} Throws an error with a message from the API or a generic status error.
 */
async function handleApiResponse(response) {
  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    console.log("API error body:", errorBody);

    // Prefer a concise 'name' from the backend when available
    const conciseName = errorBody.name || null;
    const errorMessage =
      errorBody.error ||
      errorBody.message ||
      `HTTP error! status: ${response.status}`;

    sessionStorage.setItem(
      "errorDetails",
      JSON.stringify({
        // Use name if available (short label), else fall back to the concise message
        name: conciseName,
        error: errorMessage,
        statusCode: response.status,
        url: response.url,
        timestamp: new Date().toISOString(),
        // prefer backend stack if provided, else fallback to frontend
        stack:
          typeof errorBody.stack === "string"
            ? errorBody.stack // backend trace in dev
            : new Error().stack, // fallback frontend trace
      })
    );

    window.location.href = "/Error";
    // Throw the concise name (if present) or the message to keep console errors readable
    throw new Error(conciseName || errorMessage);
  }
  return response.json();
}

// ====================================================================================
// User & Authentication Management
// ====================================================================================

/**
 * Authenticates a user by sending their username and password to the backend.
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} A promise that resolves to the authenticated user's data.
 */
export async function authenticateUser(username, password) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/login`;
  console.log(`Authenticating user at: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  return handleApiResponse(response);
}

/**
 * Sends a request to reset a user's password.
 * @param {string} username - The username of the user resetting their password.
 * @param {string} newPassword - The new password to set.
 * @returns {Promise<object>} A promise that resolves to the server's confirmation message.
 */
export async function resetPassword(username, newPassword) {
  if (!username || !newPassword) {
    throw new Error("Token and new password are required.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/reset-password`;
  console.log(`Resetting password at: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, newPassword }),
  });

  return handleApiResponse(response);
}

/**
 * Fetches a list of all users from the database.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
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

/**
 * Retrieves basic information for a single user by their username.
 * @param {string} Username - The username of the user to fetch.
 * @returns {Promise<object>} A promise that resolves to the user's basic information.
 */
export async function getUser(Username) {
  if (!Username) {
    throw new Error("A Username is required to fetch a user.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/user/${Username}`;
  console.log(`Fetching user at: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Fetches the detailed user profile (candidate or employer) by username.
 * @param {string} Username - The username of the user whose profile is being fetched.
 * @returns {Promise<object>} A promise that resolves to the detailed user profile data.
 */
export async function getUserProfile(Username) {
  if (!Username) {
    throw new Error("A Username is required to fetch a user profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/user-profile/${Username}`;
  console.log(`Fetching user profile from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Creates a new candidate profile with the provided data.
 * @param {object} candidateData - An object containing all necessary data for a new candidate.
 * @returns {Promise<object>} A promise that resolves to the newly created candidate profile.
 */
export async function createCandidateProfile(candidateData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/candidate-profile`;
  console.log(`Creating candidate profile at: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(candidateData),
  });
  return handleApiResponse(response);
}

/**
 * Updates an existing candidate's profile information.
 * @param {object} candidateData - An object containing the candidate's username and the fields to update.
 * @returns {Promise<object>} A promise that resolves to the updated candidate profile.
 */
export async function updateCandidateProfile(candidateData) {
  if (!candidateData.username) {
    throw new Error("A username is required to update a profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/candidate-profile/${candidateData.username}`;
  console.log(`Updating candidate profile at: ${url}`);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(candidateData),
  });
  return handleApiResponse(response);
}

/**
 * Creates a new employer profile with the provided data.
 * @param {object} employerData - An object containing all necessary data for a new employer.
 * @returns {Promise<object>} A promise that resolves to the newly created employer profile.
 */
export async function createEmployerProfile(employerData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/employer-profile`;
  console.log(`Creating employer profile at: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employerData),
  });
  return handleApiResponse(response);
}

/**
 * Updates an existing employer's profile information.
 * @param {object} employerData - An object containing the employer's username and the fields to update.
 * @returns {Promise<object>} A promise that resolves to the updated employer profile.
 */
export async function updateEmployerProfile(employerData) {
  if (!employerData.username) {
    throw new Error("A username is required to update a profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/employer-profile/${employerData.username}`;
  console.log(`Updating employer profile at: ${url}`);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employerData),
  });
  return handleApiResponse(response);
}

// ====================================================================================
// Job Position Management
// ====================================================================================

/**
 * Searches and filters for open job positions available to a candidate.
 * @param {string} [searchTerm=""] - The term to search for.
 * @param {object} [appliedFilters={}] - An object of filters to apply to the search.
 * @param {string} candidateUsername - The username of the candidate performing the search.
 * @returns {Promise<Array>} A promise that resolves to an array of open job positions.
 */
export async function getOpenJobPositions(
  searchTerm = "",
  appliedFilters = {},
  candidateUsername
) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file."
    );
  }
  const params = new URLSearchParams({
    searchTerm: searchTerm,
    filters: JSON.stringify(appliedFilters),
    candidateUsername: candidateUsername,
  });

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/positions/open?${params.toString()}`;
  console.log(`Searching from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Retrieves all job positions created by a specific owner (employer/admin).
 * @param {string} ownerUsername - The username of the position owner.
 * @param {string} [searchTerm=""] - The term to search for within the owned positions.
 * @param {object} [appliedFilters={}] - An object of filters to apply.
 * @returns {Promise<Array>} A promise that resolves to an array of job positions.
 */
export async function getPositionsByOwner(
  ownerUsername,
  searchTerm = "",
  appliedFilters = {}
) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file."
    );
  }
  if (!ownerUsername) {
    throw new Error(
      "An owner's username is required to fetch their positions."
    );
  }

  const params = new URLSearchParams({
    searchTerm: searchTerm,
    filters: JSON.stringify(appliedFilters),
  });

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/positions/owner/${ownerUsername}?${params.toString()}`;

  console.log(`Fetching owned positions from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Retrieves all job positions in the system, with optional search and filters.
 * @param {string} [searchTerm=""] - A term to search for.
 * @param {object} [appliedFilters={}] - An object of filters to apply.
 * @returns {Promise<Array>} A promise that resolves to an array of all job positions.
 */
export async function getAllPositions(searchTerm = "", appliedFilters = {}) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const params = new URLSearchParams({
    searchTerm: searchTerm,
    filters: JSON.stringify(appliedFilters),
  });
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/positions?${params.toString()}`;
  console.log(`Fetching all positions from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Creates a new job position with the provided position and employer data.
 * @param {object} positionData - An object containing the details of the new position.
 * @param {object} employerData - An object containing details of the creating employer.
 * @returns {Promise<object>} A promise that resolves to the newly created position.
 */
export async function createPosition(positionData, employerData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/positions`;
  console.log(`Creating position at: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ positionData, employerData }),
  });

  return handleApiResponse(response);
}

/**
 * Updates an existing job position's details and adds an update note (refered to as a comment).
 * @param {string} jobID - The ID of the job position to update.
 * @param {object} positionData - An object with the new data for the position.
 * @param {object} commentData - An object with details for the update comment.
 * @returns {Promise<object>} A promise that resolves to the updated position data.
 */
export async function updatePosition(jobID, positionData, commentData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/positions/${jobID}`;
  console.log(`Updating position at: ${url}`);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ positionData, commentData }),
  });

  return handleApiResponse(response);
}

/**
 * Updates the status of a specific job position (e.g., 'APPROVED', 'REJECTED').
 * @param {string} jobID - The ID of the job position to update.
 * @param {string} status - The new status to set for the position.
 * @param {object} commentData - An object containing details for the update comment.
 * @returns {Promise<object>} A promise that resolves to the updated position data.
 */
export async function updatePositionStatus(jobID, status, commentData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  if (!jobID || !status || !commentData) {
    throw new Error(
      "A job ID, status, and comment data are required to update the status."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/positions/${jobID}/status`;
  console.log(`Updating status for job ${jobID} at: ${url}`);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, commentData }),
  });

  return handleApiResponse(response);
}

/**
 * Checks if a specific job position has reached its hiring capacity.
 * @param {string} jobPositionId - The ID of the job position to check.
 * @returns {Promise<{isFull: boolean}>} A promise that resolves to an object indicating if the position is full.
 */
export async function checkJobPositionIsFull(jobPositionId) {
  if (!jobPositionId) {
    throw new Error("A Job Position ID is required to check if it is full.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/positions/${jobPositionId}/is-full`;
  console.log(`Checking if job position is full at: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

// ====================================================================================
// Application Management
// ====================================================================================

/**
 * Submits a job application using the candidate's existing primary resume.
 * @param {object} jobPositionApplicationData - The data for the job application.
 * @returns {Promise<object>} A promise that resolves to the newly created application record.
 */
export async function applyForJobPosition(jobPositionApplicationData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/apply`;
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

/**
 * Submits a job application along with new file uploads (e.g., resume, cover letter).
 * @param {FormData} jobPositionApplicationData - The form data containing application details and files.
 * @returns {Promise<object>} A promise that resolves to the newly created application record.
 */
export async function applyForJobPositionWithNewUploads(
  jobPositionApplicationData
) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/apply-with-uploads`;
  console.log(`Applying for job position at: ${url}`);
  const response = await fetch(url, {
    method: "POST",
    body: jobPositionApplicationData,
  });

  return handleApiResponse(response);
}

/**
 * Retrieves, searches, and filters applications for the currently logged-in candidate.
 * @param {string} searchTerm - The term to search for within the applications.
 * @param {object} appliedFilters - An object of filters to apply.
 * @param {string} candidateUsername - The username of the candidate.
 * @returns {Promise<Array>} A promise that resolves to an array of the candidate's applications.
 */
export async function getCandidateApplicationsAsCandidate(
  searchTerm,
  appliedFilters,
  candidateUsername
) {
  if (!candidateUsername) {
    throw new Error("A Username is required to fetch a user profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const params = new URLSearchParams({
    searchTerm: searchTerm,
    filters: JSON.stringify(appliedFilters),
    candidateUsername: candidateUsername,
  });
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/candidate?${params.toString()}`;
  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Retrieves, searches, and filters applications for positions owned by an employer.
 * @param {string} searchTerm - The term to search for.
 * @param {string} searchBy - The field to search by (e.g., candidate name).
 * @param {object} appliedFilters - An object of filters to apply.
 * @param {string} employerUsername - The username of the employer.
 * @returns {Promise<Array>} A promise that resolves to an array of applications for the employer.
 */
export async function getCandidateApplicationsAsEmployer(
  searchTerm,
  searchBy,
  appliedFilters,
  employerUsername
) {
  if (!employerUsername) {
    throw new Error("A Username is required to fetch a user profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const params = new URLSearchParams({
    searchTerm: searchTerm,
    searchBy: searchBy,
    filters: JSON.stringify(appliedFilters),
    employerUsername: employerUsername,
  });
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/employer?${params.toString()}`;
  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Retrieves applications with "ACCEPTED_OFFER" status for admin hiring review.
 * @returns {Promise<Array>} A promise that resolves to an array of applications ready for admin action.
 */
export async function getCandidateApplicationsAsAdmin() {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/admin`;
  console.log(`Fetching admin applications from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Fetches ALL applications across the system for admin viewing, regardless of status.
 * Supports search and filtering by course, student, status, level, and semester.
 * @param {string} search - The search term (course code/name or student name).
 * @param {string} searchType - The type of search ("course" or "student").
 * @param {object} filters - Object containing filters (status, level, semester, hasApplications).
 * @returns {Promise<Array>} A promise that resolves to an array of all job positions with applications.
 */
export async function getAllApplicationsForAdmin(search = '', searchType = 'course', filters = {}) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  // Build query string
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (searchType) params.append('searchType', searchType);
  if (filters.status && filters.status.length > 0) {
    params.append('status', filters.status.join(','));
  }
  if (filters.level && filters.level.length > 0) {
    params.append('level', filters.level.join(','));
  }
  if (filters.semester) params.append('semester', filters.semester);
  if (filters.hasApplications) params.append('hasApplications', filters.hasApplications);

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/admin/all?${params.toString()}`;
  console.log(`Fetching all applications for admin from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Updates the status of a specific job application and adds a comment.
 * @param {string} author - The username of the person making the update.
 * @param {number|string} applicationId - The ID of the application to update.
 * @param {string} status - The new status to set.
 * @param {string} comments - The comments related to the status change.
 * @returns {Promise<object>} A promise that resolves to the updated application record.
 */
export async function updateCandidateApplicationStatus(
  author,
  applicationId,
  status,
  comments
) {
  if (!applicationId) {
    throw new Error(
      "An application ID is required to update an application status."
    );
  }
  if (!status) {
    throw new Error("A status is required to update an application status.");
  }
  if (!author) {
    throw new Error("An author is required to update an application status.");
  }

  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/${applicationId}`;
  console.log(`Updating application status at: ${url}`);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      author: author,
      status: status,
      comments: comments,
    }),
  });
  return handleApiResponse(response);
}

/**
 * Deletes a candidate's application for a specific job position.
 * @param {string} candidateUsername - The username of the candidate deleting the application.
 * @param {string} jobPositionId - The ID of the job position associated with the application.
 * @returns {Promise<object>} A promise that resolves to a confirmation of the deletion.
 */
export async function deleteApplication(candidateUsername, jobPositionId) {
  if (!candidateUsername || !jobPositionId) {
    throw new Error(
      "Candidate Username and Job Position ID are required to delete an application."
    );
  }

  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/${candidateUsername}?jobPositionId=${jobPositionId}`;
  console.log(`Deleting application at: ${url}`);

  const response = await fetch(url, {
    method: "DELETE",
  });

  return handleApiResponse(response);
}

// ====================================================================================
// Application Notes
// ====================================================================================

/**
 * Sets the note of an application.
 * @param {Number} applicationId - ID of the target application
 * @param {String} newNote - Note that will replace the old one
 * @returns {Promise<object>} A promise that resolves to the updated application note.
 */
export async function setApplicationNote(applicationId,newNote) {
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/notes/${applicationId}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      newNote
    }),
  });
  return handleApiResponse(response);
}

/**
 * Gets the note connected to the given application.
 * @param {Number} applicationId - ID of the relevant Application
 * @returns {Promise<object>} A promise that resolves to the updated application note.
 */
export async function getApplicationNote(applicationId){
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/notes/${applicationId}`;
  const response = await fetch(url, {
    method: "GET",
  });
  return handleApiResponse(response);
}

// ====================================================================================
// Hiring & Employee Management
// ====================================================================================

/**
 * Finalizes the hiring of a candidate for a job position, promoting them to an employee.
 * @param {string} candidateUsername - The username of the candidate being hired.
 * @param {number|string} applicationId - The ID of the application.
 * @param {string} jobPositionId - The ID of the job position.
 * @param {number} employeeId - The employee ID to assign to the new employee.
 * @param {object} messageData - An object with details for the hiring comment.
 * @returns {Promise<object>} A promise that resolves to the updated application record.
 */
export async function hireCandidate(
  candidateUsername,
  applicationId,
  jobPositionId,
  messageData
) {
  if (
    !candidateUsername ||
    !applicationId ||
    !jobPositionId ||
    !messageData
  ) {
    throw new Error(
      "Missing required fields: candidateUsername, applicationId, jobPositionId, and messageData are all required."
    );
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/hire`;
  console.log(`Hiring candidate via: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      candidateUsername,
      applicationId,
      jobPositionId,
      messageData,
    }),
  });

  return handleApiResponse(response);
}

/**
 * Checks if a candidate has already been hired for any position within a specific semester.
 * @param {string} candidateUsername - The username of the candidate to check.
 * @param {string} semestercode - The semester code to check against.
 * @returns {Promise<object>} A promise that resolves to an object indicating the hired status.
 */
export async function getCandidateHiredStatus(candidateUsername, semestercode) {
  if (!candidateUsername) {
    throw new Error(
      "A Username is required to see a candidate's hired status."
    );
  }
  if (!semestercode) {
    throw new Error(
      "A Semester Code is required to see a candidate's hired status."
    );
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/candidate/${candidateUsername}/hired-status?semesterCode=${semestercode}`;
  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Terminates an employee, updating their job history status.
 * @param {string} username - The username of the employee to terminate.
 * @returns {Promise<object>} A promise that resolves to the updated user profile.
 */
export async function terminateEmployee(username) {
  if (!username) {
    throw new Error("A username is required to terminate an employee.");
  }

  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/terminate-employee/${username}`;
  console.log(`Terminating employee at: ${url}`);

  const response = await fetch(url, {
    method: "PUT",
  });

  return handleApiResponse(response);
}

// ====================================================================================
// Resume Management
// ====================================================================================

export async function getResumeById(resumeId) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/resume/${resumeId}`;
  console.log(`Getting candidate resume with id: ${resumeId}`)

  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    console.log("API error body:", errorBody);

    // Prefer a concise 'name' from the backend when available
    const conciseName = errorBody.name || null;
    const errorMessage =
      errorBody.error ||
      errorBody.message ||
      `HTTP error! status: ${response.status}`;

    sessionStorage.setItem(
      "errorDetails",
      JSON.stringify({
        // Use name if available (short label), else fall back to the concise message
        name: conciseName,
        error: errorMessage,
        statusCode: response.status,
        url: response.url,
        timestamp: new Date().toISOString(),
        // prefer backend stack if provided, else fallback to frontend
        stack:
          typeof errorBody.stack === "string"
            ? errorBody.stack // backend trace in dev
            : new Error().stack, // fallback frontend trace
      })
    );

    window.location.href = "/Error";
    // Throw the concise name (if present) or the message to keep console errors readable
    throw new Error(conciseName || errorMessage);
  }

  return response;
}

export async function getCoverLetterById(coverLetterId) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/cover-letter/${coverLetterId}`;
  console.log(`Getting candidate cover letter with id: ${coverLetterId}`)

  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    console.log("API error body:", errorBody);

    // Prefer a concise 'name' from the backend when available
    const conciseName = errorBody.name || null;
    const errorMessage =
      errorBody.error ||
      errorBody.message ||
      `HTTP error! status: ${response.status}`;

    sessionStorage.setItem(
      "errorDetails",
      JSON.stringify({
        // Use name if available (short label), else fall back to the concise message
        name: conciseName,
        error: errorMessage,
        statusCode: response.status,
        url: response.url,
        timestamp: new Date().toISOString(),
        // prefer backend stack if provided, else fallback to frontend
        stack:
          typeof errorBody.stack === "string"
            ? errorBody.stack // backend trace in dev
            : new Error().stack, // fallback frontend trace
      })
    );

    window.location.href = "/Error";
    // Throw the concise name (if present) or the message to keep console errors readable
    throw new Error(conciseName || errorMessage);
  }

  return response;
}

/**
 * Uploads a new resume file for a candidate.
 * @param {FormData} formData - The form data containing the file and candidate username.
 * @returns {Promise<object>} A promise that resolves to the new resume record.
 */
export async function uploadNewCandidateResume(formData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/resume`;
  console.log(`Uploading new candidate resume with file to: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });
  return handleApiResponse(response);
}

/**
 * Updates the display name of a specific resume.
 * @param {number|string} resumeId - The ID of the resume to update.
 * @param {string} name - The new name for the resume.
 * @returns {Promise<object>} A promise that resolves to the updated resume record.
 */
export async function updateResumeName(resumeId, name) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/resume-name/${resumeId}`;
  console.log(`Updating resume name at: ${url}`);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: name }),
  });

  return handleApiResponse(response);
}

/**
 * Sets a specific resume as the candidate's primary default resume.
 * @param {string} candidateUsername - The username of the candidate.
 * @param {number|string} resumeId - The ID of the resume to set as primary.
 * @returns {Promise<object>} A promise that resolves to the candidate's updated profile.
 */
export async function updatePrimaryResume(candidateUsername, resumeId) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/primary-resume/${candidateUsername}/${resumeId}`;
  console.log(`Updating primary resume at: ${url}`);

  const response = await fetch(url, {
    method: "PUT",
  });
  return handleApiResponse(response);
}

/**
 * Deletes a specific resume by its ID.
 * @param {number|string} resumeId - The ID of the resume to delete.
 * @returns {Promise<object>} A promise that resolves to a confirmation of the deletion.
 */
export async function deleteResume(resumeId) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/resume/${resumeId}`;
  console.log(`Deleting resume at: ${url}`);

  const response = await fetch(url, {
    method: "DELETE",
  });
  return handleApiResponse(response);
}

// ====================================================================================
// Timecard Management
// ====================================================================================

/**
 * Creates a new timecard or updates an existing one for a given week.
 * @param {object} timecardData - The data for the timecard, including job history ID and time entries.
 * @returns {Promise<object>} A promise that resolves to the created or updated timecard.
 */
export async function upsertTimecard(timecardData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/upsert-timecard`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(timecardData),
  });
  return handleApiResponse(response);
}

/**
 * Retrieves all weekly timecards submitted for a specific job.
 * @param {number|string} jobPositionHistoryId - The ID of the employee's job history record.
 * @returns {Promise<Array>} A promise that resolves to an array of timecards.
 */
export async function getAllTimecardsForJob(jobPositionHistoryId) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/timecard/all/${jobPositionHistoryId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return handleApiResponse(response);
}

/**
 * Fetches all timecard data across all employees for the admin dashboard.
 * @returns {Promise<Array>} A promise that resolves to an array of all timecards in the system.
 */
export async function fetchAdminViewData() {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/timecard/admin/all`;

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Fetches all timecard data for employees managed by a specific employer.
 * @param {string} employerUsername - The username of the employer.
 * @returns {Promise<Array>} A promise that resolves to an array of timecards for that employer's employees.
 */
export async function fetchEmployerViewData(employerUsername) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  if (!employerUsername) {
    throw new Error(
      "Employer username is required to fetch employer timecard data."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/timecard/employer/${employerUsername}`;

  const response = await fetch(url);
  return handleApiResponse(response);
}

// ====================================================================================
// Course Management
// ====================================================================================

/**
 * Retrieves a list of all available courses.
 * @returns {Promise<Array>} A promise that resolves to an array of course objects.
 */
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

/**
 * Updates or Creates a new course with the provided data.
 * @param {object} courseData - The data for the new course.
 * @returns {Promise<object>} A promise that resolves to the newly created course object.
 */
export async function upsertCourse(courseData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/upsert-course`;
  console.log(`Upserting course at: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(courseData),
  });

  if (!response.ok) {
    throw new Error(`API call failed with status: ${response.status}`);
  }

  return response.json();
}

// ====================================================================================
// Miscellaneous Utilities
// ====================================================================================

/**
 * Gathers a list of all unique semester codes for currently open job positions.
 * @returns {Promise<Array>} A promise that resolves to an array of unique semester code strings.
 */
export async function getSemesterCodesForOpenPositions() {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/semester-codes?status=OPEN`;
  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Gathers a list of unique semester codes for a specific employer's job positions.
 * @param {string} employerUsername - The username of the employer.
 * @returns {Promise<Array>} A promise that resolves to an array of unique semester code strings.
 */
export async function getSemesterCodesForEmployer(employerUsername) {
  if (!employerUsername) {
    throw new Error(
      "A username is required to fetch semester codes for an employer."
    );
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/semester-codes?employer=${employerUsername}`;
  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Fetches all comments associated with a specific database record (e.g., a position or application).
 * @param {string} tableName - The name of the table the record belongs to.
 * @param {number|string} foreignKey - The primary key of the record to fetch comments for.
 * @returns {Promise<Array>} A promise that resolves to an array of comment objects.
 */
export async function getComments(tableName, foreignKey) {
  if (!tableName || !foreignKey) {
    throw new Error(
      "Table name and foreign key are required to fetch comments."
    );
  }

  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/comments?tableName=${tableName}&foreignKey=${foreignKey}`;
  console.log(`Fetching comments at: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}
