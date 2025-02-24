'use strict';

/**
 * directory service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::directory.directory');
