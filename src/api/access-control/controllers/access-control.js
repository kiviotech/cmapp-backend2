'use strict';

/**
 * access-control controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::access-control.access-control');
