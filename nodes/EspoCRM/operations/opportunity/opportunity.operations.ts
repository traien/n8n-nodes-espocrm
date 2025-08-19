import { INodeProperties } from 'n8n-workflow';
import { operations } from '../../types';

export const opportunityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['opportunity'],
			},
		},
		options: operations,
		default: 'create',
	},
];

export const opportunityFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                             opportunity:create                             */
	/* -------------------------------------------------------------------------- */
	{ displayName: 'Name', name: 'name', type: 'string', default: '', displayOptions: { show: { resource: ['opportunity'], operation: ['create'] } }, required: true, description: 'Name of the opportunity' },
	{ displayName: 'Amount', name: 'amount', type: 'number', default: 0, displayOptions: { show: { resource: ['opportunity'], operation: ['create'] } }, required: true, description: 'Amount value' },
	{ displayName: 'Close Date', name: 'closeDate', type: 'dateTime', default: '', displayOptions: { show: { resource: ['opportunity'], operation: ['create'] } }, required: true, description: 'Expected close date' },
	{
		displayName: 'Additional Fields', name: 'additionalFields', type: 'collection', placeholder: 'Add Field', default: {},
		displayOptions: { show: { resource: ['opportunity'], operation: ['create'] } },
		options: [
			{ displayName: 'Stage', name: 'stage', type: 'options', options: [
				{ name: 'Prospecting', value: 'Prospecting' },
				{ name: 'Qualification', value: 'Qualification' },
				{ name: 'Proposal', value: 'Proposal' },
				{ name: 'Negotiation', value: 'Negotiation' },
				{ name: 'Closed Won', value: 'Closed Won' },
				{ name: 'Closed Lost', value: 'Closed Lost' },
			], default: 'Prospecting' },
			{ displayName: 'Probability', name: 'probability', type: 'number', default: 10 },
			{ displayName: 'Lead Source', name: 'leadSource', type: 'string', default: '' },
			{ displayName: 'Account ID', name: 'accountId', type: 'string', default: '' },
			{ displayName: 'Contact ID', name: 'contactId', type: 'string', default: '' },
			{ displayName: 'Description', name: 'description', type: 'string', typeOptions: { rows: 4 }, default: '' },
			{ displayName: 'Assigned User ID', name: 'assignedUserId', type: 'string', default: '' },
			{ displayName: 'Campaign ID', name: 'campaignId', type: 'string', default: '' },
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                              opportunity:get                               */
	/* -------------------------------------------------------------------------- */
	{ displayName: 'Opportunity ID', name: 'opportunityId', type: 'string', required: true, default: '', displayOptions: { show: { resource: ['opportunity'], operation: ['get', 'update', 'delete'] } }, description: 'ID of the opportunity' },

	/* -------------------------------------------------------------------------- */
	/*                             opportunity:update                              */
	/* -------------------------------------------------------------------------- */
	{ displayName: 'Update Fields', name: 'updateFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['opportunity'], operation: ['update'] } }, options: [
		{ displayName: 'Name', name: 'name', type: 'string', default: '' },
		{ displayName: 'Amount', name: 'amount', type: 'number', default: 0 },
		{ displayName: 'Close Date', name: 'closeDate', type: 'dateTime', default: '' },
		{ displayName: 'Stage', name: 'stage', type: 'options', options: [ { name: 'Prospecting', value: 'Prospecting' }, { name: 'Qualification', value: 'Qualification' }, { name: 'Proposal', value: 'Proposal' }, { name: 'Negotiation', value: 'Negotiation' }, { name: 'Closed Won', value: 'Closed Won' }, { name: 'Closed Lost', value: 'Closed Lost' } ], default: 'Prospecting' },
		{ displayName: 'Probability', name: 'probability', type: 'number', default: 10 },
		{ displayName: 'Lead Source', name: 'leadSource', type: 'string', default: '' },
		{ displayName: 'Account ID', name: 'accountId', type: 'string', default: '' },
		{ displayName: 'Contact ID', name: 'contactId', type: 'string', default: '' },
		{ displayName: 'Description', name: 'description', type: 'string', typeOptions: { rows: 4 }, default: '' },
		{ displayName: 'Assigned User ID', name: 'assignedUserId', type: 'string', default: '' },
		{ displayName: 'Campaign ID', name: 'campaignId', type: 'string', default: '' },
	] },

	/* -------------------------------------------------------------------------- */
	/*                             opportunity:getAll                              */
	/* -------------------------------------------------------------------------- */
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', displayOptions: { show: { resource: ['opportunity'], operation: ['getAll'] } }, default: false, description: 'Whether to return all results or only up to a given limit' },
	{ displayName: 'Limit', name: 'limit', type: 'number', displayOptions: { show: { resource: ['opportunity'], operation: ['getAll'], returnAll: [false] } }, typeOptions: { minValue: 1 }, default: 50, description: 'Max number of results to return' },
	{ displayName: 'Filter Options', name: 'filterOptions', type: 'collection', placeholder: 'Add Filter Option', default: {}, displayOptions: { show: { resource: ['opportunity'], operation: ['getAll'] } }, options: [
		{ displayName: 'Where (Filter Conditions)', name: 'where', type: 'json', default: '[]', typeOptions: { alwaysParseJson: true }, description: 'Filter conditions for the query as defined in the EspoCRM API' },
		{ displayName: 'Order By', name: 'orderBy', type: 'string', default: '', placeholder: 'createdAt', description: 'Field to sort results by' },
		{ displayName: 'Order Direction', name: 'order', type: 'options', options: [ { name: 'Ascending', value: 'asc' }, { name: 'Descending', value: 'desc' } ], default: 'desc', description: 'Direction to sort results by' },
		{ displayName: 'Select Fields', name: 'select', type: 'string', default: '', placeholder: 'id,name,stage,amount', description: 'Comma-separated list of fields to return' },
		{ displayName: 'Offset', name: 'offset', type: 'number', default: 0, description: 'Number of results to skip (for pagination)' },
		{ displayName: 'Skip Total Count', name: 'skipTotalCount', type: 'boolean', default: false, description: 'Skip calculating total count for large datasets to improve performance' },
		{ displayName: 'Boolean Filter List', name: 'boolFilterList', type: 'string', default: '', placeholder: 'onlyMy,followed', description: 'Comma-separated list of predefined boolean filters' },
		{ displayName: 'Primary Filter', name: 'primaryFilter', type: 'string', default: '', description: 'Context-specific base filter to apply' },
	] },
];
