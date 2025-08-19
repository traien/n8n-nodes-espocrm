import { INodeProperties } from 'n8n-workflow';

export const attachmentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['attachment'] } },
    options: [
      { name: 'Upload', value: 'upload', description: 'Upload an attachment', action: 'Upload attachment' },
      { name: 'Get', value: 'get', description: 'Get attachment metadata', action: 'Get attachment' },
      { name: 'Delete', value: 'delete', description: 'Delete an attachment', action: 'Delete attachment' },
    ],
    default: 'upload',
  },
];

export const attachmentFields: INodeProperties[] = [
  // Upload
  {
    displayName: 'Binary Property',
    name: 'binaryPropertyName',
    type: 'string',
    default: 'data',
    description: 'Name of the binary property to upload',
    displayOptions: { show: { resource: ['attachment'], operation: ['upload'] } },
    required: true,
  },
  {
    displayName: 'Role',
    name: 'role',
    type: 'options',
    options: [
      { name: 'Attachment', value: 'Attachment' },
      { name: 'Inline Attachment', value: 'Inline Attachment' },
      { name: 'Import File', value: 'Import File' },
      { name: 'Export File', value: 'Export File' },
      { name: 'Mail Merge', value: 'Mail Merge' },
      { name: 'Mass Pdf', value: 'Mass Pdf' },
    ],
    default: 'Attachment',
    description: 'Attachment role; must be Attachment',
    displayOptions: { show: { resource: ['attachment'], operation: ['upload'] } },
  },
  {
    displayName: 'Related Type',
    name: 'relatedType',
    type: 'string',
    default: 'Document',
    description: 'Entity type the attachment relates to (e.g., Document, Note, etc.)',
    displayOptions: { show: { resource: ['attachment'], operation: ['upload'] } },
  },
  {
    displayName: 'Field',
    name: 'field',
    type: 'string',
    default: 'file',
    description: 'Field name on the related record',
    displayOptions: { show: { resource: ['attachment'], operation: ['upload'] } },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    default: {},
    placeholder: 'Add Field',
    displayOptions: { show: { resource: ['attachment'], operation: ['upload'] } },
    options: [
      { displayName: 'Parent Type', name: 'parentType', type: 'string', default: '' },
      { displayName: 'Related ID', name: 'relatedId', type: 'string', default: '' },
      { displayName: 'Parent ID', name: 'parentId', type: 'string', default: '' },
      { displayName: 'File Name', name: 'name', type: 'string', default: '' },
      { displayName: 'MIME Type', name: 'type', type: 'string', default: '' },
    ],
  },

  // Common ID field for get/delete
  {
    displayName: 'Attachment ID',
    name: 'attachmentId',
    type: 'string',
    default: '',
    required: true,
    description: 'ID of attachment',
    displayOptions: { show: { resource: ['attachment'], operation: ['get', 'delete'] } },
  },
];
