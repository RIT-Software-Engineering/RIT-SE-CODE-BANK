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
export async function getOpenPositions(searchTerm, appliedFilters, candidateUsername) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_DATABASE_API_EXTENSION) are not defined. Check your .env.local file."
    );
  }
  const params = new URLSearchParams({ searchTerm: searchTerm, filters: JSON.stringify(appliedFilters), candidateUsername: candidateUsername});
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/open-positions?${params.toString()}`;
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

export async function createPosition(positionData, employerUsername) {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/create-position/${employerUsername}`;
  console.log(`Creating position at: ${url}`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(positionData),
  });

  if (!response.ok) {
    throw new Error(`API call failed with status: ${response.status}`);
  }

  return response.json();
}

export async function getAllPositions() {
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/positions`;
  console.log(`Fetching all positions from: ${url}`);

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

export async function getSemesterCodesForEmployer(employerUsername) {
  if (!employerUsername) {
    throw new Error("A Username is required to fetch a user profile.");
  }
  if (!BASE_API_URL || !DATABASE_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }
  const url = `${BASE_API_URL}${DATABASE_API_EXTENSION}/semester-codes/${employerUsername}`;
  const response = await fetch(url);
  return handleApiResponse(response);
}

export async function updateCandidateApplicationStatus(applicationId, status, comments) {
  if (!applicationId) {
    throw new Error("An application ID is required to update an application status.");
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
    body: JSON.stringify({ status: status, comments: comments }),
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
 * @param {number} candidateUsername - The Username of the candidate withdrawing the application.
 * @param {string} jobPositionId - The ID of the job position to withdraw from.
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