'use strict';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    try {
      console.log('[Project Middleware] Checking project ownership');
      const { id } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      // Get the project
      const project = await strapi.entityService.findOne('api::project.project', id, {
        populate: ['project_team']
      });

      if (!project) {
        return ctx.notFound('Project not found');
      }

      // Check if user is part of project team
      const isTeamMember = project.project_team?.some(member => member.id === user.id);
      
      if (!isTeamMember) {
        return ctx.forbidden('You are not authorized to perform this action');
      }

      await next();
    } catch (error) {
      console.error('[Project Middleware] Error checking ownership:', error);
      ctx.throw(500, 'Internal server error');
    }
  };
}; 