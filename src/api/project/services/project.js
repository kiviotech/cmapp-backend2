'use strict';

/**
 * project service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::project.project', ({ strapi }) => ({
  async assignProjectTeam(projectId, teamMembers) {
    console.log('[Project Service] Starting project team assignment', {
      projectId,
      teamMembersCount: teamMembers.length
    });

    try {
      const updates = teamMembers.map(async (member) => {
        console.log('[Project Service] Assigning team member:', {
          memberId: member.id,
          projectId
        });

        const result = await strapi.entityService.update('api::project-team.project-team', member.id, {
          data: {
            projects: {
              connect: [projectId]
            }
          }
        });

        console.log('[Project Service] Team member assigned successfully:', {
          memberId: member.id,
          result: result.id
        });

        return result;
      });

      const results = await Promise.all(updates);
      console.log('[Project Service] All team members assigned successfully', {
        projectId,
        assignedCount: results.length
      });

      return true;
    } catch (error) {
      console.error('[Project Service] Team assignment failed:', {
        error,
        projectId,
        errorStack: error.stack,
        teamMembers: teamMembers.map(m => m.id)
      });
      return false;
    }
  }
}));
