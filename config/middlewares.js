module.exports = [
  "strapi::errors",
  "strapi::security",
  "strapi::poweredBy", // here
  {
    name: "strapi::cors",
    // config: {
    //   enabled: false,
    //   origin: ["*"],
    //   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    //   headers: ["Content-Type", "Authorization", "Origin", "Accept"],
    //   keepHeaderOnError: true,
    // },
  },
  "strapi::logger",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
