module.exports = ({ env }) => ({
  email: {
    config: {
      provider: "@strapi/provider-email-nodemailer",
      providerOptions: {
        host: env("SMTP_HOST"),
        port: env("SMTP_PORT"),
        secure: true,
        auth: {
          user: env("SMTP_USERNAME"),
          pass: env("SMTP_PASSWORD"),
        },
      },
      settings: {
        defaultFrom: env("SMTP_FROM"),
        defaultReplyTo: env("SMTP_REPLY_TO"),
      },
    },
  },
  upload: {
    config: {
      sizeLimit: 256 * 1024 * 1024, // 256 MB in bytes
    },
  },
  "users-permissions": {
    config: {
      jwt: {
        expiresIn: "7d", // Set token expiration to 1 minute for testing
      },
    },
  },
});

// Set the server request timeout
module.exports.bootstrap = ({ strapi }) => {
  strapi.server.httpServer.requestTimeout = 30 * 60 * 1000; // 30 minutes
};