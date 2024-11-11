'use strict';

/**
 * standard-task router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::standard-task.standard-task');
