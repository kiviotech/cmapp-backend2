'use strict';

/**
 * escrow controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::escrow.escrow');
