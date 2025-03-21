'use strict';

/**
 * Custom project controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { extractDocumentCodes } = require('../../../utils/ocr');
const { downloadFile, listFolderContents, extractFileId } = require('../../../utils/googleDrive');
const fs = require('fs').promises;

module.exports = createCoreController('api::project.project', ({ strapi }) => ({
  async create(ctx) {
    try {
      console.log('[Project Controller] Starting project creation process');
      console.log('[Project Controller] Request body:', JSON.stringify(ctx.request.body, null, 2));

      // Create the project first
      const project = await strapi.entityService.create('api::project.project', {
        data: {
          ...ctx.request.body.data,
          publishedAt: new Date(),
        },
      });
      
      console.log('[Project Controller] Project created successfully:', JSON.stringify(project, null, 2));

      // Start task creation in background
      console.log('[Project Controller] Starting background task creation');
      this.createProjectTasks(project.id, ctx.request.body.data.approvers)
        .catch(error => {
          console.error('[Project Controller] Background task creation failed:', error);
          // Log to monitoring service if available
          strapi.log.error({
            message: 'Background task creation failed',
            error,
            projectId: project.id
          });
        });

      return {
        data: project,
        meta: {
          message: "Project created successfully. Tasks are being generated in the background."
        }
      };
    } catch (error) {
      console.error('[Project Controller] Project creation failed:', error);
      ctx.throw(500, error);
    }
  },

  async createProjectTasks(projectId, approvers) {
    try {
      console.log('[Project Controller] Starting task creation for project:', projectId);
      console.log('[Project Controller] Approvers:', approvers);

      // Fetch all standard tasks with sub_contractor relation
      const standardTasks = await strapi.entityService.findMany('api::standard-task.standard-task', {
        populate: ['project_team', 'sub_contractor'],
      });
      
      console.log(`[Project Controller] Found ${standardTasks.length} standard tasks to process`);
      console.log('[Project Controller] Standard tasks with relations:', JSON.stringify(standardTasks, null, 2));

      // Create tasks in batches
      const batchSize = 50;
      let tasksCreated = 0;
      let createdTaskIds = [];
      
      for (let i = 0; i < standardTasks.length; i += batchSize) {
        console.log(`[Project Controller] Processing batch ${Math.floor(i/batchSize) + 1}`);
        const batch = standardTasks.slice(i, i + batchSize);
        
        const taskPromises = batch.map(standardTask => {
          console.log(`[Project Controller] Creating task from standard task:`, {
            standardTaskId: standardTask.id,
            name: standardTask.Name,
            subContractor: standardTask.sub_contractor?.id
          });

          return strapi.entityService.create('api::task.task', {
            data: {
              project: projectId,
              standard_task: standardTask.id,
              task_status: 'pending',
              due_date: null,
              approver: approvers,
              sub_contractor: standardTask.sub_contractor?.id || null,
              publishedAt: new Date(),
            },
          });
        });

        const createdTasks = await Promise.all(taskPromises);
        tasksCreated += createdTasks.length;
        createdTaskIds = [...createdTaskIds, ...createdTasks.map(task => task.id)];
        console.log(`[Project Controller] Created ${createdTasks.length} tasks in current batch`);
        console.log('[Project Controller] Last created task:', JSON.stringify(createdTasks[createdTasks.length - 1], null, 2));
      }

      console.log(`[Project Controller] Total tasks created: ${tasksCreated}`);

      // Update project status with proper data structure
      await strapi.entityService.update('api::project.project', projectId, {
        data: { 
          project_status: 'ongoing',
          tasks: {
            connect: createdTaskIds
          }
        }
      });
      
      console.log('[Project Controller] Project status updated to ongoing');

    } catch (error) {
      console.error('[Project Controller] Task creation failed:', {
        error,
        projectId,
        errorStack: error.stack
      });
      throw error;
    }
  },

  async uploadProjectDocuments(ctx) {
    try {
      const { id } = ctx.params;
      const { files } = ctx.request.files;

      // Verify project exists
      const project = await strapi.entityService.findOne('api::project.project', id);
      if (!project) {
        return ctx.badRequest('Project does not exist');
      }

      // Process uploaded files
      const processedDocuments = [];
      if (files) {
        for (const file of files) {
          try {
            // Extract document codes using OCR
            const documentCodes = await extractDocumentCodes(file);
            console.log('[Project Controller] Extracted document codes:', documentCodes);
            
            // Upload file to Strapi media library
            const uploadedFile = await strapi.plugins.upload.services.upload.upload({
              data: {},
              files: file
            });

            const fileUrl = uploadedFile[0].url;
            
            // Create document entry with all codes
            processedDocuments.push({
              document: uploadedFile[0].id,
              document_codes: documentCodes,
              document_type: 'drawing',
              metadata: {
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                url: fileUrl
              }
            });

            // Update tasks with drawing codes and URLs
            await this.updateTasksWithDrawings(id, documentCodes, fileUrl);
          } catch (error) {
            console.error('[Project Controller] Failed to process file:', file.name, error);
            // Continue with next file instead of failing completely
          }
        }
      }

      // Update project with new documents
      const updatedProject = await strapi.entityService.update('api::project.project', id, {
        data: {
          project_documents: processedDocuments
        }
      });

      return {
        data: updatedProject,
        meta: {
          processed: processedDocuments.length
        }
      };
    } catch (error) {
      console.error('[Project Controller] Document upload failed:', error);
      return ctx.throw(500, 'Failed to process project documents');
    }
  },

  async updateTasksWithDrawings(projectId, documentCodes, fileUrl) {
    try {
      const tasks = await strapi.entityService.findMany('api::task.task', {
        filters: { project: projectId }
      });

      for (const task of tasks) {
        const matchingCodes = documentCodes.filter(dc => 
          dc.codes.includes(task.drawing_code)
        );

        if (matchingCodes.length > 0) {
          await strapi.entityService.update('api::task.task', task.id, {
            data: {
              drawing_url: fileUrl,
              drawing_codes: documentCodes
            }
          });
        }
      }
    } catch (error) {
      console.error('[Project Controller] Failed to update tasks with drawings:', error);
      throw error;
    }
  },

  async processGoogleDriveFolder(ctx) {
    try {
      const { id } = ctx.params;
      const { folderUrl } = ctx.request.body;

      // Verify project exists
      const project = await strapi.entityService.findOne('api::project.project', id);
      if (!project) {
        return ctx.badRequest('Project does not exist');
      }

      console.log('[Project Controller] Processing Google Drive folder:', folderUrl);
      
      // Get folder ID from URL
      const folderId = extractFileId(folderUrl);
      
      // List all PDF and image files in the folder
      const files = await listFolderContents(folderId);
      
      const processedDocuments = [];
      
      // Process each file
      for (const file of files) {
        try {
          console.log('[Project Controller] Processing file:', file.name);
          
          // Download file to temp location
          const tempPath = await downloadFile(file.id, file.mimeType);
          
          // Extract document codes using OCR
          const documentCodes = await extractDocumentCodes({
            name: file.name,
            type: file.mimeType,
            path: tempPath
          });
          
          console.log('[Project Controller] Extracted codes:', documentCodes);

          // Upload file to Strapi media library
          const uploadedFile = await strapi.plugins.upload.services.upload.upload({
            data: {},
            files: {
              path: tempPath,
              name: file.name,
              type: file.mimeType
            }
          });

          const fileUrl = uploadedFile[0].url;
          
          // Create document entry
          processedDocuments.push({
            document: uploadedFile[0].id,
            document_codes: documentCodes,
            document_type: 'drawing',
            metadata: {
              originalName: file.name,
              mimeType: file.mimeType,
              source: 'google_drive',
              driveFileId: file.id,
              url: fileUrl
            }
          });

          // Update tasks with drawing codes and URLs
          await this.updateTasksWithDrawings(id, documentCodes, fileUrl);
          
          // Cleanup temp file
          await fs.unlink(tempPath).catch(console.error);
          
        } catch (error) {
          console.error('[Project Controller] Failed to process file:', file.name, error);
          // Continue with next file
        }
      }

      // Update project with new documents
      const updatedProject = await strapi.entityService.update('api::project.project', id, {
        data: {
          project_documents: processedDocuments
        }
      });

      return {
        data: updatedProject,
        meta: {
          processed: processedDocuments.length,
          total: files.length
        }
      };

    } catch (error) {
      console.error('[Project Controller] Google Drive processing failed:', error);
      return ctx.throw(500, 'Failed to process Google Drive folder');
    }
  }
}));
