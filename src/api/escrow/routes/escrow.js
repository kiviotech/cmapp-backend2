'use strict';

/**
 * escrow router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::escrow.escrow');
