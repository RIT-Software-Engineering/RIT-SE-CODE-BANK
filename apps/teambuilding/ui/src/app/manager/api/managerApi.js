// All HTTP calls live here. Each function returns the raw fetch Response,
// so callers keep the same `res.ok` / `res.json()` handling as before.
const API_BASE = "http://localhost:3000/api";

const sendJson = (path, body, method = "POST") =>
  fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// ---- Users ----
export const getUserRole = (username) =>
  fetch(`${API_BASE}/user-role?username=${encodeURIComponent(username)}`);

export const getUser = (username) =>
  fetch(`${API_BASE}/user?username=${encodeURIComponent(username)}`);

export const getAllUsers = () => fetch(`${API_BASE}/users/user-role`);

export const createUser = (username, role = "USER") =>
  sendJson("/create-user", { username, role });

// ---- Communities ----
export const getCommunities = (managerId) =>
  fetch(`${API_BASE}/communities?managerId=${managerId}`);

export const createCommunity = (name, managerId) =>
  sendJson("/community", { name, managerId });

export const deleteCommunity = (communityId) =>
  fetch(`${API_BASE}/community/${communityId}`, { method: "DELETE" });

export const getCommunityUsers = (communityId) =>
  fetch(`${API_BASE}/community/${communityId}/users`);

export const addUserToCommunity = (communityId, userId) =>
  sendJson(`/community/${communityId}/add-user`, { userId });

export const bulkCreateCommunities = (managerId, data) =>
  sendJson("/community/bulk-create", { managerId, data });

// ---- Teams ----
export const createTeam = (name, communityId, maxSize) =>
  sendJson("/team", { name, communityId, maxSize });

export const updateTeam = (teamId, name) =>
  sendJson(`/team/${teamId}`, { name }, "PUT");

export const deleteTeam = (teamId) =>
  fetch(`${API_BASE}/team/${teamId}`, { method: "DELETE" });

export const getTeamUsers = (teamId) =>
  fetch(`${API_BASE}/team/${teamId}/users`);

export const addUserToTeam = (teamId, userId) =>
  sendJson(`/team/${teamId}/add-user`, { userId });

export const removeUserFromTeam = (teamId, userId) =>
  sendJson(`/team/${teamId}/remove-user`, { userId });

export const importTeamCsv = (teamId, usernames) =>
  sendJson(`/team/${teamId}/import-csv`, { usernames });
