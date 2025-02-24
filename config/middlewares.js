// config/middlewares.js
module.exports = ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: ['https://cmapp.kivio.in'], // Add your Angular app URLs here
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      keepHeaderOnError: true,
    },
  },
  {
    name: 'strapi::body',
    config: {
      formLimit: '2gb',  // Set form data size limit
      jsonLimit: '2gb',  // Set JSON payload size limit
      textLimit: '2gb',  // Set text payload size limit
      formidable: {
        maxFileSize: 2 * 1024 * 1024 * 1024 // Set max file size to 2GB
      }
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
