// server/server/routing/db_routes.js

const router = require("express").Router();
// Import the specific query function from query_db.js
const {
  getOpenPositionsWithDetails,
  getAllUsers,
  getAllCourses,
  findUniqueUser,
  upsertCandidateProfile,
  searchOpenPositions,
  applyForJobPosition, upsertEmployerProfile,
  getStudentApplications
} = require("../database/query_db");

/**
 * Route to get all open positions with their associated course and course schedule info.
 * GET /api/db/open-positions
 */
router.get("/open-positions", async (req, res) => {
  try {
    const positions = await getOpenPositionsWithDetails();
    res.status(200).json(positions);
  } catch (error) {
    console.error("Error in /open-positions route:", error);
    res.status(500).json({ error: "Failed to retrieve open positions." });
  }
});

router.get("/search-open-positions", async (req, res) => {
  const { term } = req.query;
  try {
    const positions = await searchOpenPositions(term);
    res.status(200).json(positions);
  } catch (error) {
    console.error("Error in /search-open-positions route:", error);
    res.status(500).json({ error: "Failed to search open positions." });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in /users route:", error);
    res.status(500).json({ error: "Failed to retrieve users." });
  }
});

router.get("/courses", async (req, res) => {
  try {
    const courses = await getAllCourses();
    res.status(200).json(courses);
  } catch (error) {
    console.error("Error in /courses route:", error);
    res.status(500).json({ error: "Failed to retrieve courses." });
  }
});

router.get("/users/:UID", async (req, res) => {
  const UID = req.params.UID;
  try {
    const user = await findUniqueUser(UID);
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in /users/:UID route:", error);
    res.status(500).json({ error: "Failed to retrieve user." });
  }
});

// Router to get students applications given a employeerUID
router.get("/applications/:employerUid", async (req, res) => {
    try {
      const employerUid = parseInt(req.params.employerUid, 10);

      // Validate that the parsed UID is a valid number.
      // This prevents errors if the URL contains non-numeric text.
      if (isNaN(employerUid)) {
        return res.status(400).json({ error: "Employer UID must be a valid number." });
      }

      const positions = await getStudentApplications(employerUid);
      
      // 4. Send the successful response. Corrected from `req.status` to `res.status`.
      // Using res.json() is a shorthand that defaults to a 200 OK status.
      res.status(200).json(positions);

    } catch (error) {
      // Log the full error on the server for easier debugging.
      console.error(`Error in /applications/${req.params.employerUid} route:`, error.message);
      
      // Send a generic, user-friendly error message to the client.
      res.status(500).json({ error: "An error occurred while retrieving applications." });
    }
  });

router.post("/upsert-candidate-profile", async (req, res) => {
  const studentData = req.body;
  try {
    const profile = await upsertStudentProfile(studentData);
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error in /upsert-employer-profile route:', error);
    res.status(500).json({ error: 'Failed to upsert employer profile.' });
  }
});

router.post("/apply-for-job-position", async (req, res) => {
  const jobPositionApplicationData = req.body;
  try {
    const application = await applyForJobPosition(jobPositionApplicationData);
    res.status(201).json(application);
  } catch (error) {
    console.error("Error in /apply-for-job-position route:", error);
    res.status(500).json({ error: "Failed to apply for job position." });
  }
});

module.exports = router;
