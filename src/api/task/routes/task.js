'use strict';

/**
 * task router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Export custom routes directly
module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/tasks/sub-contractor/:subContractorId',
      handler: 'task.getTasksBySubContractor',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/tasks/assign-contractor/:contractorId',
      handler: 'task.assignContractorToTasks',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/tasks/check-contractor-assignment/:projectId/:subContractorId',
      handler: 'task.checkContractorAssignment',
      config: {
        auth: false,
      },
    },
  ],
};
