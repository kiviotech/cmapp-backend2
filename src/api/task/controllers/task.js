'use strict';

/**
 * task controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::task.task', ({ strapi }) => ({
  // Get tasks by sub-contractor
  async getTasksBySubContractor(ctx) {
    try {
      console.log('[Task Controller] Received request for sub-contractor tasks');
      const { subContractorId } = ctx.params;
      
      if (!subContractorId) {
        return ctx.badRequest('subContractorId is required');
      }

      // First verify sub-contractor exists
      const subContractor = await strapi.entityService.findOne('api::sub-contractor.sub-contractor', subContractorId);
      if (!subContractor) {
        return ctx.badRequest('Sub-contractor does not exist');
      }

      const tasks = await strapi.entityService.findMany('api::task.task', {
        filters: {
          sub_contractor: subContractorId,
        },
        populate: ['project', 'standard_task', 'contractor', 'sub_contractor'],
      });

      if (!tasks || tasks.length === 0) {
        return {
          data: [],
          meta: { 
            count: 0,
            message: 'No tasks found for this sub-contractor'
          }
        };
      }

      // Transform data to include only essential fields
      const simplifiedTasks = tasks.map(task => ({
        id: task.id,
        taskName: task.standard_task?.Name || 'Unnamed Task',
        projectName: task.project?.name || 'Unassigned Project',
        status: task.task_status || 'pending',
        dueDate: task.due_date || null,
        contractorName: task.contractor?.username || 'Unassigned',
        subContractorName: task.sub_contractor?.name || 'Unknown'
      }));

      console.log(`[Task Controller] Returning ${simplifiedTasks.length} simplified tasks`);
      
      return {
        data: simplifiedTasks,
        meta: { 
          count: simplifiedTasks.length,
          subContractor: {
            id: subContractor.id,
            name: subContractor.name
          }
        }
      };
    } catch (error) {
      console.error('[Task Controller] Error in getTasksBySubContractor:', {
        error: error.message,
        stack: error.stack,
        params: ctx.params
      });
      return ctx.throw(500, 'Internal server error while fetching tasks');
    }
  },

  // Assign contractor to tasks
  async assignContractorToTasks(ctx) {
    try {
      console.log('[Task Controller] Received contractor assignment request');
      const { contractorId } = ctx.params;
      const { taskIds } = ctx.request.body;

      if (!contractorId || !taskIds) {
        return ctx.badRequest('contractorId and taskIds are required');
      }

      // First verify contractor exists
      const contractor = await strapi.entityService.findOne('api::contractor.contractor', contractorId);
      if (!contractor) {
        return ctx.badRequest('Contractor does not exist');
      }

      // Verify all tasks exist before updating
      const tasks = await Promise.all(
        taskIds.map(id => strapi.entityService.findOne('api::task.task', id))
      );

      if (tasks.some(task => !task)) {
        return ctx.badRequest('One or more tasks do not exist');
      }

      const results = await Promise.all(
        taskIds.map(async (taskId) => {
          try {
            return await strapi.entityService.update('api::task.task', taskId, {
              data: {
                contractor: contractorId,
                task_status: 'ongoing'
              },
            });
          } catch (err) {
            console.error(`[Task Controller] Error updating task ${taskId}:`, err);
            return {
              taskId,
              error: err.message || 'Update failed'
            };
          }
        })
      );

      const successfulUpdates = results.filter(r => !r.error);
      const failedUpdates = results.filter(r => r.error);

      return {
        data: {
          successful: successfulUpdates,
          failed: failedUpdates.map(f => ({
            taskId: f.taskId,
            reason: f.error
          }))
        },
        meta: {
          total: taskIds.length,
          updated: successfulUpdates.length,
          failed: failedUpdates.length
        }
      };
    } catch (error) {
      console.error('[Task Controller] Error in assignContractorToTasks:', error);
      return ctx.throw(500, 'Internal server error while assigning tasks');
    }
  },

  async checkContractorAssignment(ctx) {
    try {
      console.log('[Task Controller] Checking contractor assignment status');
      const { projectId, subContractorId } = ctx.params;

      if (!projectId || !subContractorId) {
        return ctx.badRequest('projectId and subContractorId are required');
      }

      // Verify project exists
      const project = await strapi.entityService.findOne('api::project.project', projectId);
      if (!project) {
        return ctx.badRequest('Project does not exist');
      }

      // Verify sub-contractor exists
      const subContractor = await strapi.entityService.findOne('api::sub-contractor.sub-contractor', subContractorId);
      if (!subContractor) {
        return ctx.badRequest('Sub-contractor does not exist');
      }

      // Get all tasks for this project and sub-contractor
      const tasks = await strapi.entityService.findMany('api::task.task', {
        filters: {
          project: projectId,
          sub_contractor: subContractorId,
        },
        populate: ['contractor', 'standard_task', 'project'],
      });

      if (!tasks || tasks.length === 0) {
        return {
          data: {
            status: 'no_tasks',
            message: 'No tasks found for this project and sub-contractor',
            unassignedTasks: []
          },
          meta: {
            projectId,
            subContractorId
          }
        };
      }

      const totalTasks = tasks.length;
      const unassignedTasks = tasks.filter(task => !task.contractor).map(task => ({
        id: task.id,
        taskName: task.standard_task?.Name || 'Unnamed Task',
        projectName: task.project?.name || 'Unknown Project',
        status: task.task_status || 'pending',
        dueDate: task.due_date || null
      }));
      const assignedTasks = tasks.length - unassignedTasks.length;

      const assignmentStatus = assignedTasks === totalTasks ? 'fully_assigned' : 
                             assignedTasks === 0 ? 'not_assigned' : 'partially_assigned';

      return {
        data: {
          status: assignmentStatus,
          message: getStatusMessage(assignmentStatus),
          taskStats: {
            total: totalTasks,
            assigned: assignedTasks,
            unassigned: unassignedTasks.length
          },
          unassignedTasks: unassignedTasks
        },
        meta: {
          projectId,
          subContractorId,
          projectName: project.name,
          subContractorName: subContractor.name
        }
      };
    } catch (error) {
      console.error('[Task Controller] Error in checkContractorAssignment:', {
        error: error.message,
        stack: error.stack,
        params: ctx.params
      });
      return ctx.throw(500, 'Internal server error while checking assignment status');
    }
  },

  async getTasksByUserId(ctx) {
    try {
      const { userId } = ctx.params;
      
      if (!userId) {
        return ctx.badRequest('userId is required');
      }

      // First get the user and populate their relationships
      const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
        populate: ['contractor', 'tasks']
      });

      if (!user) {
        return ctx.badRequest('User does not exist');
      }

      let tasks = [];
      
      // Check if user is a contractor
      if (user.contractor) {
        tasks = await strapi.entityService.findMany('api::task.task', {
          filters: {
            contractor: user.contractor.id
          },
          populate: ['project', 'standard_task', 'contractor', 'sub_contractor', 'documents']
        });
      } else {
        // User is a project team member
        tasks = await strapi.entityService.findMany('api::task.task', {
          filters: {
            project_team_member: userId
          },
          populate: ['project', 'standard_task', 'contractor', 'sub_contractor', 'documents']
        });
      }

      // Transform tasks data
      const formattedTasks = tasks.map(task => ({
        id: task.id,
        taskName: task.standard_task?.Name || 'Unnamed Task',
        projectName: task.project?.name || 'Unassigned Project',
        status: task.task_status || 'pending',
        dueDate: task.due_date || null,
        contractorName: task.contractor?.username || 'Unassigned',
        subContractorName: task.sub_contractor?.name || 'Unknown',
        documents: task.documents?.map(doc => ({
          id: doc.id,
          url: doc.url,
          name: doc.name
        })) || []
      }));

      return {
        data: formattedTasks,
        meta: {
          total: formattedTasks.length,
          userType: user.contractor ? 'contractor' : 'project_team_member'
        }
      };

    } catch (error) {
      console.error('[Task Controller] Error in getTasksByUserId:', {
        error: error.message,
        stack: error.stack,
        params: ctx.params
      });
      return ctx.throw(500, 'Internal server error while fetching tasks');
    }
  },

  async assignTasksByContractor(ctx) {
    const logContext = {
      api: 'assignTasksByContractor',
      timestamp: new Date().toISOString()
    };

    try {
      const { contractorId, subContractorId, projectId } = ctx.params;

      console.log('[Task Controller] Starting bulk task assignment:', {
        ...logContext,
        contractorId,
        subContractorId,
        projectId
      });

      if (!contractorId || !subContractorId || !projectId) {
        console.warn('[Task Controller] Missing required parameters:', {
          ...logContext,
          contractorId: !!contractorId,
          subContractorId: !!subContractorId,
          projectId: !!projectId
        });
        return ctx.badRequest('contractorId, subContractorId and projectId are required');
      }

      // Verify contractor exists
      const contractor = await strapi.entityService.findOne('api::contractor.contractor', contractorId, {
        populate: ['user']
      });
      
      if (!contractor) {
        console.warn('[Task Controller] Contractor not found:', { ...logContext, contractorId });
        return ctx.badRequest('Contractor does not exist');
      }

      // Verify sub-contractor exists
      const subContractor = await strapi.entityService.findOne('api::sub-contractor.sub-contractor', subContractorId);
      if (!subContractor) {
        console.warn('[Task Controller] Sub-contractor not found:', { ...logContext, subContractorId });
        return ctx.badRequest('Sub-contractor does not exist');
      }

      // Get all tasks for this project and sub-contractor
      console.log('[Task Controller] Fetching tasks for project and sub-contractor:', {
        ...logContext,
        projectId,
        subContractorId
      });

      const tasks = await strapi.entityService.findMany('api::task.task', {
        filters: {
          project: projectId,
          sub_contractor: subContractorId,
        },
        populate: ['project', 'standard_task']
      });

      if (!tasks || tasks.length === 0) {
        console.warn('[Task Controller] No tasks found:', { ...logContext });
        return {
          data: {
            message: 'No tasks found for this project and sub-contractor combination'
          },
          meta: {
            projectId,
            subContractorId,
            contractorId
          }
        };
      }

      console.log('[Task Controller] Found tasks to update:', {
        ...logContext,
        taskCount: tasks.length,
        taskIds: tasks.map(t => t.id)
      });

      // Update all tasks with the contractor
      const results = await Promise.all(
        tasks.map(async (task) => {
          try {
            console.log('[Task Controller] Updating task:', {
              ...logContext,
              taskId: task.id,
              updateData: {
                contractor: contractorId,
                task_status: 'ongoing',
                assigned_date: new Date()
              }
            });

            const updatedTask = await strapi.entityService.update('api::task.task', task.id, {
              data: {
                contractor: contractorId,
                task_status: 'ongoing',
                assigned_date: new Date()
              },
            });

            console.log('[Task Controller] Task update successful:', {
              ...logContext,
              taskId: task.id,
              newStatus: updatedTask.task_status
            });

            return updatedTask;
          } catch (err) {
            console.error('[Task Controller] Task update failed:', {
              ...logContext,
              taskId: task.id,
              error: err.message,
              stack: err.stack
            });
            return {
              taskId: task.id,
              error: err.message || 'Update failed'
            };
          }
        })
      );

      const successfulUpdates = results.filter(r => !r.error);
      const failedUpdates = results.filter(r => r.error);

      const response = {
        data: {
          successful: successfulUpdates.map(task => ({
            id: task.id,
            taskName: task.standard_task?.Name || 'Unnamed Task',
            status: task.task_status
          })),
          failed: failedUpdates.map(f => ({
            taskId: f.taskId,
            reason: f.error
          }))
        },
        meta: {
          total: tasks.length,
          updated: successfulUpdates.length,
          failed: failedUpdates.length,
          contractor: {
            id: contractor.id,
            name: contractor.user?.username || 'Unknown'
          },
          subContractor: {
            id: subContractor.id,
            name: subContractor.name
          }
        }
      };

      console.log('[Task Controller] Assignment completed:', {
        ...logContext,
        response
      });

      return response;

    } catch (error) {
      console.error('[Task Controller] Fatal error:', {
        ...logContext,
        error: error.message,
        stack: error.stack,
        params: ctx.params
      });
      return ctx.throw(500, 'Internal server error while assigning tasks');
    }
  }
}));

function getStatusMessage(status) {
  const messages = {
    'fully_assigned': 'All tasks have been assigned to contractors',
    'not_assigned': 'No tasks have been assigned to contractors yet',
    'partially_assigned': 'Some tasks are still pending contractor assignment',
    'no_tasks': 'No tasks found for this project and sub-contractor'
  };
  return messages[status] || 'Unknown status';
}
