// Formats a user's display name based on the selected display format.
export function formatUser(user, format) {
  switch (format) {
    case "email":
      return user.email || user.username;
    case "firstName lastName":
      return user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username;
    case "lastName firstName":
      return user.firstName && user.lastName
        ? `${user.lastName}, ${user.firstName}`
        : user.username;
    default:
      return user.username;
  }
}
