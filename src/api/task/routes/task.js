'use strict';

/**
 * task router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  type: 'content-api',
  routes: [
    // Core routes
    {
      method: 'GET',
      path: '/tasks',
      handler: 'task.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/tasks/:id',
      handler: 'task.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/tasks',
      handler: 'task.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/tasks/:id',
      handler: 'task.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/tasks/:id',
      handler: 'task.delete',
      config: {
        auth: false,
      },
    },
    // Custom routes
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
