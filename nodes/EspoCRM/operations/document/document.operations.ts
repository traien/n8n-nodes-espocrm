import { INodeProperties } from 'n8n-workflow';
import { operations } from '../../types';

export const documentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['document'] } },
    options: operations,
    default: 'create',
  },
];

export const documentFields: INodeProperties[] = [
  // Create Document
  { displayName: 'Name', name: 'name', type: 'string', default: '', required: true, description: 'Document name', displayOptions: { show: { resource: ['document'], operation: ['create'] } } },
  { displayName: 'File ID', name: 'fileId', type: 'string', default: '', required: true, description: 'Attachment ID obtained from upload', displayOptions: { show: { resource: ['document'], operation: ['create'] } } },
  { displayName: 'Publish Date', name: 'publishDate', type: 'dateTime', default: '', description: 'Publish date (YYYY-MM-DD)', displayOptions: { show: { resource: ['document'], operation: ['create'] } } },
  { displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', default: {}, placeholder: 'Add Field', displayOptions: { show: { resource: ['document'], operation: ['create'] } }, options: [
    { displayName: 'Folder ID', name: 'folderId', type: 'string', default: '' },
    { displayName: 'Status', name: 'status', type: 'options', options: [ { name: 'Active', value: 'Active' }, { name: 'Draft', value: 'Draft' } ], default: 'Active' },
    { displayName: 'Description', name: 'description', type: 'string', typeOptions: { rows: 4 }, default: '' },
    { displayName: 'Assigned User ID', name: 'assignedUserId', type: 'string', default: '' },
    { displayName: 'File Name', name: 'fileName', type: 'string', default: '' },
  ] },

  // Standard get/update/delete/getAll
  { displayName: 'Document ID', name: 'documentId', type: 'string', default: '', required: true, displayOptions: { show: { resource: ['document'], operation: ['get', 'update', 'delete'] } }, description: 'ID of the document' },
  { displayName: 'Update Fields', name: 'updateFields', type: 'collection', default: {}, placeholder: 'Add Field', displayOptions: { show: { resource: ['document'], operation: ['update'] } }, options: [
    { displayName: 'Name', name: 'name', type: 'string', default: '' },
    { displayName: 'File ID', name: 'fileId', type: 'string', default: '' },
    { displayName: 'Publish Date', name: 'publishDate', type: 'dateTime', default: '' },
    { displayName: 'Folder ID', name: 'folderId', type: 'string', default: '' },
    { displayName: 'Status', name: 'status', type: 'options', options: [ { name: 'Active', value: 'Active' }, { name: 'Draft', value: 'Draft' } ], default: 'Active' },
    { displayName: 'Description', name: 'description', type: 'string', typeOptions: { rows: 4 }, default: '' },
    { displayName: 'Assigned User ID', name: 'assignedUserId', type: 'string', default: '' },
    { displayName: 'File Name', name: 'fileName', type: 'string', default: '' },
  ] },

  { displayName: 'Return All', name: 'returnAll', type: 'boolean', default: false, displayOptions: { show: { resource: ['document'], operation: ['getAll'] } }, description: 'Whether to return all results or only up to a given limit' },
  { displayName: 'Limit', name: 'limit', type: 'number', default: 50, typeOptions: { minValue: 1 }, displayOptions: { show: { resource: ['document'], operation: ['getAll'], returnAll: [false] } } },
  { displayName: 'Filter Options', name: 'filterOptions', type: 'collection', default: {}, placeholder: 'Add Filter Option', displayOptions: { show: { resource: ['document'], operation: ['getAll'] } }, options: [
    { displayName: 'Where (Filter Conditions)', name: 'where', type: 'json', default: '[]', typeOptions: { alwaysParseJson: true }, description: 'Filter conditions for the query as defined in the EspoCRM API' },
    { displayName: 'Order By', name: 'orderBy', type: 'string', default: '', placeholder: 'createdAt', description: 'Field to sort results by' },
    { displayName: 'Order Direction', name: 'order', type: 'options', options: [ { name: 'Ascending', value: 'asc' }, { name: 'Descending', value: 'desc' } ], default: 'desc', description: 'Direction to sort results by' },
    { displayName: 'Select Fields', name: 'select', type: 'string', default: '', placeholder: 'id,name,fileId', description: 'Comma-separated list of fields to return' },
    { displayName: 'Offset', name: 'offset', type: 'number', default: 0, description: 'Number of results to skip (for pagination)' },
    { displayName: 'Skip Total Count', name: 'skipTotalCount', type: 'boolean', default: false, description: 'Skip calculating total count for large datasets to improve performance' },
    { displayName: 'Boolean Filter List', name: 'boolFilterList', type: 'string', default: '', placeholder: 'onlyMy,followed', description: 'Comma-separated list of predefined boolean filters' },
    { displayName: 'Primary Filter', name: 'primaryFilter', type: 'string', default: '', description: 'Context-specific base filter to apply' },
  ] },
];
