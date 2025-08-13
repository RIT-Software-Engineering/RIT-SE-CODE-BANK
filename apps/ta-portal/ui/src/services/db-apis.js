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
 * Searches and filters for open positions using the provided search term and applied filters.
 * Constructs the search URL with the search term as a query parameter,
 * sends a GET request to the backend, and returns the API response.
 *
 * @param {string} searchTerm - The term to search for open positions.
 * @param {Object} appliedFilters - The filters applied to the search.
 * @param {string} candidateUsername - The Username of the candidate.
 * @returns {Promise<any>} The result of the API response handler.
 * @throws {Error} If required API URL components are not defined.
 */
// TODO: Rename from getOpenPositions to getOpenJobPositions
export async function getOpenJobPositions(searchTerm = "", appliedFilters = {}, candidateUsername) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file."
    );
  }
  const params = new URLSearchParams({ 
    searchTerm: searchTerm, 
    filters: JSON.stringify(appliedFilters), 
    candidateUsername: candidateUsername
  });
  
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/positions/open?${params.toString()}`;
  console.log(`Searching from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Retrieves job positions owned by a specific user, with optional search and filter criteria.
 * @param {string} ownerUsername - The username of the employer or admin who owns the positions.
 * A `searchTerm` and `appliedFilters` are optional.
 * @param {string} [searchTerm=""] - The term to search for within the owned positions.
 * @param {Object} [appliedFilters={}] - The filters to apply to the search (e.g., status, semester).
 * @returns {Promise<any>} The result of the API response handler.
 * @throws {Error} If the ownerUsername is not provided or API URLs are not defined.
 */
export async function getPositionsByOwner(ownerUsername, searchTerm = "", appliedFilters = {}) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file."
    );
  }
  if (!ownerUsername) {
    throw new Error("An owner's username is required to fetch their positions.");
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
 * Retrieves all job positions from the backend based on the provided search term and applied filters.
 * @param {string} [searchTerm=""] - The term to search for within the positions.
 * @param {Object} [appliedFilters={}] - The filters to apply to the search (e.g., status, semester).
 * @returns {Promise<any>} The result of the API response handler.
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
  })
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/positions?${params.toString()}`;
  console.log(`Fetching all positions from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Creates a new job position by sending position and employer data to the backend.
 * @param {object} positionData - An object containing all details for the new position.
 * @param {object} employerData - An object containing the creating employer's details (username, fname, lname).
 * @returns {Promise<any>} The result of the API response handler.
 * @throws {Error} If required API URL components are not defined.
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
 * Updates an existing job position with new data and a comment.
 * @param {string} jobID - The ID of the job position to update.
 * @param {object} positionData - An object containing the fields to update on the position.
 * @param {object} commentData - An object containing details for the update comment.
 * @returns {Promise<any>} The result of the API response handler.
 * @throws {Error} If required API URL components are not defined.
 */
// TODO: Change name from modifyPosition to updatePosition
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
 * Updates the status of a specific job position.
 * @param {string} jobID - The ID of the job position to update.
 * @param {string} status - The new status to set for the position (e.g., 'APPROVED', 'REJECTED').
 * @param {object} commentData - An object containing details for the update comment.
 * @returns {Promise<any>} The result of the API response handler.
 * @throws {Error} If required parameters or API URL components are not defined.
 */
