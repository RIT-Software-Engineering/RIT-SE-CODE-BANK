// Imports
const UserAuth = require("./user_auth");
const db_router = require("express").Router();
const { validationResult, body, check } = require("express-validator");
const PDFDoc = require("pdfkit");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const moment = require("moment");
const fileSizeParser = require("filesize-parser");
const he = require("he");
const Logger = require('../logger');

function humanFileSize(bytes, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
}

const defaultFileSizeLimit = 15 * 1024 * 1024;

const DB_CONFIG = require("../database/db_config");
const CONFIG = require("../config/config");
const { nanoid } = require("nanoid");
const CONSTANTS = require("../consts");
const { USERTYPES } = require("../consts");
const { off } = require("process");
const USERAuth = require("./user_auth");

const ACTION_TARGETS = {
  ADMIN: "admin",
  COACH: "coach",
  TEAM: "team",
  INDIVIDUAL: "individual",
  COACH_ANNOUNCEMENT: "coach_announcement",
  STUDENT_ANNOUNCEMENT: "student_announcement",
  PEER_EVALUATION: "peer_evaluation",
};

// Routes
module.exports = (db) => {
  /**
   * /getAllUsersForLogin ENDPOINT SHOULD ONLY BE HIT IN DEVELOPMENT ONLY
   *
   * THIS IS USED BY THE DEVELOPMENT LOGIN AND SHOULD NOT BE USED FOR ANYTHING ELSE
   */
  if (process.env.NODE_ENV !== "production") {
    // gets all users
    db_router.get("/DevOnlyGetAllUsersForLogin", (req, res) => {
      db.query(`SELECT ${CONSTANTS.SIGN_IN_SELECT_ATTRIBUTES} FROM users`).then(
        (users) => res.send(users)
      );
    });
  }

  db_router.get(
    "/selectAllStudentInfo",
    [UserAuth.isCoachOrAdmin],
    (req, res) => {
      let getStudentsQuery = `
            SELECT *
            FROM users
            LEFT JOIN semester_group
            ON users.semester_group = semester_group.semester_id
            WHERE type = 'student'
            ORDER BY semester_group desc
        `;
      db.query(getStudentsQuery)
        .then((values) => {
          res.send(values);
        })
        .catch((err) => {
          res.status(500).send(err);
        });
    }
  );

  db_router.get("/selectAllNonStudentInfo", [UserAuth.isAdmin], (req, res) => {
    let getUsersQuery = `
            SELECT *
            FROM users
            LEFT JOIN semester_group
            ON users.semester_group = semester_group.semester_id
            WHERE type != 'student'
        `;
    db.query(getUsersQuery)
      .then((values) => {
        res.send(values);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  db_router.get("/getSemesterStudents", [UserAuth.isSignedIn], (req, res) => {
    let query = "";
    let params = [];
    switch (req.user.type) {
      case USERTYPES.STUDENT:
        query = `SELECT users.* FROM users WHERE users.system_id = ?`;
        params = [req.user.system_id];
        break;
      case USERTYPES.COACH:
        query = `
                    SELECT users.* FROM users
                    LEFT JOIN semester_group
                        ON users.semester_group = semester_group.semester_id
                    WHERE users.semester_group in (
                    SELECT projects.semester FROM projects
                    WHERE projects.project_id in (
                        SELECT project_coaches.project_id FROM project_coaches
                        WHERE project_coaches.coach_id = ?
                    )
                        )
                `;
        params = [req.user.system_id];
        break;
      case USERTYPES.ADMIN:
        query = `SELECT * FROM users
                    LEFT JOIN semester_group
                    ON users.semester_group = semester_group.semester_id
                    WHERE users.type = 'student'`;
        break;

      default:
        break;
    }

    db.query(query, params)
      .then((users) => {
        if (req.user.type === USERTYPES.STUDENT) {
          users = users.map((user) => {
            let output = {};
            if (user.project === req.user.project) {
              output["last_login"] = user["last_login"];
              output["prev_login"] = user["prev_login"];
            }
            output["active"] = user["active"];
            output["email"] = user["email"];
            output["fname"] = user["fname"];
            output["lname"] = user["lname"];
            output["project"] = user["project"];
            output["semester_group"] = user["semester_group"];
            output["system_id"] = user["system_id"];
            output["type"] = user["type"];
            return output;
          });
        }
        res.send(users);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).send(err);
      });
  });

  db_router.get("/getProjectMembers", [UserAuth.isSignedIn], (req, res) => {
    let query = `SELECT users.*, project_coaches.project_id FROM users
            LEFT JOIN project_coaches ON project_coaches.coach_id = users.system_id
            WHERE users.project = ? OR project_coaches.project_id = ?`;

    params = [req.query.project_id, req.query.project_id];

    db.query(query, params).then((users) => res.send(users));
  });

  // NOTE: This is currently used for getting user for AdminView to mock users, however, I feel that this network request will get quite large
  // as we add about 100 users every semester.
  db_router.get("/getActiveUsers", [UserAuth.isAdmin], (req, res) => {
    let query = `SELECT ${CONSTANTS.SIGN_IN_SELECT_ATTRIBUTES}
            FROM users
            WHERE active = ''`;
    db.query(query).then((users) => res.send(users));
  });

  db_router.post(
    "/createUser",
    [
      UserAuth.isAdmin,
      body("system_id")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 50 }),
      body("fname")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 50 }),
      body("lname")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 50 }),
      body("email")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 50 }),
      body("type")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 50 }),
      body("semester_group").isLength({ max: 50 }),
      body("project").isLength({ max: 50 }),
      body("active").trim().escape().isLength({ max: 50 }),
    ],
    async (req, res) => {
      let result = validationResult(req);
      console.log(result);

      if (result.errors.length !== 0) {
        return res.status(400).send(result);
      }

      let body = req.body;

      const sql = `INSERT INTO ${DB_CONFIG.tableNames.users}
                (system_id, fname, lname, email, type, semester_group, project, active)
                VALUES (?,?,?,?,?,?,?,?)`;

      const active =
        body.active === "false"
          ? moment().format(CONSTANTS.datetime_format)
          : "";

      const params = [
        body.system_id,
        body.fname,
        body.lname,
        body.email,
        body.type,
        body.semester_group,
        body.project,
        active,
      ];
      db.query(sql, params)
        .then(() => {
          return res.status(200).send();
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).send(err);
        });
    }
  );

  db_router.post(
    "/batchCreateUser",
    [
      UserAuth.isAdmin,
      // TODO: Add more validation
    ],
    async (req, res) => {
      let result = validationResult(req);

      if (result.errors.length !== 0) {
        return res.status(400).send(result);
      }

      let users = JSON.parse(req.body.users);

      const insertStatements = users.map((user) => {
        const active =
          user.active.toLocaleLowerCase() === "false"
            ? moment().format(CONSTANTS.datetime_format)
            : "";
        return `('${user.system_id}','${user.fname}','${user.lname}','${
          user.email
        }','${user.type}',${
          user.semester_group === "" ? null : `'${user.semester_group}'`
        },'${active}')`;
      });

      const sql = `INSERT INTO ${
        DB_CONFIG.tableNames.users
      } (system_id, fname, lname, email, type, semester_group, active) VALUES ${insertStatements.join(
        ","
      )}`;

      db.query(sql)
        .then((values) => {
          return res.status(200).send(values);
        })
        .catch((err) => {
          return res.status(500).send(err);
        });
    }
  );

  db_router.post("/editUser", [UserAuth.isAdmin], (req, res) => {
    let body = req.body;

    let updateQuery = `
            UPDATE users
            SET fname = ?,
                lname = ?,
                email = ?,
                type = ?,
                semester_group = ?,
                project = ?,
                active = ?
            WHERE system_id = ?
        `;

    const active =
      body.active === "false" ? moment().format(CONSTANTS.datetime_format) : "";

    let params = [
      body.fname,
      body.lname,
      body.email,
      body.type,
      body.semester_group || null,
      body.project || null,
      active,
      body.system_id,
    ];

    db.query(updateQuery, params)
      .then(() => {
        return res.status(200).send();
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).send(err);
      });
  });

  db_router.post("/removeTime", UserAuth.isSignedIn, (req, res) => {
    if (!req.body.id) {
       res.status(400).send("No id provided");
    }

    const sql = "UPDATE time_log SET active=0 WHERE time_log_id = ?";

    db.query(sql, [req.body.id])
      .then(() => {
        res.status(200).send();
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send;
      });
  });

  db_router.get("/avgTime", [UserAuth.isSignedIn],async (req, res) => {
    const sql = "SELECT ROUND(AVG(CASE WHEN active != 0 THEN time_amount ELSE NULL END), 2)  AS avgTime, system_id FROM time_log WHERE project = ? GROUP BY system_id"
    console.log(req.query.project_id)

    db.query(sql, [req.query.project_id])
        .then((time) => {
          console.log(time)
          res.send(time)
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send(error);
        });
  })


  db_router.post("/createTimeLog", [

      ],
      async (req, res) => {


        let result = validationResult(req);

        if (result.errors.length !== 0) {
          return res.status(400).send(result);
        }

        let body = req.body;

        const sql = `INSERT INTO time_log
                (semester, system_id, project, mock_id, work_date, time_amount, work_comment)
                VALUES (?,?,?,?,?,?,?)`;

        const params = [
          req.user.semester_group,
          req.user.system_id,
          req.user.project,
          "",
          req.body.date,
          req.body.time_amount,
          req.body.comment,
        ];
        db.query(sql, params)
            .then(() => {
              return res.status(200).send();
            })
            .catch((err) => {
              console.error(err);
              return res.status(500).send(err);
            });
      }
  );

  db_router.get("/getActiveProjects", [UserAuth.isSignedIn], (req, res) => {
    let getProjectsQuery = `
            SELECT *
            FROM projects
            LEFT JOIN semester_group
            ON projects.semester = semester_group.semester_id
            WHERE projects.semester IS NOT NULL
        `;
    db.query(getProjectsQuery)
      .then((values) => {
        res.send(values);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  db_router.get("/getActiveCoaches", [UserAuth.isCoachOrAdmin], (req, res) => {
    const sql = `SELECT * FROM users WHERE type = '${USERTYPES.COACH}' AND active = ''`;

    db.query(sql)
      .then((coaches) => {
        res.send(coaches);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send(error);
      });
  });

  db_router.get("/getProjectCoaches", [UserAuth.isCoachOrAdmin], (req, res) => {
    const getProjectCoaches = `SELECT users.* FROM users
            LEFT JOIN project_coaches ON project_coaches.coach_id = users.system_id
            WHERE project_coaches.project_id = ?`;

    db.query(getProjectCoaches, [req.query.project_id])
      .then((coaches) => {
        res.send(coaches);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send(error);
      });
  });

  db_router.get(
    "/getProjectStudents",
    [UserAuth.isCoachOrAdmin],
    (req, res) => {
      const getProjectStudents = "SELECT * FROM users WHERE users.project = ?";

      db.query(getProjectStudents, [req.query.project_id])
        .then((students) => {
          res.send(students);
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send(error);
        });
    }
  );

  db_router.get(
    "/getProjectStudentNames",
    [UserAuth.isSignedIn],
    (req, res) => {
      const getProjectStudents =
        "SELECT fname,lname FROM users WHERE users.project = ? and users.system_id!=?";

      db.query(getProjectStudents, [req.query.project_id, req.user.system_id])
        .then((students) => {
          res.send(students);
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send(error);
        });
    }
  );

  db_router.get(
    "/selectAllCoachInfo",
    [UserAuth.isCoachOrAdmin],
    (req, res) => {
      const getCoachInfoQuery = `
            SELECT users.system_id,
            users.fname,
            users.lname,
            users.email,
            users.semester_group,
            (
                SELECT json_group_array(
                    json_object(
                        'title', COALESCE(projects.display_name, projects.title),
                        'semester_id', projects.semester,
                        'project_id', projects.project_id,
                        'status', projects.status
                    )
                )
                FROM project_coaches
                LEFT JOIN projects ON projects.project_id = project_coaches.project_id
                WHERE project_coaches.coach_id = users.system_id
            ) projects
            FROM users
            WHERE users.type = 'coach'
        `;

      db.query(getCoachInfoQuery)
        .then((coaches) => {
          res.send(coaches);
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send(error);
        });
    }
  );

  // used in the /projects page and home page if featured
  db_router.get("/getActiveArchiveProjects", (req, res) => {
    const { resultLimit, page, featured } = req.query;
    let skipNum = page * resultLimit;
    let projectsQuery;
    let rowCountQuery;
    if (featured === "true") {
      // home page - randomized order of projects
      projectsQuery = `SELECT * FROM ${DB_CONFIG.tableNames.archive} WHERE oid NOT IN
            ( SELECT oid FROM ${DB_CONFIG.tableNames.archive} ORDER BY random() LIMIT ? )
            AND inactive = '' AND featured = 1 ORDER BY random() LIMIT ?`;
      rowCountQuery = `SELECT COUNT(*) FROM ${DB_CONFIG.tableNames.archive} WHERE inactive = ''`;
    } else {
      // projects page - all archived projects data regardless if they are archived or not
      projectsQuery = `SELECT * FROM ${DB_CONFIG.tableNames.archive} WHERE oid NOT IN
            ( SELECT oid FROM ${DB_CONFIG.tableNames.archive} ORDER BY archive_id LIMIT ? )
            AND inactive = '' ORDER BY archive_id LIMIT ?`;
      rowCountQuery = `SELECT COUNT(*) FROM ${DB_CONFIG.tableNames.archive} WHERE inactive = ''`;
    }
    const projectsPromise = db.query(projectsQuery, [skipNum, resultLimit]);
    const rowCountPromise = db.query(rowCountQuery);
    Promise.all([rowCountPromise, projectsPromise])
      .then(([[rowCount], projects]) => {
        res.send({
          totalProjects: rowCount[Object.keys(rowCount)[0]],
          projects: projects,
        });
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  });

  // endpoint for getting ALL archive data to view within admin view/editor
  db_router.get("/getArchiveProjects", (req, res) => {
    const { resultLimit, offset } = req.query;
    let skipNum = offset * resultLimit;
    let projectsQuery = `SELECT * FROM ${DB_CONFIG.tableNames.archive} WHERE
            oid NOT IN (SELECT oid FROM ${DB_CONFIG.tableNames.archive} ORDER BY archive_id LIMIT ?)
            ORDER BY archive_id LIMIT ?`;
    let rowCountQuery = `SELECT COUNT(*) FROM ${DB_CONFIG.tableNames.archive}`;

    const projectsPromise = db.query(projectsQuery, [skipNum, resultLimit]);
    const rowCountPromise = db.query(rowCountQuery);

    Promise.all([rowCountPromise, projectsPromise])
      .then(([[rowCount], projects]) => {
        res.send({
          totalProjects: rowCount[Object.keys(rowCount)[0]],
          projects: projects,
        });
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  });

  /**
   * Responds with projects from database
   *
   * TODO: Add pagination
   */
  db_router.get("/getProjects", [UserAuth.isCoachOrAdmin], async (req, res) => {
    const query = "SELECT * from projects";
    db.query(query)
      .then((projects) => res.send(projects))
      .catch((err) => res.status(500).send(err));
  });

  db_router.get("/getProjectsBySemester", [UserAuth.isCoachOrAdmin], async (req, res) => {
    const { semester } = req.query;
    
    if (!semester) {
      return res.status(400).json({ error: 'Semester parameter is required' });
    }

    try {
      const query = `
        SELECT project_id, title
        FROM projects
        WHERE semester = '${semester}'
        ORDER BY title
      `;
      
      const projects = await db.query(query);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects by semester:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  db_router.get(
    "/getCandidateProjects",
    [UserAuth.isSignedIn],
    async (req, res) => {
      const query =
        "SELECT * from projects WHERE projects.status = 'candidate';";
      db.query(query)
        .then((projects) => res.send(projects))
        .catch((err) => res.status(500).send(err));
    }
  );

  db_router.get("/getMyProjects", [UserAuth.isSignedIn], async (req, res) => {
    let query;
    let params;
    switch (req.user.type) {
      case USERTYPES.COACH:
        query = `SELECT projects.*
                FROM projects
                INNER JOIN project_coaches
                ON (projects.project_id = project_coaches.project_id AND project_coaches.coach_id = ?);`;
        params = [req.user.system_id];
        break;
      case USERTYPES.STUDENT:
        query = `SELECT users.system_id, users.semester_group, projects.*
                FROM users
                INNER JOIN projects
                ON users.system_id = ? AND projects.project_id = users.project;`;
        params = [req.user.system_id];
        break;
      case USERTYPES.ADMIN:
        query =
          "SELECT * FROM projects WHERE projects.status NOT IN ('in progress', 'completed', 'rejected', 'archive');";
        params = [];
        break;
      default:
        res
          .status(500)
          .send("Invalid user type...something must be very very broken...");
        return;
    }

    db.query(query, params)
      .then((proposals) => res.send(proposals))
      .catch((err) => res.status(500).send(err));
  });

  db_router.get(
    "/getSemesterProjects",
    [UserAuth.isSignedIn],
    async (req, res) => {
      let query;
      let params;
      switch (req.user.type) {
        case USERTYPES.COACH:
          query = `
                SELECT projects.*
                FROM projects
                WHERE projects.semester IN
                    (SELECT projects.semester
                    FROM projects
                    INNER JOIN project_coaches
                    ON (projects.project_id = project_coaches.project_id AND project_coaches.coach_id = ?))
                ;`;
          params = [req.user.system_id];
          break;
        case USERTYPES.STUDENT:
          query = `SELECT users.system_id, projects.*
                FROM users
                INNER JOIN projects
                ON users.system_id = ? AND projects.semester = users.semester_group;`;
          params = [req.user.system_id];
          break;
        case USERTYPES.ADMIN:
          query =
            "SELECT * FROM projects WHERE projects.status NOT IN ('in progress', 'completed', 'rejected', 'archive');";
          params = [];
          break;
        default:
          res
            .status(500)
            .send("Invalid user type...something must be very very broken...");
          return;
      }

      db.query(query, params)
        .then((projects) => res.send(projects))
        .catch((err) => res.status(500).send(err));
    }
  );

  db_router.post("/editArchive", [UserAuth.isAdmin], async (req, res) => {
    let body = req.body;
    const updateArchiveQuery = `UPDATE ${DB_CONFIG.tableNames.archive}
                                    SET featured=?, outstanding=?, creative=?, priority=?,
                                        title=?, project_id=?, team_name=?,
                                        members=?, sponsor=?, coach=?,
                                        poster_thumb=?, poster_full=?, archive_image=?, synopsis=?,
                                        video=?, name=?, dept=?,
                                        start_date=?, end_date=?, keywords=?, url_slug=?, inactive=?
                                    WHERE archive_id = ?`;
    const inactive =
      body.inactive === "true"
        ? moment().format(CONSTANTS.datetime_format)
        : "";

    const checkBox = (data) => {
      if (data === "true" || data === "1") {
        return 1;
      }
      return 0;
    };

    const strToInt = (data) => {
      if (typeof data === "string") {
        return parseInt(data);
      }
      return 0;
    };

    let updateArchiveParams = [
      checkBox(body.featured),
      checkBox(body.outstanding),
      checkBox(body.creative),
      strToInt(body.priority),
      body.title,
      body.project_id,
      body.team_name,
      body.members,
      body.sponsor,
      body.coach,
      body.poster_thumb,
      body.poster_full,
      body.archive_image,
      body.synopsis,
      body.video,
      body.name,
      body.dept,
      body.start_date,
      body.end_date,
      body.keywords,
      body.url_slug,
      inactive,
      body.archive_id,
    ];

    db.query(updateArchiveQuery, updateArchiveParams)
      .then(() => {
        return res.status(200).send();
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).send(err);
      });
  });

  db_router.post(
    "/createArchive",
    UserAuth.isAdmin,
    body("featured")
      .not()
      .isEmpty()
      .trim()
      .escape()
      .withMessage("Cannot be empty"),
    async (req, res) => {
      let body = req.body;
      const inactive =
        body.inactive === "true"
          ? moment().format(CONSTANTS.datetime_format)
          : "";

      const updateArchiveQuery = `INSERT INTO ${DB_CONFIG.tableNames.archive}(featured, outstanding, creative,
                                    priority, title, project_id, team_name, members, sponsor, coach, poster_thumb,
                                    poster_full, archive_image, synopsis, video, name, dept, start_date, end_date,
                                    keywords, url_slug, inactive)
                                    VALUES(?, ?, ?, ?, ?, ?, ?, ?,
                                           ?, ?, ?, ?, ?, ?, ?,
                                           ?, ?, ?, ?, ?, ?, ?);`;

      const checkBox = (data) => {
        if (data === "true" || data === "1") {
          return 1;
        }
        return 0;
      };

      const strToInt = (data) => {
        if (typeof data === "string") {
          return parseInt(data);
        }
        return 0;
      };

      const updateArchiveParams = [
        checkBox(body.featured),
        checkBox(body.outstanding),
        checkBox(body.creative),
        strToInt(body.priority),
        body.title,
        body.project_id,
        body.team_name,
        body.members,
        body.sponsor,
        body.coach,
        body.poster_thumb,
        body.poster_full,
        body.archive_image,
        body.synopsis,
        body.video,
        body.name,
        body.dept,
        body.start_date,
        body.end_date,
        body.keywords,
        body.url_slug,
        inactive,
      ];

      db.query(updateArchiveQuery, updateArchiveParams)
        .then((response) => {
          // Setting project to archive, May also be changed to remove a project from project table
          // if not wanted.
          const updateProjectQuery = `UPDATE ${DB_CONFIG.tableNames.senior_projects}
                                    SET status = 'archive'
                                    WHERE project_id = ?`;
          const updateProjectParams = [body.project_id];
          res.status(200).send(response);
          db.query(updateProjectQuery, updateProjectParams)
            .then((response) => res.status(200).send(response))
            .catch((err) => res.status(500).send(err));
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).send(err);
        });
    }
  );

  //Gets the start and end dates of a project based on the semester that it is associated with.
  db_router.get("/getProjectDates", UserAuth.isAdmin, (req, res) => {
    const getDatesQuery = `SELECT start_date, end_date FROM semester_group WHERE semester_id = ?`;
    const getDatesParams = [req.query.semester];
    db.query(getDatesQuery, getDatesParams)
      .then((dates) => {
        res.send(dates);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send(error);
      });
  });

  db_router.post(
    "/editProject",
    [
      UserAuth.isAdmin,
      // TODO: Should the max length be set to something smaller than 5000?
      body("title")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 50 }),
      body("description")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty"),
      body("semester")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty"),
    ],
    async (req, res) => {
      let body = req.body;

      const updateProjectSql = `UPDATE projects
            SET status=?, title=?, description=?, semester=?
            WHERE project_id = ?`;

      const updateProjectParams = [
        body.status,
        body.title,
        body.description,
        body.semester,
        body.project_id,
      ];

      db.query(updateProjectSql, updateProjectParams)
        .then(() => {
          return res.sendStatus(200);
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).send(err);
        });
    }
  );

  /**
   * Updates a proposal with the given information
   */
  db_router.patch(
    "/updateProposalStatus",
    [UserAuth.isAdmin, body("*").trim().escape().isJSON().isAlphanumeric()],
    (req, res) => {
      const query = `UPDATE ${DB_CONFIG.tableNames.senior_projects} SET status = ? WHERE project_id = ?`;
      db.query(query, [req.body.status, req.body.project_id])
        .then(() => {
          res.sendStatus(200);
        })
        .catch((error) => {
          console.error(error);
          res.sendStatus(500);
        });
    }
  );

  /**
   * Responds with a list of links to pdf versions of proposal forms
   *
   * NOTE: This route is unused and untested.
   */
  db_router.get("/getProposalPdfNames", UserAuth.isSignedIn, (req, res) => {
    fs.readdir(path.join(__dirname, "../proposal_docs"), function (err, files) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      let fileLinks = [];
      files.forEach(function (file) {
        fileLinks.push(file.toString());
      });

      res.send(fileLinks);
    });
  });

  db_router.get("/getProposalPdf", UserAuth.isSignedIn, (req, res) => {
    if (req.query.project_id) {
      let projectId = req.query.project_id.replace(/\\|\//g, ""); // attempt to avoid any path traversal issues
      res.sendFile(path.join(__dirname, `../proposal_docs/${projectId}.pdf`));
    } else res.send("File not found");
  });

  // NOTE: This route is unused and untested.
  db_router.get(
    "/getProposalAttachmentNames",
    UserAuth.isSignedIn,
    (req, res) => {
      if (req.query.project_id) {
        let projectId = req.query.project_id.replace(/\\|\//g, ""); // attempt to avoid any path traversal issues, get the name with no extension
        fs.readdir(
          path.join(__dirname, `./server/sponsor_proposal_files/${projectId}`),
          function (err, files) {
            if (err) {
              res.status(500).send(err);
              return;
            }
            let fileLinks = [];
            files.forEach(function (file) {
              fileLinks.push(file.toString());
            });

            res.send(fileLinks);
          }
        );
      } else {
        res.status(404).send("Bad request");
      }
    }
  );

  db_router.get("/getProposalAttachment", UserAuth.isSignedIn, (req, res) => {
    if (req.query.project_id && req.query.name) {
      let projectId = req.query.project_id.replace(/\\|\//g, ""); // attempt to avoid any path traversal issues
      let name = req.query.name.replace(/\\|\//g, ""); // attempt to avoid any path traversal issues
      res.sendFile(
        path.join(__dirname, `../sponsor_proposal_files/${projectId}/${name}`)
      );
    } else res.send("File not found");
  });

  /**
   * WARN: THIS IS VERY DANGEROUS AND IT CAN BE USED TO OVERWRITE SERVER FILES.
   */
  db_router.post("/uploadFiles", UserAuth.isAdmin, (req, res) => {
    let filesUploaded = [];

    // Attachment Handling
    if (req.files && req.files.files) {
      // If there is only one attachment, then it does not come as a list
      if (req.files.files.length === undefined) {
        req.files.files = [req.files.files];
      }

      const formattedPath = `resource/${req.body.path}`;
      const baseURL = path.join(__dirname, `../../${formattedPath}`);

      //If directory, exists, it won't make one, otherwise it will based on the baseUrl :/
      fs.mkdirSync(baseURL, { recursive: true });
      for (let x = 0; x < req.files.files.length; x++) {
        req.files.files[x].mv(
          `${baseURL}/${req.files.files[x].name}`,
          function (err) {
            if (err) {
              console.error(err);
              return res.status(500).send(err);
            }
          }
        );
        filesUploaded.push(
          `${process.env.BASE_URL}/${formattedPath}/${req.files.files[x].name}`
        );
      }
    }
    res.send({ msg: "Success!", filesUploaded: filesUploaded });
  });

  db_router.post("/createDirectory", UserAuth.isAdmin, (req, res) => {
    const formattedPath =
      req.query.path === "" ? `resource/` : `resource/${req.query.path}`;
    const baseURL = path.join(__dirname, `../../${formattedPath}`);
    if (!fs.existsSync(baseURL)) {
      fs.mkdirSync(baseURL, { recursive: true });
      res.send({ msg: "Success!" });
    } else {
      res.send({ msg: "Fail!" });
    }
  });

  db_router.post("/renameDirectoryOrFile", UserAuth.isAdmin, (req, res) => {
    const { oldPath, newPath } = req.query;
    const formattedOldPath =
      oldPath === "" ? `resource/` : `resource/${oldPath}`;
    const formattedNewPath =
      newPath === "" ? `resource/` : `resource/${newPath}`;
    const baseURLOld = path.join(__dirname, `../../${formattedOldPath}`);
    const baseURLNew = path.join(__dirname, `../../${formattedNewPath}`);

    // New path already exists, so we can't rename
    if (fs.existsSync(baseURLNew)) {
      return res.status(500);
    }
    // Copy all files from old directory to new directory
    if (fs.lstatSync(baseURLOld).isDirectory()) {
      fse.copySync(baseURLOld, baseURLNew);
      fs.rmdirSync(baseURLOld, { recursive: true });
      res.send({ msg: "Success!" });
      // Rename file
    } else if (fs.lstatSync(baseURLOld).isFile()) {
      fs.renameSync(baseURLOld, baseURLNew);
      res.send({ msg: "Success!" });
    }
  });

  db_router.get("/getFiles", UserAuth.isAdmin, (req, res) => {
    let fileData = [];
    // This is the path with the specified directory we want to find files in.
    const formattedPath =
      req.query.path === "" ? `resource/` : `resource/${req.query.path}`;
    const baseURL = path.join(__dirname, `../../${formattedPath}`);
    fs.mkdirSync(baseURL, { recursive: true });
    // Get the files in the directory
    fs.readdir(baseURL, function (err, files) {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }
      const info = fs.statSync(baseURL);
      files.forEach(function (file) {
        // Only files have sizes, directories do not. Send file size if it is a file
        const fileInfo = fs.statSync(baseURL + file);
        if (fileInfo.isFile()) {
          fileData.push({
            file: file,
            size: fileInfo.size,
            lastModified: fileInfo.ctime,
          });
        } else {
          fileData.push({
            file: file,
            size: 0,
            lastModified: info.ctime,
          });
        }
      });
      res.send(fileData);
    });
  });

  db_router.delete("/removeFile", UserAuth.isAdmin, (req, res) => {
    const formattedPath = `resource/${req.query.path}`;
    const baseURL = path.join(__dirname, `../../${formattedPath}`);
    fs.unlink(baseURL, (err) => {
      if (err) {
        return res.status(500).send(err);
      } else {
        res.send({ msg: "Success!" });
      }
    });
  });

  db_router.delete("/removeDirectory", UserAuth.isAdmin, (req, res) => {
    const formattedPath = `resource/${req.query.path}`;
    const baseURL = path.join(__dirname, `../../${formattedPath}`);
    if (fs.existsSync(baseURL)) {
      fs.rmdirSync(baseURL, { recursive: true });
      return res.status(200).send({ msg: "Success!" });
    } else {
      return res.status(500).send({ msg: "Fail!" });
    }
  });


  db_router.post(
    "/submitProposal",
    [
      // TODO: Should the max length be set to something smaller than 5000?
      body("title")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 50 })
        .withMessage("Title must be under 50 characters"),
      body("organization")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 5000 }),
      body("primary_contact")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 5000 }),
      body("contact_email")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 5000 }),
      body("contact_phone")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 5000 }),
      body("background_info")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 5000 }),
      body("project_description")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 5000 }),
      body("project_scope")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 5000 }),
      body("project_challenges")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 5000 }),
      body("sponsor_provided_resources")
        .trim()
        .escape()
        .isLength({ max: 5000 }),
      body("constraints_assumptions")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 5000 }),
      body("sponsor_deliverables")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 5000 }),
      body("proprietary_info").trim().escape().isLength({ max: 5000 }),
      body("sponsor_alternate_time").trim().escape().isLength({ max: 5000 }),
      body("sponsor_avail_checked")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty"),
      body("project_agreements_checked")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty"),
      body("assignment_of_rights")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 5000 }),
    ],
    async (req, res) => {
      let result = validationResult(req);

      if (result.errors.length !== 0) {
        return res.status(400).send(result);
      }

      // Insert into the database
      let body = req.body;

      let date = new Date();
      let timeString = `${date.getFullYear()}-${date.getUTCMonth()}-${date.getDate()}`;
      const projectId = `${timeString}_${nanoid()}`;

      let filenamesCSV = "";
      // Attachment Handling
      if (req.files && req.files.attachments) {
        // If there is only one attachment, then it does not come as a list
        if (req.files.attachments.length === undefined) {
          req.files.attachments = [req.files.attachments];
        }

        if (req.files.attachments.length > 5) {
          // Don't allow more than 5 files
          return res.status(400).send({
            errors: [{ param: "files", msg: "Maximum of 5 files allowed" }],
          });
        }

        const baseURL = path.join(
          __dirname,
          `../sponsor_proposal_files/${projectId}`
        );

        fs.mkdirSync(baseURL, { recursive: true });

        for (let x = 0; x < req.files.attachments.length; x++) {
          if (req.files.attachments[x].size > 15 * 1024 * 1024) {
            // 15mb limit exceeded
            return res
              .status(400)
              .send({ errors: [{ param: "files", msg: "File too large" }] });
          }
          if (
            !CONFIG.accepted_file_types.includes(
              path.extname(req.files.attachments[x].name)
            )
          ) {
            // send an error if the file is not an accepted type
            return res.status(400).send({
              errors: [{ param: "files", msg: "Filetype not accepted" }],
            });
          }

          // Append the file name to the CSV string, begin with a comma if x is not 0
          filenamesCSV +=
            x === 0
              ? `${req.files.attachments[x].name}`
              : `, ${req.files.attachments[x].name}`;

          req.files.attachments[x].mv(
            `${baseURL}/${req.files.attachments[x].name}`,
            function (err) {
              if (err) {
                console.error(err);
                return res.status(500).send(err);
              }
            }
          );
        }
      }
      const sql = `INSERT INTO ${DB_CONFIG.tableNames.senior_projects}
                (project_id, status, title, organization, primary_contact, contact_email, contact_phone, attachments,
                background_info, project_description, project_scope, project_challenges,
                sponsor_provided_resources, constraints_assumptions, sponsor_deliverables,
                proprietary_info, sponsor_alternate_time, sponsor_avail_checked, project_agreements_checked, assignment_of_rights)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

      const params = [
        projectId,
        "submitted",
        body.title.substring(0, 50),
        body.organization,
        body.primary_contact,
        body.contact_email,
        body.contact_phone,
        filenamesCSV,
        body.background_info,
        body.project_description,
        body.project_scope,
        body.project_challenges,
        body.sponsor_provided_resources,
        body.constraints_assumptions,
        body.sponsor_deliverables,
        body.proprietary_info,
        body.sponsor_alternate_time,
        body.sponsor_avail_checked,
        body.project_agreements_checked,
        body.assignment_of_rights,
      ];

      db.query(sql, params)
        .then(() => {
          let doc = new PDFDoc();
          const baseURL = path.join(__dirname, `../proposal_docs/`);
          fs.mkdirSync(baseURL, { recursive: true });
          doc.pipe(fs.createWriteStream(`${baseURL}/${projectId}.pdf`));

          doc.font("Times-Roman");

          for (let key of Object.keys(DB_CONFIG.senior_project_proposal_keys)) {
            doc
              .fill("blue")
              .fontSize(16)
              .text(DB_CONFIG.senior_project_proposal_keys[key]),
              {
                underline: true,
              };
            doc
              .fontSize(12)
              .fill("black")
              .text(he.decode(body[key].replace(/\r\n|\r/g, "\n"))); // Text value from proposal
            doc.moveDown();
            doc.save();
          }

          doc.fill("blue").fontSize(16).text("Attachments"),
            {
              underline: true,
            };
          doc.fontSize(12).fill("black").text(filenamesCSV);
          doc.moveDown();
          doc.save();

          doc.end();
          return res.status(200).send();
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).send(err);
        });
    }
  );

  db_router.get("/getArchivePoster", (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "../../resource/archivePosters/" + req.query.fileName
      )
    );
  });

  db_router.get("/getArchiveVideo", (req, res) => {
    res.sendFile(
      path.join(__dirname, "../../resource/archiveVideos/" + req.query.fileName)
    );
  });

  db_router.get("/getArchiveImage", (req, res) => {
    res.sendFile(
      path.join(__dirname, "../../resource/archiveImages/" + req.query.fileName)
    );
  });

  db_router.get("/getActiveTimelines", [UserAuth.isSignedIn], (req, res) => {
    calculateActiveTimelines(req.user)
      .then((timelines) => {
        res.send(timelines);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send();
      });
  });

  db_router.post(
    "/submitAction",
    [UserAuth.isSignedIn, body("*").trim()],
    async (req, res) => {
      let result = validationResult(req);

      if (result.errors.length !== 0) {
        return res.status(400).send("Input is invalid");
      }

      let body = req.body;

      const query = `SELECT * FROM actions WHERE action_id = ?;`;
      const [action] = await db.query(query, [body.action_template]);

      const startDate = new Date(action.start_date);
      if (startDate > Date.now()) {
        return res.status(400).send("Can not submit action before start date.");
      }

      switch (action.action_target) {
        case ACTION_TARGETS.ADMIN:
          if (req.user.type !== USERTYPES.ADMIN) {
            return res
              .status(401)
              .send("Only admins can submit admin actions.");
          }
          break;
        case ACTION_TARGETS.COACH:
          if (req.user.type !== USERTYPES.COACH && req.user.type !== USERTYPES.ADMIN) {
            return res
              .status(401)
              .send("Only admins and coaches can submit coach actions.");
          }
          break;
        case ACTION_TARGETS.INDIVIDUAL:
          if (req.user.type !== USERTYPES.STUDENT) {
            return res
              .status(401)
              .send("Only students can submit individual actions.");
          }
          break;
        //TODO: Add case for PEER_EVALUATION
        case ACTION_TARGETS.PEER_EVALUATION:
          if (
            req.user.type !== USERTYPES.COACH &&
            req.user.type !== USERTYPES.STUDENT
          ) {
            return res
              .status(401)
              .send("Only coaches and students can submit peer evaluations.");
          }
          break;
        case ACTION_TARGETS.COACH_ANNOUNCEMENT:
        case ACTION_TARGETS.STUDENT_ANNOUNCEMENT:
          return res.status(401).send("You can not submit an announcement");
        case ACTION_TARGETS.TEAM:
          // Anyone can submit team actions
          break;
        case ACTION_TARGETS.PEER_EVALUATION:
          if (req.user.type !== USERTYPES.STUDENT) {
            return res
              .status(401)
              .send("Only students can submit peer evaluations.");
          }
          break;
        default:
          return res.status(500).send("Invalid action target.");
      }

      let date = new Date();
      let timeString = `${date.getFullYear()}-${date.getUTCMonth()}-${date.getDate()}`;
      const submission = `${timeString}_${nanoid()}`;

      let baseURL = path.join(
        __dirname,
        `../project_docs/${body.project}/${action.action_target}/${action.action_id}/${req.user.system_id}/${submission}`
      );

      // Attachment Handling
      let filenamesCSV = "";
      if (req.files && req.files.attachments) {
        // If there is only one attachment, then it does not come as a list
        if (req.files.attachments.length === undefined) {
          req.files.attachments = [req.files.attachments];
        }

        if (req.files.attachments.length > 5) {
          // Don't allow more than 5 files
          return res.status(400).send("Maximum of 5 files allowed");
        }

        fs.mkdirSync(baseURL, { recursive: true });

        for (let x = 0; x < req.files.attachments.length; x++) {
          if (
            req.files.attachments[x].size >
            (action.file_size || defaultFileSizeLimit)
          ) {
            // 15mb limit exceeded
            const responseText =
              "File exceeded submission size limit of: " +
              humanFileSize(action.file_size || defaultFileSizeLimit, false, 0);
            return res.status(400).send(responseText);
          }
          if (
            !action.file_types
              .split(",")
              .includes(
                path.extname(req.files.attachments[x].name).toLocaleLowerCase()
              )
          ) {
            // send an error if the file is not an accepted type
            return res.status(400).send("Filetype not accepted");
          }

          // Append the file name to the CSV string, begin with a comma if x is not 0
          filenamesCSV +=
            x === 0
              ? `${submission}/${req.files.attachments[x].name}`
              : `,${submission}/${req.files.attachments[x].name}`;

          req.files.attachments[x].mv(
            `${baseURL}/${req.files.attachments[x].name}`,
            function (err) {
              if (err) {
                console.error(err);
                return res.status(500).send(err);
              }
            }
          );
        }
      }

      let insertAction = `
            INSERT INTO action_log(
                action_template,
                system_id,
                project,
                form_data,
                files
                ${(req.user.mock && ",mock_id") || ""}
                )
            VALUES (?,?,?,?,?${(req.user.mock && ",?") || ""})
        `;

      let params = [
        body.action_template,
        req.user.system_id,
        body.project,
        body.form_data,
        filenamesCSV,
      ];
      if (req.user.mock) {
        params.push(req.user.mock.system_id);
      }

      db.query(insertAction, params)
        .then(() => {
          return res.sendStatus(200);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send(err);
        });
    }
  );

  db_router.get("/getHtml", (req, res) => {
    let getHtmlQuery = `SELECT * FROM page_html`;
    let queryParams = [];
    //If there is a query parameter, then select html from specified table.
    if (typeof req.query.name !== "undefined" && req.query.name) {
      getHtmlQuery = `SELECT html FROM page_html WHERE name = ?`;
      queryParams = [req.query.name];
    }
    db.query(getHtmlQuery, queryParams)
      .then((html) => {
        res.send(html);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });
  });

  db_router.post("/editPage", [UserAuth.isAdmin], (req, res) => {
    let editPageQuery = `UPDATE page_html
        SET html = ?
        WHERE name = ?
        `;
    let promises = [];
    //Individually update all html tables from the body of the req.
    Object.keys(req.body).forEach((key) => {
      let queryParams = [req.body[key], key];
      promises.push(
        db
          .query(editPageQuery, queryParams)
          .then(() => {
            //do nothing
          })
          .catch((err) => {
            console.error(err);
            res.send({ error: err });
          })
      );
    });
    Promise.all(promises).then(() => {
      res.send({ msg: "Success!" });
    });
  });

  db_router.get("/getActions", [UserAuth.isCoachOrAdmin], (req, res) => {
    let getActionsQuery;
    switch(req.user.type ){
      case USERTYPES.ADMIN:
      getActionsQuery = `
            SELECT *
            FROM actions
            WHERE actions.action_id NOT IN (SELECT action_id FROM actions WHERE action_target = 'private' AND created_by_id != '${req.user.system_id}')
            ORDER BY action_id desc
        `;
        break;
    default:
      getActionsQuery = `
            SELECT *
            FROM actions
            WHERE actions.action_id NOT IN (SELECT action_id FROM actions WHERE action_target != 'individual' AND action_target != 'team' AND action_target != 'coach')
            AND actions.action_id NOT IN (SELECT action_id FROM actions WHERE action_target = 'private' AND created_by_id != '${req.user.system_id}')
            ORDER BY action_id desc
        `;
    }
    db.query(getActionsQuery)
      .then((values) => {
        res.send(values);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  db_router.get("/getActionsByProject", [UserAuth.isCoachOrAdmin], (req, res) => {
    let getActionsQuery;
    switch (req.user.type) {
      case USERTYPES.ADMIN:
        getActionsQuery = `
            SELECT *
            FROM actions
            WHERE actions.action_id NOT IN (SELECT action_id FROM actions WHERE action_target = 'private' AND created_by_id != '${req.user.system_id}')
            AND actions.project = ${req.query.project}
            AND parent_id = 0
            ORDER BY action_id desc
        `;
        break
      default:
        getActionsQuery = `
            SELECT *
            FROM actions
            WHERE actions.action_id NOT IN (SELECT action_id FROM actions WHERE action_target != 'individual' AND action_target != 'team' AND action_target != 'coach')
            AND actions.action_id NOT IN (SELECT action_id FROM actions WHERE action_target = 'private' AND created_by_id != '${req.user.system_id}')
            AND actions.project = ${req.query.project}
            AND parent_id = 0
            ORDER BY action_id desc
        `;
    }
    db.query(getActionsQuery)
      .then((values) => {
        res.send(values);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  db_router.get("/getTimelineActions", [UserAuth.isSignedIn], async (req, res) => {
      if (
        req.user.type === USERTYPES.STUDENT &&
        req.query.project_id !== req.user.project
      ) {
        return res
          .status(401)
          .send("Trying to access project that is not your own");
      }
      //filter for users to see only actions related to themselves
      let actionFilter;
      switch (req.user.type) {
        case USERTYPES.ADMIN:
          actionFilter = "";
          break;
        case USERTYPES.STUDENT:
          actionFilter = `AND actions.action_id NOT IN (SELECT action_id FROM actions WHERE action_target != 'individual' AND action_target != 'team' AND action_target != 'coach')`;
          break;
        case USERTYPES.COACH:
          actionFilter = `AND actions.action_id NOT IN (SELECT action_id FROM actions WHERE action_target != 'individual' AND action_target != 'team' AND action_target != 'coach' AND action_target != 'coach_hidden' AND action_target != 'private')`;
          break;
        default:
          throw new Error("Unhandled user role");
      }
      //filter for private actions
      let privacyFilter = `AND actions.action_id NOT IN (SELECT action_id FROM actions WHERE action_target = 'private' AND created_by_id != '${req.user.system_id}')`
      let activeFilter = `actions.action_id IN (SELECT action_id FROM actions WHERE actions.date_deleted != '' AND datetime('now') >= activation_date)`
      // Add a case for when the action target is 'peer_evaluation'
      // The action is not done unless compelted by all students, AND the coach has passed it through
      let getTimelineActions = `SELECT action_title, action_id, parent_id, start_date, due_date, semester, action_target, date_deleted, short_desc, file_types, file_size, page_html,
                    CASE
                        WHEN action_target IS 'admin' AND action_log.system_id IS NOT NULL THEN 'green'
                        WHEN action_target IS 'coach' AND action_log.system_id IS NOT NULL THEN 'green'
                        WHEN action_target IS 'coach_hidden' AND action_log.system_id IS NOT NULL THEN 'green'
                        WHEN action_target IS 'private' and action_log.system_id IS NOT NULL THEN 'green'
                        WHEN action_target IS 'team' AND action_log.system_id IS NOT NULL THEN 'green'
                        WHEN action_target = 'peer_evaluation' AND COUNT(DISTINCT action_log.system_id) IS (SELECT COUNT(DISTINCT action_log.system_id) FROM users WHERE users.project = ?) + 1 THEN 'green'
                        WHEN action_target IS 'individual' AND COUNT(DISTINCT action_log.system_id) IS (SELECT COUNT(DISTINCT action_log.system_id) FROM users WHERE users.project = ?) THEN 'green'
                        WHEN start_date <= date('now') AND due_date >= date('now') THEN 'yellow'
                        WHEN date('now') > due_date AND action_log.system_id IS NULL THEN 'red'
                        WHEN date('now') > due_date AND action_target IS 'individual' AND COUNT(DISTINCT action_log.system_id) != (SELECT COUNT(DISTINCT action_log.system_id) FROM users WHERE users.project = ?) THEN 'red'
                        WHEN date('now') < start_date THEN 'grey'
                    ELSE 'UNHANDLED-CASE'
                END AS 'state'
            FROM actions
            LEFT JOIN action_log
                ON action_log.action_template = actions.action_id
                WHERE actions.project = ${req.query.project_id}
                ${actionFilter}
                ${privacyFilter}
                AND (${activeFilter} OR actions.date_deleted = '')
                AND actions.action_target NOT IN ('${ACTION_TARGETS.COACH_ANNOUNCEMENT}', '${ACTION_TARGETS.STUDENT_ANNOUNCEMENT}')           
            GROUP BY actions.action_id`;

      db.query(getTimelineActions, req.query.project_id)
        .then((values) => {
          res.send(values);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send(err);
        });
    }
  );

  db_router.get(
    "/getTimelineSubActions",
    [UserAuth.isSignedIn],
    async (req, res) => {
      if (
        req.user.type === USERTYPES.STUDENT &&
        req.query.project_id !== req.user.project
      ) {
        return res
          .status(401)
          .send("Trying to access project that is not your own");
      }
      //filter for users to see only actions related to themselves
      let actionFilter;
      switch (req.user.type) {
        case USERTYPES.ADMIN:
          actionFilter = "";
          break;
        case USERTYPES.STUDENT:
          actionFilter = `AND actions.action_id NOT IN (SELECT action_id FROM actions WHERE action_target != 'individual' AND action_target != 'team')`;
          break;
        case USERTYPES.COACH:
          actionFilter = `AND actions.action_id NOT IN (SELECT action_id FROM actions WHERE action_target != 'individual' AND action_target != 'team' AND action_target != 'coach')`;
          break;
        default:
          throw new Error("Unhandled user role");
      }
      // Add a case for when the action target is 'peer_evaluation'
      // The action is not done unless compelted by all students, AND the coach has passed it through
      let getTimelineActions = `SELECT *
            FROM actions
            WHERE actions.parent_id != 0
            ORDER BY action_id desc`;

      db.query(getTimelineActions, req.query.project_id)
        .then((values) => {
          res.send(values);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send(err);
        });
    }
  );

  

  /*
   * This will join between the action and action_log tables. It returns the due date from
   * a specific log_id's action_template # = action_id.
   */
  db_router.get("/getLateSubmission", [UserAuth.isSignedIn], (req, res) => {
    let getLateSubmissionQuery = `SELECT actions.due_date
                                      FROM action_log
                                      JOIN actions ON actions.action_id = action_log.action_template
                                      WHERE action_log.action_log_id = ?`;
    let params = [req.query.log_id];
    db.query(getLateSubmissionQuery, params)
      .then((values) => {
        res.send(values);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });
  });

  db_router.get("/getActionLogs", [UserAuth.isSignedIn], (req, res) => {
    let getActionLogQuery = "";
    let params = [];

    switch (req.user.type) {
      case USERTYPES.STUDENT:
        // NOTE: Technically, users are able to see if coaches submitted actions to other projects, but they should not be able to see the actual submission content form this query so that should be fine
        //          This is because of the "OR users.type = '${USERTYPES.COACH}'" part of the following query.
        getActionLogQuery = `SELECT action_log.action_log_id, action_log.submission_datetime, action_log.action_template, action_log.system_id, action_log.mock_id, action_log.project,
                        actions.action_title,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = action_log.system_id) name,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = action_log.mock_id) mock_name
                    FROM action_log
                        JOIN actions ON actions.action_id = action_log.action_template
                        WHERE action_log.action_template = ? AND action_log.project = ?`;
        params = [req.query.action_id, req.user.project];
        break;
      case USERTYPES.COACH:
      case USERTYPES.ADMIN:
        getActionLogQuery = `SELECT action_log.*, actions.action_title,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = action_log.system_id) AS name,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = action_log.mock_id) AS mock_name
                    FROM action_log
                    JOIN actions ON actions.action_id = action_log.action_template
                    WHERE action_log.action_template = ? AND action_log.project = ?`;
        params = [req.query.action_id, req.query.project_id];
        break;

      default:
        res.status(401).send("Unknown role");
        return;
    }
    db.query(getActionLogQuery, params)
      .then((values) => {
        res.send(values);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });
  });

  db_router.get(
    "/getAllActionLogs",
    [UserAuth.isSignedIn],
    async (req, res) => {
      const { resultLimit, offset } = req.query;

      let getActionLogQuery = "";
      let queryParams = [];
      let getActionLogCount = "";
      let countParams = [];

      switch (req.user.type) {
        case USERTYPES.STUDENT:
          getActionLogQuery = `SELECT action_log.action_log_id, action_log.submission_datetime AS submission_datetime, action_log.action_template, action_log.system_id, action_log.mock_id,  action_log.project,
                        actions.action_target, actions.action_title, actions.semester,
                        projects.display_name, projects.title,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = action_log.system_id) name,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = action_log.mock_id) mock_name
                    FROM action_log
                        JOIN actions ON actions.action_id = action_log.action_template
                        JOIN projects ON projects.project_id = action_log.project
                        WHERE action_log.project = ?
                        AND action_log.oid NOT IN (SELECT oid FROM action_log
                            ORDER BY submission_datetime DESC LIMIT ?)
                        ORDER BY submission_datetime DESC LIMIT ?`;
          queryParams = [req.user.project, offset || 0, resultLimit || 0];
          getActionLogCount = `SELECT COUNT(*) FROM action_log
                    JOIN actions ON actions.action_id = action_log.action_template
                    WHERE action_log.project = ?
                    AND action_log.system_id in (SELECT users.system_id FROM users WHERE users.project = ?)`;
          countParams = [req.user.project, req.user.project];
          break;
        case USERTYPES.COACH:
          getActionLogQuery = `SELECT action_log.action_log_id, action_log.submission_datetime AS submission_datetime, action_log.action_template, action_log.system_id, action_log.mock_id,  action_log.project,
                    actions.action_target, actions.action_title, actions.semester,
                    projects.display_name, projects.title,
                    (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = action_log.system_id) name,
                    (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = action_log.mock_id) mock_name
                    FROM action_log
                        JOIN actions ON actions.action_id = action_log.action_template
                        JOIN projects ON projects.project_id = action_log.project
                        WHERE action_log.project IN (SELECT project_id FROM project_coaches WHERE coach_id = ?)
                        AND action_log.oid NOT IN (SELECT oid FROM action_log
                            ORDER BY submission_datetime DESC LIMIT ?)
                        ORDER BY submission_datetime DESC LIMIT ?`;
          queryParams = [req.user.system_id, offset || 0, resultLimit || 0];
          getActionLogCount = `SELECT COUNT(*) FROM action_log WHERE action_log.project IN (SELECT project_id FROM project_coaches WHERE coach_id = ?)`;
          countParams = [req.user.system_id];
          break;
        case USERTYPES.ADMIN:
          getActionLogQuery = `SELECT action_log.action_log_id, action_log.submission_datetime AS submission_datetime, action_log.action_template, action_log.system_id, action_log.mock_id,  action_log.project,
                actions.action_target, actions.action_title, actions.semester,
                projects.display_name, projects.title,
                (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = action_log.system_id) name,
                (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = action_log.mock_id) mock_name
                FROM action_log
                    JOIN actions ON actions.action_id = action_log.action_template
                    JOIN projects ON projects.project_id = action_log.project
                    AND action_log.oid NOT IN (SELECT oid FROM action_log
                        ORDER BY submission_datetime DESC LIMIT ?)
                    ORDER BY submission_datetime DESC LIMIT ?`;
          queryParams = [offset || 0, resultLimit || 0];
          getActionLogCount = `SELECT COUNT(*) FROM action_log`;
          break;
        default:
          res.status(401).send("Unknown role");
          return;
      }

      const actionLogsPromise = db.query(getActionLogQuery, queryParams);
      const actionLogsCountPromise = db.query(getActionLogCount, countParams);
      Promise.all([actionLogsCountPromise, actionLogsPromise])
        .then(([[actionLogCount], projects]) => {
          res.send({
            actionLogCount: actionLogCount[Object.keys(actionLogCount)[0]],
            actionLogs: projects,
          });
        })
        .catch((error) => {
          res.status(500).send(error);
        });
    }
  );

  db_router.get("/getTimeLogs", [UserAuth.isSignedIn], async (req, res) => {
    let getTimeLogQuery = "";
    let params = [];

    switch (req.user.type) {
      case USERTYPES.STUDENT:
        // NOTE: Technically, users are able to see if coaches submitted time logs to other projects, but they should not be able to see the actual submission content form this query so that should be fine
        //          This is because of the "OR users.type = '${USERTYPES.COACH}'" part of the following query.
                getTimeLogQuery = `SELECT time_log.time_log_id, time_log.submission_datetime, time_log.time_amount, time_log.system_id, time_log.mock_id, time_log.project, time_log.work_date, time_log.work_comment,time_log.active,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = time_log.system_id) name,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = time_log.mock_id) mock_name
                    FROM time_log
                        WHERE time_log.project = ?
                        ORDER BY
                        time_log.work_date DESC`;
        params = [req.user.project];
        break;
      case USERTYPES.COACH:
      case USERTYPES.ADMIN:
        getTimeLogQuery = `SELECT time_log.*,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = time_log.system_id) AS name,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = time_log.mock_id) AS mock_name
                    FROM time_log
                    WHERE time_log.project = ?`;
        params = [req.query.project_id];
        break;

      default:
        res.status(401).send("Unknown role");
        return;
    }
    db.query(getTimeLogQuery, params)
      .then((values) => {
        res.send(values);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });
  });

  db_router.get("/getAllTimeLogs", [UserAuth.isSignedIn], async (req, res) => {
    const { resultLimit, offset } = req.query;

    let getTimeLogQuery = "";
    let queryParams = [];
    let getTimeLogCount = "";
    let countParams = [];

    switch (req.user.type) {
      case USERTYPES.STUDENT:
        getTimeLogQuery = `SELECT time_log.*,
                        projects.display_name, projects.title,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = time_log.system_id) name,
                        (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = time_log.mock_id) mock_name
                    FROM time_log
                        JOIN projects ON projects.project_id = time_log.project
                        WHERE time_log.project = ?
                          ORDER BY
                        time_log.work_date DESC`;
        queryParams = [req.user.project];
        getTimeLogCount = `SELECT COUNT(*) FROM time_log
                    WHERE time_log.project = ?
                    AND time_log.system_id in (SELECT users.system_id FROM users WHERE users.project = ?)`;
        countParams = [req.user.project, req.user.project];
        break;
      case USERTYPES.COACH:
        getTimeLogQuery = `SELECT time_log.*,
                    projects.display_name, projects.title,
                    (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = time_log.system_id) name,
                    (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = time_log.mock_id) mock_name
                    FROM time_log
                        JOIN projects ON projects.project_id = time_log.project
                        WHERE time_log.project IN (SELECT project_id FROM project_coaches WHERE coach_id = ?) `;
        queryParams = [req.user.system_id];
        getTimeLogCount = `SELECT COUNT(*) FROM time_log WHERE time_log.project IN (SELECT project_id FROM project_coaches WHERE coach_id = ?)`;
        countParams = [req.user.system_id];
        break;
      case USERTYPES.ADMIN:
        getTimeLogQuery = `SELECT time_log.*,
                projects.display_name, projects.title,
                (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = time_log.system_id) name,
                (SELECT group_concat(users.fname || ' ' || users.lname) FROM users WHERE users.system_id = time_log.mock_id) mock_name
                FROM time_log
                    JOIN projects ON projects.project_id = time_log.project `;
        queryParams = [];
        getTimeLogCount = `SELECT COUNT(*) FROM time_log`;
        break;
      default:
        res.status(401).send("Unknown role");
        return;
    }

    const timeLogsPromise = db.query(getTimeLogQuery, queryParams);
    const timeLogsCountPromise = db.query(getTimeLogCount, countParams);
    Promise.all([timeLogsCountPromise, timeLogsPromise])
      .then(([[timeLogCount], projects]) => {
        res.send({
          timeLogCount: timeLogCount[Object.keys(timeLogCount)[0]],
          timeLogs: projects,
        });
        })
        .catch((error) => {
          res.status(500).send(error);
        });
    }
  );

  db_router.get(
    "/getCoachFeedback",
    [UserAuth.isSignedIn],
    async (req, res) => {
      const getFeedbackQuery = `
            SELECT form_data, a.action_title as title, a.start_date as date, a.action_id, submission_datetime
            FROM action_log
            JOIN main.users u on action_log.system_id = u.system_id
            JOIN main.actions a on action_log.action_template = a.action_id
            WHERE action_log.project = ?  AND u.type = 'coach'
        `;

      db.query(getFeedbackQuery, req.query.project_id)
        .then((feedback) => {
          res.send(feedback);
        })
        .catch((e) => {
          console.error(e);
          res.status(500).send(e);
        });
    }
  );


  /**
   * This is for getting the archive data to view/edit based on a specific ID.
   * */
  db_router.get("/getArchiveProject", [UserAuth.isAdmin], (req, res) => {
    let query = `
            SELECT *
            FROM archive
            WHERE archive_id = ?
        `;

    const params = [req.query.archive_id];
    db.query(query, params).then((project) => res.send(project));
  });



  db_router.get("/getSubmission", [UserAuth.isSignedIn], (req, res) => {
    let getSubmissionQuery = "";
    let params = [];

    switch (req.user.type) {
      case USERTYPES.STUDENT:
        getSubmissionQuery = `SELECT action_log.form_data, action_log.files
                    FROM action_log
                    JOIN actions ON actions.action_id = action_log.action_template
                    WHERE action_log.action_log_id = ? AND (actions.action_target = '${ACTION_TARGETS.TEAM}' OR action_log.system_id = ?)`;
        params = [req.query.log_id, req.user.system_id];
        break;
      case USERTYPES.COACH:
        getSubmissionQuery = `SELECT action_log.form_data, action_log.files
                    FROM action_log
                    JOIN project_coaches ON project_coaches.project_id = action_log.project
                    WHERE action_log.action_log_id = ? AND project_coaches.coach_id = ?`;
        params = [req.query.log_id, req.user.system_id];
        break;
      case USERTYPES.ADMIN:
        getSubmissionQuery = `SELECT action_log.form_data, action_log.files
                    FROM action_log
                    WHERE action_log.action_log_id = ?`;
        params = [req.query.log_id];
        break;
      default:
        res.status(401).send("Unknown role");
        return;
    }

    db.query(getSubmissionQuery, params)
      .then((submissions) => {
        res.send(submissions);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });
  });

  db_router.get(
    "/getSubmissionFile",
    [UserAuth.isSignedIn],
    async (req, res) => {
      let getSubmissionQuery = "";
      let params = [];

      switch (req.user.type) {
        case USERTYPES.STUDENT:
          getSubmissionQuery = `SELECT action_log.files, action_log.project, action_log.system_id, actions.action_id, actions.action_target
                    FROM action_log
                    JOIN actions ON actions.action_id = action_log.action_template
                    WHERE action_log.action_log_id = ? AND (actions.action_target = '${ACTION_TARGETS.TEAM}' OR action_log.system_id = ?)`;
          params = [req.query.log_id, req.user.system_id];
          break;
        case USERTYPES.COACH:
          getSubmissionQuery = `SELECT action_log.files, action_log.project, action_log.system_id, actions.action_id, actions.action_target
                    FROM action_log
                    JOIN actions ON actions.action_id = action_log.action_template
                    JOIN project_coaches ON project_coaches.project_id = action_log.project
                    WHERE action_log.action_log_id = ? AND project_coaches.coach_id = ?`;
          params = [req.query.log_id, req.user.system_id];
          break;
        case USERTYPES.ADMIN:
          getSubmissionQuery = `SELECT action_log.files, action_log.project, action_log.system_id, actions.action_id, actions.action_target
                    FROM action_log
                    JOIN actions ON actions.action_id = action_log.action_template
                    WHERE action_log.action_log_id = ?`;
          params = [req.query.log_id];
          break;
        default:
          res.status(401).send("Unknown role");
          return;
      }

      const { files, project, action_target, system_id, action_id } =
        (await db.query(getSubmissionQuery, params))[0] || {};

      let fileList = [];
      if (files) {
        fileList = files.split(",");
      }

      if (
        fileList.includes(req.query.file) &&
        project &&
        action_target &&
        system_id &&
        action_id
      ) {
        return res.sendFile(
          path.join(
            __dirname,
            `../project_docs/${project}/${action_target}/${action_id}/${system_id}/${req.query.file}`
          )
        );
      }
      res
        .status(404)
        .send("File not found or you are unauthorized to view file");
    }
  );

  db_router.post(
    "/editAction",
    [UserAuth.isCoachOrAdmin, body("page_html").unescape()],
    (req, res) => {
      let body = req.body;
    Logger.info(body)
      let updateQuery = `
            UPDATE actions
            SET semester = ?,
                action_title = ?,
                action_target = ?,
                date_deleted = ?,
                short_desc = ?,
                start_date = ?,
                due_date = ?,
                page_html = ?,
                file_types = ?,
                file_size = ?,
                parent_id = ?,
                created_by_id = ?
            WHERE action_id = ?
        `;

      const date_deleted =
        body.date_deleted === "false"
          ? moment().format(CONSTANTS.datetime_format)
          : "";
      const parsedFileSize = body.file_size
        ? fileSizeParser(body.file_size)
        : null;

      let params = [
        body.semester,
        body.action_title,
        body.action_target,
        date_deleted,
        body.short_desc,
        body.start_date,
        body.due_date,
        body.page_html,
        body.file_types,
        parsedFileSize,
        body.parent_id,
        body.created_by_id,
        body.action_id,
      ];

      db.query(updateQuery, params)
        .then(() => {
          return res.status(200).send();
        })
        .catch((err) => {
          return res.status(500).send(err);
        });
    }
  );

  db_router.post("/removeAction", [UserAuth.isCoachOrAdmin], (req, res) => {
    let submittedQuery = `SELECT system_id, created_by_id FROM actions LEFT JOIN action_log ON action_log.action_template = actions.action_id WHERE action_id = ${req.body.id}`
    db.query(submittedQuery)
      .then((response) => {
        if (response[0] == undefined) {
        }
        else if (response[0]["system_id"] == null) {
          if (response[0]["created_by_id"] !== req.user.system_id && req.user.type !== USERTYPES.ADMIN) {
            return res.status(403).send();
          }
          else {
            let deleteQuery = `INSERT INTO deleted_actions SELECT * FROM actions WHERE action_id = ${req.body.id}`
            let removeQuery = `DELETE FROM actions WHERE action_id = ${req.body.id}`
            db.query(deleteQuery)
              .then(() => {
                db.query(removeQuery)
                  .then(() => {
                    return res.status(200).send();
                  })
                  .catch((err) => {
                    return res.status(500).send(err);
                  });
              })
          }
        }
        else {
          return res.status(403).send();
        }
      })
  });

  db_router.get(
    "/searchForArchive",
    (req, res) => {
    const { resultLimit, offset, searchQuery, inactive } = req.query;
    let skipNum = offset * resultLimit;
    let getProjectsQuery = "";
    let queryParams = [];
    let getProjectsCount = "";
    let projectCountParams = [];

    // allow inactive projects in search
    if (inactive === "true") {
      getProjectsQuery = `SELECT * FROM  archive WHERE
                            archive.OID NOT IN (
                SELECT OID
                FROM archive
                WHERE title like ?
                   OR sponsor like ?
                   OR members like ?
                   OR coach like ?
                   OR keywords like ?
                   OR synopsis like ?
                   OR url_slug like ?
                ORDER BY title,
                         sponsor,
                         members,
                         coach,
                         keywords,
                         synopsis,
                         url_slug
            LIMIT ?
            ) AND (
                archive.title like ?
                OR archive.sponsor like ?
                OR archive.members like ?
                OR archive.coach like ?
                OR archive.keywords like ?
                OR archive.synopsis like ?
                OR archive.url_slug like ?
                )
            ORDER BY
                archive.title,
                archive.sponsor,
                archive.members,
                archive.coach,
                archive.keywords,
                archive.synopsis,
                archive.url_slug
            LIMIT ?`;

      getProjectsCount = `SELECT COUNT(*)
                            FROM archive
                            WHERE
                                title like ?
                                OR sponsor like ?
                                OR members like ?
                                OR coach like ?
                                OR keywords like ?
                                OR synopsis like ?
                                OR url_slug like ?
                                `;
    } else {
      getProjectsQuery = `SELECT * FROM  archive WHERE
                            archive.OID NOT IN (
                SELECT OID
                FROM archive
                WHERE title like ?
                   OR sponsor like ?
                   OR members like ?
                   OR coach like ?
                   OR keywords like ?
                   OR synopsis like ?
                   OR url_slug like ?
                   AND inactive = ''
                ORDER BY title,
                         sponsor,
                         members,
                         coach,
                         keywords,
                         synopsis,
                         url_slug
            LIMIT ?
            ) AND (
                archive.title like ?
                OR archive.sponsor like ?
                OR archive.members like ?
                OR archive.coach like ?
                OR archive.keywords like ?
                OR archive.synopsis like ?
                OR archive.url_slug like ?
                AND inactive = ''
                )
            ORDER BY
                archive.title,
                archive.sponsor,
                archive.members,
                archive.coach,
                archive.keywords,
                archive.synopsis,
                archive.url_slug
            LIMIT ?`;

      getProjectsCount = `SELECT COUNT(*)
                            FROM archive
                            WHERE
                                title like ?
                                OR sponsor like ?
                                OR members like ?
                                OR coach like ?
                                OR keywords like ?
                                OR synopsis like ?
                                OR url_slug like ?
                                AND (inactive = '' OR inactive IS NULL)
                                `;
    }

    const searchQueryParam = searchQuery || "";

    queryParams = [
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      skipNum || 0,
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      resultLimit || 0,
    ];
    projectCountParams = [
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
      "%" + searchQueryParam + "%",
    ];

    const projectPromise = db.query(getProjectsQuery, queryParams);
    const projectCountPromise = db.query(getProjectsCount, projectCountParams);
    Promise.all([projectCountPromise, projectPromise])
      .then(([[projectCount], projectRows]) => {
        res.send({
          projectCount: projectCount[Object.keys(projectCount)[0]],
          projects: projectRows,
        });
      })
      .catch((error) => {
        res.status(500).send(error);
      });
    }
  );

  db_router.get("/getArchiveFromSlug", (req, res) => {
    let query = `SELECT * FROM archive WHERE url_slug=?`;
    let params = [req.query.url_slug];
    db.query(query, params)
      .then((values) => {
        res.status(200).send(values);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });
  });


  db_router.post(
    "/createAction",
    [UserAuth.isCoachOrAdmin, body("page_html").unescape()],
    (req, res) => {
      let body = req.body;
      Logger.info(body)
      let updateQuery = `
            INSERT into actions
            (semester, project, action_title, action_target, date_deleted, activation_date, short_desc, start_date, due_date, page_html, file_types, file_size, parent_id, created_by_id)
            values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

      const date_deleted =
        body.date_deleted === "false"
          ? moment().format(CONSTANTS.datetime_format)
          : "";
      const parsedFileSize = body.file_size
        ? fileSizeParser(body.file_size)
        : null;

      let params = [
        body.semester,
        body.project,
        body.action_title,
        body.action_target,
        date_deleted,
        body.activation_date,
        body.short_desc,
        body.start_date,
        body.due_date,
        body.page_html,
        body.file_types,
        parsedFileSize,
        body.parent_id,
        body.created_by_id
      ];
      db.query(updateQuery, params)
        .then(() => {
          return res.status(200).send();
        })
        .catch((err) => {
          return res.status(500).send(err);
        });
    }
  );

  db_router.post(
    "/copyActionSet",
    [UserAuth.isAdmin],
    async (req, res) => {
      console.log('Received copyActionSet request:', {
        body: req.body,
        user: req.user
      });

      let { actions, targetSemester, targetProject } = req.body;

      if (!Array.isArray(actions) || actions.length === 0 || !targetSemester || !targetProject) {
        console.log('Invalid request - missing required fields:', {
          hasActions: Array.isArray(actions),
          actionCount: actions?.length,
          targetSemester,
          targetProject
        });
        return res.status(400).send("Invalid request: actions array, target semester, and target project are required");
      }

      // Get the target semester's start date to adjust action dates
      const getSemesterQuery = `
        SELECT start_date
        FROM semester_group
        WHERE semester_id = ?
      `;

      try {
        console.log('Fetching target semester data for:', targetSemester);
        const [targetSemesterData] = await db.query(getSemesterQuery, [targetSemester]);
        console.log('Target semester data:', targetSemesterData);

        if (!targetSemesterData) {
          console.log('Target semester not found:', targetSemester);
          return res.status(404).send("Target semester not found");
        }

        const targetStartDate = moment(targetSemesterData.start_date);
        const sourceStartDate = moment(actions[0].start_date);
        const dateOffset = targetStartDate.diff(sourceStartDate, 'days');
        console.log('Date calculations:', {
          targetStartDate: targetStartDate.format(),
          sourceStartDate: sourceStartDate.format(),
          dateOffset
        });

        // Get existing actions in the target project to check for name conflicts
        const getExistingActionsQuery = `
          SELECT action_title
          FROM actions
          WHERE project = ?
        `;
        console.log('Fetching existing actions for project:', targetProject);
        const existingActions = await db.query(getExistingActionsQuery, [targetProject]);
        console.log('Existing actions:', existingActions);

        const existingTitles = new Set(existingActions.map(a => a.action_title));

        // Prepare the insert query for multiple actions
        const insertQuery = `
          INSERT into actions
          (semester, project, action_title, action_target, date_deleted, short_desc, start_date, due_date, page_html, file_types, file_size)
          values (?,?,?,?,?,?,?,?,?,?,?)
        `;

        // Create an array of promises for each action insert
        const insertPromises = actions.map(async action => {
          const adjustedStartDate = moment(action.start_date).add(dateOffset, 'days').format(CONSTANTS.datetime_format);
          const adjustedDueDate = moment(action.due_date).add(dateOffset, 'days').format(CONSTANTS.datetime_format);
          const date_deleted = action.date_deleted === "false" ? moment().format(CONSTANTS.datetime_format) : "";
          const parsedFileSize = action.file_size ? fileSizeParser(action.file_size) : null;

          console.log('Processing action:', {
            title: action.action_title,
            adjustedStartDate,
            adjustedDueDate,
            date_deleted,
            parsedFileSize
          });

          // Check if action title already exists and modify if needed
          let newTitle = action.action_title;
          if (existingTitles.has(newTitle)) {
            let count = 2;
            while (existingTitles.has(`${newTitle} (${count})`)) {
              count++;
            }
            newTitle = `${newTitle} (${count})`;
            existingTitles.add(newTitle);
          } else {
            existingTitles.add(newTitle);
          }

          const params = [
            targetSemester,
            targetProject,
            newTitle,
            action.action_target,
            date_deleted,
            action.short_desc,
            adjustedStartDate,
            adjustedDueDate,
            action.page_html,
            action.file_types,
            parsedFileSize,
          ];

          console.log('Inserting action with params:', params);
          return db.query(insertQuery, params);
        });

        // Execute all inserts in parallel
        console.log('Executing', insertPromises.length, 'action inserts');
        await Promise.all(insertPromises);
        console.log('All actions inserted successfully');
        return res.status(200).send();
      } catch (err) {
        console.error('Error in copyActionSet:', err);
        return res.status(500).send(err);
      }
    }
  );

  db_router.get("/getSemesters", [UserAuth.isSignedIn], (req, res) => {
    let getSemestersQuery = `
            SELECT *
            FROM semester_group
            ORDER BY end_date, start_date, name
        `;
    db.query(getSemestersQuery)
      .then((values) => {
        res.send(values);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  db_router.get("/getArchive", [UserAuth.isAdmin], (req, res) => {
    let getArchiveQuery = `
            SELECT *
            FROM archive`;
    db.query(getArchiveQuery)
      .then((values) => {
        res.send(values);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  db_router.get(
    "/getSemesterAnnouncements",
    [UserAuth.isSignedIn],
    (req, res) => {
      let filter = "";
      if (req.user.type === USERTYPES.STUDENT) {
        // req.query.semester comes in as a string and req.user.semester_group is a number so convert both to strings to compare them.
        if (`${req.query.semester}` !== `${req.user.semester_group}`) {
          return res
            .status(401)
            .send(
              "Students can not access announcements that are not for your project"
            );
        }

        filter = `AND actions.action_target IS NOT '${ACTION_TARGETS.COACH_ANNOUNCEMENT}'`;
        // Note: Since we only do this check for students, coaches can technically hack the request to see announcements for other semesters.
        // Unfortunately, coaches don't inherently have a semester like students do
        // and 1am Kevin can't think of another way of ensuring that a coach isn't lying to us about their semester ...but idk what they would gain form doing that sooo ima just leave it for now
      }

      //ToDo: make sure that the dates don't screw things up because of GMT i.e. it becomes tomorrow in GMT before it becomes tomorrow at the server's location
      let getTimelineActions = `
            SELECT action_title, action_id, start_date, due_date, semester, action_target, date_deleted, page_html
            FROM actions
            WHERE actions.date_deleted = '' AND actions.semester = ?
                AND (actions.action_target IN ('${ACTION_TARGETS.COACH_ANNOUNCEMENT}', '${ACTION_TARGETS.STUDENT_ANNOUNCEMENT}') AND actions.start_date <= date('now') AND actions.due_date >= date('now'))
                ${filter}
            ORDER BY actions.action_id ASC
        `;

      db.query(getTimelineActions, [req.query.semester])
        .then((values) => {
          res.send(values);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send(err);
        });
    }
  );

  db_router.post(
    "/editSemester",
    [UserAuth.isAdmin, body("*").trim()],
    (req, res) => {
      let body = req.body;

      let updateQuery = `
            UPDATE semester_group
            SET name = ?,
                dept = ?,
                start_date = ?,
                end_date = ?
            WHERE semester_id = ?
        `;

      let params = [
        body.name,
        body.dept,
        body.start_date,
        body.end_date,
        body.semester_id,
      ];

      db.query(updateQuery, params)
        .then(() => {
          return res.status(200).send();
        })
        .catch((err) => {
          return res.status(500).send(err);
        });
    }
  );

  db_router.post(
    "/createSemester",
    [
      UserAuth.isAdmin,
      body("name")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 50 }),
      body("dept")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 50 }),
      body("start_date")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 50 }),
      body("end_date")
        .not()
        .isEmpty()
        .trim()
        .escape()
        .withMessage("Cannot be empty")
        .isLength({ max: 50 }),
    ],
    (req, res) => {
      let result = validationResult(req);

      if (result.errors.length !== 0) {
        res.status(400).send(result);
        return;
      }

      let body = req.body;

      let sql = `
            INSERT INTO semester_group
            (name, dept, start_date, end_date)
            VALUES (?,?,?,?);
        `;

      let params = [body.name, body.dept, body.start_date, body.end_date];

      db.query(sql, params)
        .then(() => {
          return res.status(200).send();
        })
        .catch((err) => {
          return res.status(500).send(err);
        });
    }
  );

  db_router.get("/getParentActions", [UserAuth.isSignedIn], (req, res) => {
    let query = `
            SELECT *
            FROM actions
            WHERE actions.parent_id = 0
            ORDER BY action_id desc
        `;
    db.query(query)
      .then((values) => {
        res.send(values);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  db_router.get("/getSubActions", [UserAuth.isSignedIn], (req, res) => {
    let query = `
            SELECT *
            FROM actions
            WHERE actions.parent_id = ${req.query.action_id}
            ORDER BY action_id desc
        `;
    db.query(query)
      .then((values) => {
        res.send(values);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  function calculateActiveTimelines(user) {
    let projectFilter;
    switch (user.type) {
      case USERTYPES.ADMIN:
        projectFilter = "";
        break;
      case USERTYPES.STUDENT:
        projectFilter = `WHERE projects.status = 'in progress' AND projects.project_id IN (SELECT project FROM users WHERE users.system_id = "${user.system_id}")`;
        break;
      case USERTYPES.COACH:
        projectFilter = `WHERE projects.status = 'in progress' AND projects.project_id IN (SELECT project_id FROM project_coaches WHERE coach_id = "${user.system_id}")`;
        break;
      default:
        throw new Error("Unhandled user role");
    }

    return new Promise((resolve, reject) => {
      // WARN: If any field in an action is null, group_concat will remove that entire action...
      let getTeams = `
                SELECT  projects.display_name,
                        projects.title,
                        projects.project_id,
                        semester_group.name AS 'semester_name',
                        semester_group.semester_id AS 'semester_id',
                        semester_group.start_date AS 'start_date',
                        semester_group.end_date AS 'end_date',
                        (
                            SELECT group_concat(fname || ' ' || lname || ' (' || email || ')')
                            FROM users
                            WHERE projects.project_id = users.project
                        ) team_members,
                        (
                            SELECT group_concat(fname || ' ' || lname || ' (' || email || ')')
                            FROM project_coaches
                            LEFT JOIN users ON project_coaches.coach_id = users.system_id
                            WHERE projects.project_id = project_coaches.project_id
                        ) coach
                FROM projects
                LEFT JOIN semester_group
                    ON projects.semester = semester_group.semester_id
                    ${projectFilter}
                ORDER BY projects.semester DESC
            `;
      db.query(getTeams)
        .then((values) => {
          resolve(values);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  db_router.post(
    "/createProject",
    [
        UserAuth.isAdmin,
        body("title")
            .not()
            .isEmpty()
            .trim()
            .escape()
            .withMessage("Cannot be empty")
            .isLength({ max: 50 }),
        body("description")
            .not()
            .isEmpty()
            .trim()
            .escape()
            .withMessage("Cannot be empty"),
        body("semester")
            .not()
            .isEmpty()
            .trim()
            .escape()
            .withMessage("Cannot be empty"),
    ],
    async (req, res) => {
        console.log("Creating new project with data:", req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error("Validation errors:", errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { title, description, semester, template_project } = req.body;
            
            const sql = `
                INSERT INTO projects (
                    status,
                    title,
                    description,
                    semester
                ) VALUES (?, ?, ?, ?)
            `;

            const params = [
                "in progress",
                title,
                description,
                semester
            ];

            console.log("Executing SQL:", sql);
            console.log("With params:", params);

            const result = await db.query(sql, params);
            console.log("Project created successfully with ID:", result.insertId);

            // Get the newly created project
            const getProjectSql = `SELECT project_id FROM projects WHERE title = ? AND semester = ? ORDER BY project_id DESC LIMIT 1`;
            const [newProject] = await db.query(getProjectSql, [title, semester]);

            if (!newProject) {
                throw new Error('Failed to retrieve newly created project');
            }

            // If a template project was specified, copy its actions
            if (template_project) {
                try {
                    // Get actions from template project
                    const getActionsQuery = `
                        SELECT *
                        FROM actions
                        WHERE project = ?
                    `;
                    const templateActions = await db.query(getActionsQuery, [template_project]);

                    if (templateActions && templateActions.length > 0) {
                        // Get the target semester's start date to adjust action dates
                        const getSemesterQuery = `
                            SELECT start_date
                            FROM semester_group
                            WHERE semester_id = ?
                        `;
                        const [targetSemesterData] = await db.query(getSemesterQuery, [semester]);
                        
                        if (!targetSemesterData) {
                            throw new Error('Target semester not found');
                        }

                        const targetStartDate = moment(targetSemesterData.start_date);
                        const sourceStartDate = moment(templateActions[0].start_date);
                        const dateOffset = targetStartDate.diff(sourceStartDate, 'days');

                        // Copy each action with adjusted dates
                        for (const action of templateActions) {
                            const adjustedStartDate = moment(action.start_date).add(dateOffset, 'days').format(CONSTANTS.datetime_format);
                            const adjustedDueDate = moment(action.due_date).add(dateOffset, 'days').format(CONSTANTS.datetime_format);
                            const date_deleted = action.date_deleted === "false" ? moment().format(CONSTANTS.datetime_format) : "";
                            const parsedFileSize = action.file_size ? fileSizeParser(action.file_size) : null;

                            const insertActionQuery = `
                                INSERT into actions
                                (semester, project, action_title, action_target, date_deleted, short_desc, start_date, due_date, page_html, file_types, file_size)
                                values (?,?,?,?,?,?,?,?,?,?,?)
                            `;

                            const actionParams = [
                                semester,
                                newProject.project_id,
                                action.action_title,
                                action.action_target,
                                date_deleted,
                                action.short_desc,
                                adjustedStartDate,
                                adjustedDueDate,
                                action.page_html,
                                action.file_types,
                                parsedFileSize,
                            ];

                            await db.query(insertActionQuery, actionParams);
                        }
                    }
                } catch (err) {
                    console.error("Error copying actions from template project:", err);
                }
            }

            return res.status(200).json({
                message: "Project created successfully",
                project_id: newProject.project_id
            });
        } catch (err) {
            console.error("Error creating project:", err);
            return res.status(500).json({ error: err.message });
        }
    }
);

  return db_router;
};
