import { INodeProperties } from 'n8n-workflow';
import { operations } from '../../types';

export const caseOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['case'],
			},
		},
		options: operations,
		default: 'create',
	},
];

export const caseFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                  case:create                               */
	/* -------------------------------------------------------------------------- */
	{ displayName: 'Name', name: 'name', type: 'string', default: '', displayOptions: { show: { resource: ['case'], operation: ['create'] } }, required: true, description: 'Name of the case' },
	{ displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['case'], operation: ['create'] } }, options: [
		{ displayName: 'Status', name: 'status', type: 'options', options: [ { name: 'New', value: 'New' }, { name: 'Assigned', value: 'Assigned' }, { name: 'Pending', value: 'Pending' }, { name: 'Closed', value: 'Closed' }, { name: 'Rejected', value: 'Rejected' }, { name: 'Duplicate', value: 'Duplicate' } ], default: 'New' },
		{ displayName: 'Priority', name: 'priority', type: 'options', options: [ { name: 'Low', value: 'Low' }, { name: 'Normal', value: 'Normal' }, { name: 'High', value: 'High' }, { name: 'Urgent', value: 'Urgent' } ], default: 'Normal' },
		{ displayName: 'Type', name: 'type', type: 'options', options: [ { name: '—', value: '' }, { name: 'Question', value: 'Question' }, { name: 'Incident', value: 'Incident' }, { name: 'Problem', value: 'Problem' } ], default: '' },
		{ displayName: 'Account ID', name: 'accountId', type: 'string', default: '' },
		{ displayName: 'Lead ID', name: 'leadId', type: 'string', default: '' },
		{ displayName: 'Contact ID', name: 'contactId', type: 'string', default: '' },
		{ displayName: 'Description', name: 'description', type: 'string', typeOptions: { rows: 4 }, default: '' },
		{ displayName: 'Assigned User ID', name: 'assignedUserId', type: 'string', default: '' },
	] },

	/* -------------------------------------------------------------------------- */
	/*                                   case:get                                 */
	/* -------------------------------------------------------------------------- */
	{ displayName: 'Case ID', name: 'caseId', type: 'string', required: true, default: '', displayOptions: { show: { resource: ['case'], operation: ['get', 'update', 'delete'] } }, description: 'ID of the case' },

	/* -------------------------------------------------------------------------- */
	/*                                  case:update                               */
	/* -------------------------------------------------------------------------- */
	{ displayName: 'Update Fields', name: 'updateFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['case'], operation: ['update'] } }, options: [
		{ displayName: 'Name', name: 'name', type: 'string', default: '' },
		{ displayName: 'Status', name: 'status', type: 'options', options: [ { name: 'New', value: 'New' }, { name: 'Assigned', value: 'Assigned' }, { name: 'Pending', value: 'Pending' }, { name: 'Closed', value: 'Closed' }, { name: 'Rejected', value: 'Rejected' }, { name: 'Duplicate', value: 'Duplicate' } ], default: 'New' },
		{ displayName: 'Priority', name: 'priority', type: 'options', options: [ { name: 'Low', value: 'Low' }, { name: 'Normal', value: 'Normal' }, { name: 'High', value: 'High' }, { name: 'Urgent', value: 'Urgent' } ], default: 'Normal' },
		{ displayName: 'Type', name: 'type', type: 'options', options: [ { name: '—', value: '' }, { name: 'Question', value: 'Question' }, { name: 'Incident', value: 'Incident' }, { name: 'Problem', value: 'Problem' } ], default: '' },
		{ displayName: 'Account ID', name: 'accountId', type: 'string', default: '' },
		{ displayName: 'Lead ID', name: 'leadId', type: 'string', default: '' },
		{ displayName: 'Contact ID', name: 'contactId', type: 'string', default: '' },
		{ displayName: 'Description', name: 'description', type: 'string', typeOptions: { rows: 4 }, default: '' },
		{ displayName: 'Assigned User ID', name: 'assignedUserId', type: 'string', default: '' },
	] },

	/* -------------------------------------------------------------------------- */
	/*                                  case:getAll                               */
	/* -------------------------------------------------------------------------- */
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['case'], operation: ['getAll'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['case'], operation: ['getAll'], returnAll: [false] } }, typeOptions: { minValue: 1 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Filter Options', name: 'filterOptions', type: 'collection', placeholder: 'Add Filter Option', default: {}, displayOptions: { show: { resource: ['case'], operation: ['getAll'] } }, options: [
		{ displayName: 'Where (Filter Conditions)', name: 'where', type: 'json', default: '[]', typeOptions: { alwaysParseJson: true }, description: 'Filter conditions for the query as defined in the EspoCRM API' },
		{ displayName: 'Order By', name: 'orderBy', type: 'string', default: '', placeholder: 'createdAt', description: 'Field to sort results by' },
		{ displayName: 'Order Direction', name: 'order', type: 'options', options: [ { name: 'Ascending', value: 'asc' }, { name: 'Descending', value: 'desc' } ], default: 'desc', description: 'Direction to sort results by' },
		{ displayName: 'Select Fields', name: 'select', type: 'string', default: '', placeholder: 'id,name,status', description: 'Comma-separated list of fields to return' },
		{ displayName: 'Offset', name: 'offset', type: 'number', default: 0, description: 'Number of results to skip (for pagination)' },
		{ displayName: 'Skip Total Count', name: 'skipTotalCount', type: 'boolean', default: false, description: 'Skip calculating total count for large datasets to improve performance' },
		{ displayName: 'Boolean Filter List', name: 'boolFilterList', type: 'string', default: '', placeholder: 'onlyMy,followed', description: 'Comma-separated list of predefined boolean filters' },
		{ displayName: 'Primary Filter', name: 'primaryFilter', type: 'string', default: '', description: 'Context-specific base filter to apply' },
	] },
];
