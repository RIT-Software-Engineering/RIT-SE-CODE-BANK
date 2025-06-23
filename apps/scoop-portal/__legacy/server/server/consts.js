/**
 * Constants used throughout the server
 */
module.exports = {
    datetime_format: "YYYY-MM-DD HH:mm:ss",
    USERTYPES: {
        ADMIN: "admin",
        STUDENT: "student",
        COACH: "coach",
        COORDINATOR: "coordinator"
    },
    PROJECT_STATUS: {
        ACTIVE: "active",
        IN_PROGRESS: "in_progress",
        COMPLETED: "completed",
        ARCHIVED: "archived"
    },
    SAML_ATTRIBUTES: {
        uid: 'urn:oid:0.9.2342.19200300.100.1.1',
        mail: 'urn:oid:0.9.2342.19200300.100.1.3',
        ritEduAffiliation: 'urn:oid:1.3.6.1.4.1.4447.1.41',
    },
    SIGN_IN_SELECT_ATTRIBUTES: "*",
}
