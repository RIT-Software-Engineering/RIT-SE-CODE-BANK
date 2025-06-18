
async function getAccessLevels(userId, rubricId) {
  return await fetch("http://localhost:5000/access?userId=" + userId + "&rubricId=" + rubricId, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

const mockUser = (req, res, next) => {
  req.user = {
    system_id: req.cookies.system_id
  }

  next()
}

function authorizeAccessLevel(...allowedAccessLevels) {
  return async (req, res, next) => {
    const user = req.user; // Typically set by authentication middleware
    const rubricId = req.params.id;

    if (!user) {
      return res.status(403).json({ message: "Access Denied" });
    }
    const userAccessLevels = await getAccessLevels(user.system_id, rubricId);

    if (
      !userAccessLevels ||
      !userAccessLevels.some(userAccessLevel => allowedAccessLevels.includes(userAccessLevel.accessLevel))
    ) {
      return res.status(403).json({ message: "Access Denied" });
    }

    next();
  };
}

// const authorizeAccessLevel = async (req, res, next, ...allowedAccessLevels) => {
//   const userId = req.user.system_id; // Typically set by authentication middleware
//   const rubricId = req.params.id;

//   const userAccessLevels = await getAccessLevels(userId, rubricId);

//   if (!user || !userAccessLevels.some(accessLevel => allowedAccessLevels.includes(accessLevel))) {
//     return res.status(403).json({ message: "Access Denied" });
//   }

//   next();
// }

module.exports = {
  mockUser,
  authorizeAccessLevel
};
