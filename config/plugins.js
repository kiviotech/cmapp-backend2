module.exports = () => ({
  upload: {
    config: {
      sizeLimit: 2500 * 1024 * 1024 // 256mb in bytes
    }
  },
  bootstrap({ strapi }) {
    // Set the requestTimeout to 1,800,000 milliseconds (30 minutes):
    strapi.server.httpServer.requestTimeout = 30 * 60 * 1000;
  },
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
    },
  },
  // email: {
  //   provider: 'sendgrid', // Replace with the provider you are using (e.g., 'smtp', 'mailgun', etc.)
  //   providerOptions: {
  //     apiKey: 'your-sendgrid-api-key', // Replace with your SendGrid API key (or SMTP/mailgun config)
  //   },
  //   settings: {
  //     defaultFrom: 'your-email@example.com', // Replace with your "from" email address
  //     defaultReplyTo: 'your-email@example.com', // Replace with your "reply to" email address
  //   },
  // },
});
