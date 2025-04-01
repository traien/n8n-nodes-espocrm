import { INodeProperties } from 'n8n-workflow';
import { operations } from '../../types';

export const leadOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['lead'],
			},
		},
		options: operations,
		default: 'create',
	},
];

export const leadFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                 lead:create                                 */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['create'],
			},
		},
		description: 'First name of the lead',
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['create'],
			},
		},
		required: true,
		description: 'Last name of the lead',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		options: [
			{
				name: 'Assigned',
				value: 'Assigned',
			},
			{
				name: 'Converted',
				value: 'Converted',
			},
			{
				name: 'Dead',
				value: 'Dead',
			},
			{
				name: 'In Process',
				value: 'In Process',
			},
			{
				name: 'New',
				value: 'New',
			},
			{
				name: 'Recycled',
				value: 'Recycled',
			},
		],
		default: 'New',
		required: true,
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['create'],
			},
		},
		description: 'Status of the lead',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Account Name',
				name: 'accountName',
				type: 'string',
				default: '',
				description: 'Name of the company the lead is associated with',
			},
			{
				displayName: 'Address',
				name: 'address',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {},
				options: [
					{
						name: 'details',
						displayName: 'Address Details',
						values: [
							{
								displayName: 'Street',
								name: 'street',
								type: 'string',
								default: '',
								description: 'Street address of the lead',
							},
							{
								displayName: 'City',
								name: 'city',
								type: 'string',
								default: '',
								description: 'City of the lead',
							},
							{
								displayName: 'State',
								name: 'state',
								type: 'string',
								default: '',
								description: 'State/province of the lead',
							},
							{
								displayName: 'Country',
								name: 'country',
								type: 'string',
								default: '',
								description: 'Country of the lead',
							},
							{
								displayName: 'Postal Code',
								name: 'postalCode',
								type: 'string',
								default: '',
								description: 'Postal code of the lead',
							},
						],
					},
				],
				description: 'Address of the lead',
				},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Description of the lead',
			},
			{
				displayName: 'Email Address',
				name: 'emailAddress',
				type: 'string',
				default: '',
				description: 'Primary email address of the lead',
			},
			{
				displayName: 'Industry',
				name: 'industry',
				type: 'string',
				default: '',
				description: 'Industry of the lead company',
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				description: 'Phone number of the lead',
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{
						name: 'Call',
						value: 'Call',
					},
					{
						name: 'Campaign',
						value: 'Campaign',
					},
					{
						name: 'Email',
						value: 'Email',
					},
					{
						name: 'Existing Customer',
						value: 'ExistingCustomer',
					},
					{
						name: 'Other',
						value: 'Other',
					},
					{
						name: 'Partner',
						value: 'Partner',
					},
					{
						name: 'Public Relations',
						value: 'PublicRelations',
					},
					{
						name: 'Web Site',
						value: 'Web Site',
					},
				],
				default: 'Web Site',
				description: 'Source of the lead',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Job title of the lead',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Website of the lead company',
			},
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                                  lead:get                                   */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Lead ID',
		name: 'leadId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['get', 'update', 'delete'],
			},
		},
		description: 'ID of the lead',
	},

	/* -------------------------------------------------------------------------- */
	/*                                 lead:update                                 */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Account Name',
				name: 'accountName',
				type: 'string',
				default: '',
				description: 'Name of the company the lead is associated with',
			},
			{
				displayName: 'Address',
				name: 'address',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {},
				options: [
					{
						name: 'details',
						displayName: 'Address Details',
						values: [
							{
								displayName: 'Street',
								name: 'street',
								type: 'string',
								default: '',
								description: 'Street address of the lead',
							},
							{
								displayName: 'City',
								name: 'city',
								type: 'string',
								default: '',
								description: 'City of the lead',
							},
							{
								displayName: 'State',
								name: 'state',
								type: 'string',
								default: '',
								description: 'State/province of the lead',
							},
							{
								displayName: 'Country',
								name: 'country',
								type: 'string',
								default: '',
								description: 'Country of the lead',
							},
							{
								displayName: 'Postal Code',
								name: 'postalCode',
								type: 'string',
								default: '',
								description: 'Postal code of the lead',
							},
						],
					},
				],
				description: 'Address of the lead',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Description of the lead',
			},
			{
				displayName: 'Email Address',
				name: 'emailAddress',
				type: 'string',
				default: '',
				description: 'Primary email address of the lead',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				description: 'First name of the lead',
			},
			{
				displayName: 'Industry',
				name: 'industry',
				type: 'string',
				default: '',
				description: 'Industry of the lead company',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				description: 'Last name of the lead',
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				description: 'Phone number of the lead',
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{
						name: 'Call',
						value: 'Call',
					},
					{
						name: 'Campaign',
						value: 'Campaign',
					},
					{
						name: 'Email',
						value: 'Email',
					},
					{
						name: 'Existing Customer',
						value: 'ExistingCustomer',
					},
					{
						name: 'Other',
						value: 'Other',
					},
					{
						name: 'Partner',
						value: 'Partner',
					},
					{
						name: 'Public Relations',
						value: 'PublicRelations',
					},
					{
						name: 'Web Site',
						value: 'Web Site',
					},
				],
				default: 'Web Site',
				description: 'Source of the lead',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{
						name: 'Assigned',
						value: 'Assigned',
					},
					{
						name: 'Converted',
						value: 'Converted',
					},
					{
						name: 'Dead',
						value: 'Dead',
					},
					{
						name: 'In Process',
						value: 'In Process',
					},
					{
						name: 'New',
						value: 'New',
					},
					{
						name: 'Recycled',
						value: 'Recycled',
					},
				],
				default: 'New',
				description: 'Status of the lead',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Job title of the lead',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Website of the lead company',
			},
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                                 lead:getAll                                 */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['lead'],
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
				resource: ['lead'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
		},
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
				resource: ['lead'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Boolean Filter List',
				name: 'boolFilterList',
				type: 'string',
				default: '',
				placeholder: 'onlyMy,followed',
				description: 'Comma-separated list of predefined boolean filters',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				description: 'Number of results to skip (for pagination)',
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'string',
				default: '',
				placeholder: 'createdAt',
				description: 'Field to sort results by',
			},
			{
				displayName: 'Order Direction',
				name: 'order',
				type: 'options',
				options: [
					{
						name: 'Ascending',
						value: 'asc',
					},
					{
						name: 'Descending',
						value: 'desc',
					},
				],
				default: 'asc',
				description: 'Direction to sort results by',
			},
			{
				displayName: 'Primary Filter',
				name: 'primaryFilter',
				type: 'string',
				default: '',
				description: 'Context-specific base filter to apply',
			},
			{
				displayName: 'Select Fields',
				name: 'select',
				type: 'string',
				default: '',
				placeholder: 'id,name,emailAddress',
				description: 'Comma-separated list of fields to return',
			},
			{
				displayName: 'Skip Total Count',
				name: 'skipTotalCount',
				type: 'boolean',
				default: false,
				description: 'Whether to skip calculating total count for large datasets to improve performance',
			},
			{
				displayName: 'Where (Filter Conditions)',
				name: 'where',
				type: 'json',
				default: '[]',
				description: 'Filter conditions for the query as defined in the EspoCRM API',
			},
		],
	},
];