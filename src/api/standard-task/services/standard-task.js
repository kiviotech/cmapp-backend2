'use strict';

/**
 * standard-task service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::standard-task.standard-task');
