// // config/middlewares.js
// module.exports = ({ env }) => [
//   'strapi::logger',
//   'strapi::errors',
//   'strapi::security',
//   {
//     name: 'strapi::cors',
//     config: {
//       origin: ['https://cmapp.kivio.in','http://localhost:8081'], // Add your Angular app URLs here
//       methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     },
//   },
//   {
//     name: 'strapi::body',
//     config: {
//       formLimit: '2gb',  // Set form data size limit
//       jsonLimit: '2gb',  // Set JSON payload size limit
//       textLimit: '2gb',  // Set text payload size limit
//       formidable: {
//         maxFileSize: 2 * 1024 * 1024 * 1024 // Set max file size to 2GB
//       }
//     },
//   },
//   'strapi::poweredBy',
//   'strapi::query',
//   'strapi::session',
//   'strapi::favicon',
//   'strapi::public',
// ];



module.exports = ({ env }) => [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  {
    name: "strapi::cors",
    config: {
      origin: ['https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--5173--5a421e5b.local-credentialless.webcontainer-api.io','https://cmapp.kivio.in',"http://cmappweb.kivio.in","http://localhost:5173", "http://localhost:5173"], // Add your Angular app URLs here
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      keepHeaderOnError: true,
    },
  },
  {
    name: "strapi::body",
    config: {
      formLimit: "2gb", // Set form data size limit
      jsonLimit: "2gb", // Set JSON payload size limit
      textLimit: "2gb", // Set text payload size limit
      formidable: {
        maxFileSize: 2 * 1024 * 1024 * 1024, // Set max file size to 2GB
      },
    },
  },
  "strapi::poweredBy",
  "strapi::query",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];



// module.exports = ({ env }) => [
//   "strapi::logger",
//   "strapi::errors",
//   "strapi::security",
//   {
//     name: "strapi::cors",
//     config: {
//       origin: ["http://localhost:5173", "http://localhost:5173"], // Add your Angular app URLs here
//       methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     },
//   },
//   {
//     name: "strapi::body",
//     config: {
//       formLimit: "2gb", // Set form data size limit
//       jsonLimit: "2gb", // Set JSON payload size limit
//       textLimit: "2gb", // Set text payload size limit
//       formidable: {
//         maxFileSize: 2 * 1024 * 1024 * 1024, // Set max file size to 2GB
//       },
//     },
//   },
//   "strapi::poweredBy",
//   "strapi::query",
//   "strapi::session",
//   "strapi::favicon",
//   "strapi::public",
// ];