export async function updatePositionStatus(jobID, status, commentData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  if (!jobID || !status || !commentData) {
    throw new Error("A job ID, status, and comment data are required to update the status.");
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
 * Retrieves all applications with status "ACCEPTED_OFFER" for admin hiring review.
 * @returns {Promise<Array>} An array of application objects with job position and resume details.
 */
export async function getCandidateApplicationsAsAdmin() {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/admin`;
  console.log(`Fetching admin applications from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Checks if a job position is full.
 * @param {string} jobPositionId - The ID of the job position.
 * @returns {Promise<{isFull: boolean}>} An object containing the isFull boolean result.
 */
export async function checkJobPositionIsFull(jobPositionId) {
  if (!jobPositionId) {
    throw new Error("A Job Position ID is required to check if it is full.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/positions/${jobPositionId}/is-full`;
  console.log(`Checking if job position is full at: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Hires a candidate for a job position and promotes them to employee.
 * @param {string} candidateUsername - The username of the candidate to hire.
 * @param {string|number} applicationId - The ID of the application record.
 * @param {string} jobPositionId - The ID of the job position.
 * @param {number} employeeId - The employee ID to assign.
 * @param {Object} commentData - Comment data for the hiring action.
 * @returns {Promise<Object>} The updated application record.
 */
export async function hireCandidate(candidateUsername, applicationId, jobPositionId, employeeId, commentData) {
  if (!candidateUsername || !applicationId || !jobPositionId || !employeeId || !commentData) {
    throw new Error("Missing required fields: candidateUsername, applicationId, jobPositionId, employeeId, and commentData are all required.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
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
      employeeId,
      commentData,
    }),
  });

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

export async function createCourse(courseData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/create-course`;
  console.log(`Creating course at: ${url}`);

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

// gets basic user info
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
 * Resets a user's password.
 * @param {string} token The password reset token.
 * @param {string} newPassword The user's new password.
 * @returns {Promise<object>} A promise that resolves to the API response.
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

// api call to retrieve, search, and filter candidate applications as a candidate/employee
export async function getCandidateApplicationsAsCandidate(searchTerm, appliedFilters, candidateUsername) {
  if (!candidateUsername) {
    throw new Error("A Username is required to fetch a user profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const params = new URLSearchParams({ searchTerm: searchTerm, filters: JSON.stringify(appliedFilters), candidateUsername: candidateUsername});
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/candidate?${params.toString()}`;
  const response = await fetch(url);
  return handleApiResponse(response);
}

// api call to retrieve, search, and filter candidate applications as a employer
export async function getCandidateApplicationsAsEmployer(searchTerm, searchBy, appliedFilters, employerUsername) {
  if (!employerUsername) {
    throw new Error("A Username is required to fetch a user profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const params = new URLSearchParams({ searchTerm: searchTerm, searchBy: searchBy, filters: JSON.stringify(appliedFilters), employerUsername: employerUsername});
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/employer?${params.toString()}`;
  const response = await fetch(url);
  return handleApiResponse(response);
}

/**
 * Gathers a list of all unique semester codes for job positions with an "OPEN" status.
 * @returns {Promise<Array>} A promise that resolves to an array of semester codes.
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
 * Gathers a list of all unique semester codes for a specific employer's job positions.
 * @param {string} employerUsername - The username of the employer. 
 * @returns {Promise<Array>} A promise that resolves to an array of semester codes.
 */
export async function getSemesterCodesForEmployer(employerUsername) {
  if (!employerUsername) {
    throw new Error("A username is required to fetch semester codes for an employer.");
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

export async function getCandidateHiredStatus(candidateUsername, semestercode) {
  if (!candidateUsername) {
    throw new Error("A Username is required to see a candidate's hired status.");
  }
  if (!semestercode) {
    throw new Error("A Semester Code is required to see a candidate's hired status.");
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

export async function updateCandidateApplicationStatus(author, applicationId, status, comments) {
  if (!applicationId) {
    throw new Error("An application ID is required to update an application status.");
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
    body: JSON.stringify({ author: author, status: status, comments: comments }),
  });
  return handleApiResponse(response);
}

/**
 * API call to create a new candidate profile.
 * @param {object} candidateData - The full data for the new candidate profile.
 * @returns {Promise<object>} The server's response, typically the newly created profile.
 */
export async function createCandidateProfile(candidateData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  // POST to the collection endpoint to create a new resource.
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
 * API call to update an existing candidate profile.
 * @param {object} candidateData - An object containing the fields to update.
 * @returns {Promise<object>} The server's response, typically the updated profile.
 */
export async function updateCandidateProfile(candidateData) {
  if (!candidateData.username) {
    throw new Error("A username is required to update a profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  // PUT to the specific resource endpoint to update it.
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
 * API call to create a new employer profile.
 * @param {object} employerData - The full data for the new employer profile.
 * @returns {Promise<object>} The server's response, typically the newly created profile.
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
 * API call to update an existing employer profile.
 * @param {object} employerData - An object containing the fields to update.
 * @returns {Promise<object>} The server's response, typically the updated profile.
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

// api call to apply for a job position
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

// api call to apply for a job position with new uploads
export async function applyForJobPositionWithNewUploads(jobPositionApplicationData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/apply-with-uploads`;
  console.log(`Applying for job position at: ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    body: jobPositionApplicationData, 
  });

  return handleApiResponse(response);
}

/**
 * Deletes a candidate's application for a specific job position.
 * @param {number} candidateUsername - The Username of the candidate deleting the application.
 * @param {string} jobPositionId - The ID of the job position to delete the application from.
 * @returns {Promise<object>} A promise that resolves to the data of the deleted application record.
 */
export async function deleteApplication(candidateUsername, jobPositionId) {
  // 1. Validate the inputs
  if (!candidateUsername || !jobPositionId) {
    throw new Error("Candidate Username and Job Position ID are required to delete an application.");
  }
  
  // 2. Check for environment variables
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  // 3. Construct the correct URL with path and query parameters
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/applications/${candidateUsername}?jobPositionId=${jobPositionId}`;
  console.log(`Deleting application at: ${url}`);

  // 4. Make the DELETE request using fetch
  const response = await fetch(url, {
    method: 'DELETE',
  });

  // 5. Process the response
  return handleApiResponse(response);
}

/**
 * Terminates an employee by Username, updating all their job history to 'TERMINATED'.
 * @param {number} username - The username of the employee to terminate.
 * @returns {Promise<object>} The updated user profile after termination.
 */
export async function terminateEmployee(username) {
  if (!username) {
    throw new Error("A username is required to terminate an employee.");
  }

  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/terminate-employee/${username}`;
  console.log(`Terminating employee at: ${url}`);

  const response = await fetch(url, {
    method: "PUT",
  });

  return handleApiResponse(response);
}

// api call to add new candidate resume
export async function uploadNewCandidateResume(formData) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/resume`;
  console.log(`Uploading new candidate resume with file to: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  return handleApiResponse(response);
}

export async function updateResumeName(resumeId, name) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/resume-name/${resumeId}`;
  console.log(`Updating resume name at: ${url}`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: name }),
  });

  return handleApiResponse(response);
}

// api call to update the primary resume for a candidate
export async function updatePrimaryResume(candidateUsername, resumeId) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/primary-resume/${candidateUsername}/${resumeId}`;
  console.log(`Updating primary resume at: ${url}`);

  const response = await fetch(url, {
    method: 'PUT',
  });
  return handleApiResponse(response);
}

// api to delete a resume for a candidate
export async function deleteResume(resumeId) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/resume/${resumeId}`;
  console.log(`Deleting resume at: ${url}`);

  const response = await fetch(url, {
    method: 'DELETE',
  });
  return handleApiResponse(response);

}

// api call to get comments
export async function getComments(tableName, foreignKey) {
  if (!tableName || !foreignKey) {
    throw new Error("Table name and foreign key are required to fetch comments.");
  }

  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/comments?tableName=${tableName}&foreignKey=${foreignKey}`;
  console.log(`Fetching comments at: ${url}`);

  const response = await fetch(url);
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

/**
 * Retrieves all weekly timecards for a given job from the backend API.
 * @param {number} jobPositionHistoryId - The ID of the employee's job.
 * @returns {Promise<Array>} A promise that resolves to an array of timecard objects.
 */
export async function getAllTimecardsForJob(jobPositionHistoryId) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/timecard/all/${jobPositionHistoryId}`;
  console.log(`Fetching all timecards from: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleApiResponse(response);
}

/**
 * For the Admin View: Fetches all timecard data from the backend.
 * @returns {Promise<Array>} A promise that resolves to an array of all timecard objects.
 */
export async function fetchAdminViewData() {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error("Backend API URL components are not defined.");
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/timecard/admin/all`;
  console.log(`Fetching admin timecard data from: ${url}`);

  const response = await fetch(url);
  return handleApiResponse(response);
}