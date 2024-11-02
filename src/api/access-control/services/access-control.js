'use strict';

/**
 * access-control service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::access-control.access-control');
