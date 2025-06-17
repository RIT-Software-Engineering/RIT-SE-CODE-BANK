/**
 * Responsible for maintaining variables and configurations for database management
 */

module.exports = {
    dbFileName: "scoop_portal.db",
    /**
     * @property An enumeration of the valid table names in the database
     * (  its an object so you can modify the actual table names without touching the code :P  )
     */
    tableNames: {
        projects: "projects",
        archive: "archive",
        semester: "semester_group",
        actions: "actions",
        action_logs: "action_log",
        time_logs: "time_log",
        users: "users",
        teams: "teams",
        student_mentorship: "student_mentorship",
    },
    project_proposal_keys: {
        "title": "Title",
        "description": "Description",
        "project_challenges": "Project Challenges",
        "constraints_assumptions": "Constraints and Assumptions",
    },
};
