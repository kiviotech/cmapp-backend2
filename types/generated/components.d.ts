import type { Schema, Attribute } from '@strapi/strapi';

export interface DocumentsProjectDocument extends Schema.Component {
  collectionName: 'components_documents_project_document';
  info: {
    displayName: 'Project Document';
    description: 'Stores project document information with metadata';
  };
  attributes: {
    document: Attribute.Media & Attribute.Required;
    document_code: Attribute.String & Attribute.Required;
    document_type: Attribute.Enumeration<
      ['drawing', 'specification', 'contract', 'other']
    >;
    google_drive_link: Attribute.String;
    metadata: Attribute.JSON;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'documents.project-document': DocumentsProjectDocument;
    }
  }
}
