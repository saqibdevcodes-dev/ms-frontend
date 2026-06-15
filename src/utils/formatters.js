/**
 * Formats role permissions into a structured object
 * @param {Array} permissions - Raw permissions data from database
 * @returns {Object} - Formatted permissions object
 */
function formatRolePermissions(permissions) {
  if (!permissions || !Array.isArray(permissions)) {
    return {};
  }

  // Create a structured object of permissions
  const formattedPermissions = {};

  permissions.forEach((permission) => {
    if (!formattedPermissions[permission.module]) {
      formattedPermissions[permission.module] = {};
    }

    formattedPermissions[permission.module][permission.action] = true;
  });

  return formattedPermissions;
}

module.exports = {
  formatRolePermissions,
};
