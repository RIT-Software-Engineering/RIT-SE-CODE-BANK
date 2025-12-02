// This package is deprecated and intentionally non-functional.
// Use direct calls to the notification-service via apps/ta-portal/server/server/utils/notifications.js.
function _dead() {
  throw new Error('notification-client has been removed. Use server/utils/notifications instead.');
}
module.exports = {
  getPreferences: _dead,
  setPreferences: _dead,
  dispatchNotification: _dead,
  dispatchTemplated: _dead,
};

