// db functions are passed in by the portal
async function recipientsFor(eventType, payload, db) {
  switch (eventType) {
    case 'APPLICATION_RECEIVED':
      return [
        ...(await db.getTAsForCourse(payload.courseId)).map(u => u.email),
        ...(await db.getInstructorsForCourse(payload.courseId)).map(u => u.email),
      ];
    case 'MOVED_TO_INTERVIEW':
      return [
        payload.applicantEmail,
        ...(await db.getInterviewers(payload.courseId)).map(u => u.email),
      ];
    default:
      return [];
  }
}
module.exports = { recipientsFor };
