'use strict';

/**
 * access-control router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::access-control.access-control');
