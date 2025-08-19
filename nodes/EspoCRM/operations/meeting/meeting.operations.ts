import { INodeProperties } from 'n8n-workflow';
import { operations } from '../../types';

export const meetingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['meeting'],
			},
		},
		options: operations,
		default: 'create',
	},
];

export const meetingFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                meeting:create                              */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['meeting'],
				operation: ['create'],
			},
		},
		required: true,
		description: 'Name of the meeting',
	},
	{
		displayName: 'Start Date',
		name: 'dateStart',
		type: 'dateTime',
		default: '',
		displayOptions: {
			show: {
				resource: ['meeting'],
				operation: ['create'],
			},
		},
		required: true,
		description: 'Start date/time of the meeting',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['meeting'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'End Date',
				name: 'dateEnd',
				type: 'dateTime',
				default: '',
				description: 'End date/time of the meeting',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Held', value: 'Held' },
					{ name: 'Not Held', value: 'Not Held' },
					{ name: 'Planned', value: 'Planned' },
				],
				default: 'Planned',
				description: 'Status of the meeting',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'Description of the meeting',
			},
			{
				displayName: 'Assigned User ID',
				name: 'assignedUserId',
				type: 'string',
				default: '',
				description: 'ID of the assigned user',
			},
			{
				displayName: 'Parent Type',
				name: 'parentType',
				type: 'options',
				options: [
					{ name: 'Account', value: 'Account' },
					{ name: 'Lead', value: 'Lead' },
					{ name: 'Contact', value: 'Contact' },
					{ name: 'Opportunity', value: 'Opportunity' },
					{ name: 'Case', value: 'Case' },
				],
				default: 'Account',
				description: 'Type of the parent record',
			},
			{
				displayName: 'Parent ID',
				name: 'parentId',
				type: 'string',
				default: '',
				description: 'ID of the parent record',
			},
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                                 meeting:get                                 */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Meeting ID',
		name: 'meetingId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['meeting'],
				operation: ['get', 'update', 'delete'],
			},
		},
		description: 'ID of the meeting',
	},

	/* -------------------------------------------------------------------------- */
	/*                               meeting:update                                */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['meeting'],
				operation: ['update'],
			},
		},
		options: [
			{ displayName: 'Name', name: 'name', type: 'string', default: '' },
			{ displayName: 'Start Date', name: 'dateStart', type: 'dateTime', default: '' },
			{ displayName: 'End Date', name: 'dateEnd', type: 'dateTime', default: '' },
			{ displayName: 'Description', name: 'description', type: 'string', typeOptions: { rows: 4 }, default: '' },
			{ displayName: 'Status', name: 'status', type: 'options', options: [
				{ name: 'Held', value: 'Held' },
				{ name: 'Not Held', value: 'Not Held' },
				{ name: 'Planned', value: 'Planned' },
			], default: 'Planned' },
			{ displayName: 'Assigned User ID', name: 'assignedUserId', type: 'string', default: '' },
			{ displayName: 'Parent Type', name: 'parentType', type: 'options', options: [
				{ name: 'Account', value: 'Account' },
				{ name: 'Lead', value: 'Lead' },
				{ name: 'Contact', value: 'Contact' },
				{ name: 'Opportunity', value: 'Opportunity' },
				{ name: 'Case', value: 'Case' },
			], default: 'Account' },
			{ displayName: 'Parent ID', name: 'parentId', type: 'string', default: '' },
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                               meeting:getAll                                */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['meeting'],
				operation: ['getAll'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['meeting'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filter Options',
		name: 'filterOptions',
		type: 'collection',
		placeholder: 'Add Filter Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['meeting'],
				operation: ['getAll'],
			},
		},
		options: [
			{ displayName: 'Where (Filter Conditions)', name: 'where', type: 'json', default: '[]', typeOptions: { alwaysParseJson: true }, description: 'Filter conditions for the query as defined in the EspoCRM API' },
			{ displayName: 'Order By', name: 'orderBy', type: 'string', default: '', placeholder: 'dateStart', description: 'Field to sort results by' },
			{ displayName: 'Order Direction', name: 'order', type: 'options', options: [ { name: 'Ascending', value: 'asc' }, { name: 'Descending', value: 'desc' } ], default: 'desc', description: 'Direction to sort results by' },
			{ displayName: 'Select Fields', name: 'select', type: 'string', default: '', placeholder: 'id,name,dateStart,status', description: 'Comma-separated list of fields to return' },
			{ displayName: 'Offset', name: 'offset', type: 'number', default: 0, description: 'Number of results to skip (for pagination)' },
			{ displayName: 'Skip Total Count', name: 'skipTotalCount', type: 'boolean', default: false, description: 'Skip calculating total count for large datasets to improve performance' },
			{ displayName: 'Boolean Filter List', name: 'boolFilterList', type: 'string', default: '', placeholder: 'onlyMy,followed', description: 'Comma-separated list of predefined boolean filters' },
			{ displayName: 'Primary Filter', name: 'primaryFilter', type: 'string', default: '', description: 'Context-specific base filter to apply' },
		],
	},
];
