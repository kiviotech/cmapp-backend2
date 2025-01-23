module.exports = {
  routes: [
    // ... existing routes ...
    {
      method: 'GET',
      path: '/tasks/user/:userId',
      handler: 'task.getTasksByUserId',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      },
    },
    {
      method: 'POST',
      path: '/tasks/assign-tasks/:contractorId/:subContractorId/:projectId',
      handler: 'task.assignTasksByContractor',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      },
    }
  ]
}; 