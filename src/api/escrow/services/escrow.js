'use strict';

/**
 * escrow service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::escrow.escrow');
