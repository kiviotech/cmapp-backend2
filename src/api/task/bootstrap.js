'use strict';

module.exports = async ({ strapi }) => {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  const authenticatedRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });

  const taskActions = [
    'find',
    'findOne',
    'create',
    'update',
    'delete',
    'getTasksBySubContractor',
    'assignContractorToTasks',
    'checkContractorAssignment',
  ];

  const ensurePermissions = async (role) => {
    if (!role) return;

    for (const action of taskActions) {
      const actionName = `api::task.task.${action}`;
      const existing = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action: actionName, role: role.id } });

      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: {
            action: actionName,
            role: role.id,
            enabled: true,
          },
        });
      }
    }
  };

  await ensurePermissions(authenticatedRole);
  await ensurePermissions(publicRole);
}; 