'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/projects/:id/documents',
      handler: 'project.uploadProjectDocuments',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      },
    },
    {
      method: 'POST',
      path: '/projects/:id/process-drive-folder',
      handler: 'project.processGoogleDriveFolder',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      },
    }
  ],
}; 