module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1339),
  // url: 'https://cmapp.kivio.in/dash/',
  debug : true,
  app: {
    keys: env.array('APP_KEYS'),
  },
  logger: {
    level: 'debug',
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
