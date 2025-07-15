async function getAccessLevels(userId, actionId) {
  return await fetch(`http://localhost:3001/permissions?userId=${userId}&actionId=${actionId}`, {
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
    return []; 
  });
}

async function authorizeAccessLevel(userId, actionId, ...allowedAccessLevels) {
  try {
    const userPermissions = await getAccessLevels(userId, actionId);
    
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }

    // Extract permission types from the response
    const userPermissionTypes = userPermissions.map(permission => permission.permission_type);
    console.log(!allowedAccessLevels.some(allowedLevel => 
      userPermissionTypes.includes(allowedLevel)))
    console.log('User Permission Types:', userPermissionTypes);
    // Check if user has any of the allowed access levels
    return allowedAccessLevels.some(allowedLevel => 
      userPermissionTypes.includes(allowedLevel)
    );
  } catch (error) {
    console.error('Error in authorizeAccessLevel:', error);
    return false;
  }
};

module.exports = { authorizeAccessLevel };
