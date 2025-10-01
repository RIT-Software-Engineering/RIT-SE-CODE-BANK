module.exports = {
  APPLICATION_RECEIVED: ({ applicantName, courseCode, courseName, instructorName }) =>
    `📥 Application received: *${applicantName}* for *${courseCode} – ${courseName}* (Instructor: ${instructorName}).`,

  MOVED_TO_INTERVIEW: ({ applicantName, courseCode, courseName, instructorName, when, comment }) =>
    `🗓️ *${applicantName}* moved to Interview for *${courseCode} – ${courseName}* (Instructor: ${instructorName})${when ? `\n📅 When: ${when}` : ''}${comment ? `\n💬 Comment: ${comment}` : ''}`,

  REJECTED: ({ applicantName, courseCode, courseName, instructorName, comment }) =>
    `❌ *${applicantName}*'s application for *${courseCode} – ${courseName}* (Instructor: ${instructorName}) was rejected.${comment ? `\n💬 Reason: ${comment}` : ''}`,

  ACCEPTED_OFFER: ({ applicantName, courseCode, courseName, instructorName, comment }) =>
    `✅ *${applicantName}* accepted an offer for *${courseCode} – ${courseName}* (Instructor: ${instructorName}).${comment ? `\n💬 Note: ${comment}` : ''}`,

  HIRED: ({ applicantName, courseCode, courseName, instructorName, comment }) =>
    `🎉 *${applicantName}* has been officially hired for *${courseCode} – ${courseName}* (Instructor: ${instructorName})!${comment ? `\n💬 Note: ${comment}` : ''}`,

  STATUS_CHANGED: ({ applicantName, courseCode, courseName, instructorName, status, comment }) =>
    `🔔 *${applicantName}*'s application for *${courseCode} – ${courseName}* (Instructor: ${instructorName}) is now *${status}*.${comment ? `\n💬 Comment: ${comment}` : ''}`,
};
