import { INodeProperties } from 'n8n-workflow';
import { operations } from '../../types';

export const accountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['account'],
			},
		},
		options: operations,
		default: 'create',
	},
];

export const accountFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                account:create                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['create'],
			},
		},
		required: true,
		description: 'Name of the account',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Website of the account',
			},
			{
				displayName: 'Email Address',
				name: 'emailAddress',
				type: 'string',
				default: '',
				description: 'Primary email address of the account',
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				description: 'Phone number of the account',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{
						name: 'Customer',
						value: 'Customer',
					},
					{
						name: 'Investor',
						value: 'Investor',
					},
					{
						name: 'Partner',
						value: 'Partner',
					},
					{
						name: 'Reseller',
						value: 'Reseller',
					},
				],
				default: 'Customer',
				description: 'Type of the account',
			},
			{
				displayName: 'Industry',
				name: 'industry',
				type: 'string',
				default: '',
				description: 'Industry of the account',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Description of the account',
			},
			{
				displayName: 'Billing Address',
				name: 'billingAddress',
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
							},
							{
								displayName: 'City',
								name: 'city',
								type: 'string',
								default: '',
							},
							{
								displayName: 'State',
								name: 'state',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Country',
								name: 'country',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Postal Code',
								name: 'postalCode',
								type: 'string',
								default: '',
							},
						],
					},
				],
				description: 'Billing address of the account',
			},
			{
				displayName: 'Shipping Address',
				name: 'shippingAddress',
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
							},
							{
								displayName: 'City',
								name: 'city',
								type: 'string',
								default: '',
							},
							{
								displayName: 'State',
								name: 'state',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Country',
								name: 'country',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Postal Code',
								name: 'postalCode',
								type: 'string',
								default: '',
							},
						],
					},
				],
				description: 'Shipping address of the account',
			},
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                                 account:get                                 */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Account ID',
		name: 'accountId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['get', 'update', 'delete'],
			},
		},
		description: 'ID of the account',
	},

	/* -------------------------------------------------------------------------- */
	/*                                account:update                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name of the account',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Website of the account',
			},
			{
				displayName: 'Email Address',
				name: 'emailAddress',
				type: 'string',
				default: '',
				description: 'Primary email address of the account',
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				description: 'Phone number of the account',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{
						name: 'Customer',
						value: 'Customer',
					},
					{
						name: 'Investor',
						value: 'Investor',
					},
					{
						name: 'Partner',
						value: 'Partner',
					},
					{
						name: 'Reseller',
						value: 'Reseller',
					},
				],
				default: 'Customer',
				description: 'Type of the account',
			},
			{
				displayName: 'Industry',
				name: 'industry',
				type: 'string',
				default: '',
				description: 'Industry of the account',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Description of the account',
			},
			{
				displayName: 'Billing Address',
				name: 'billingAddress',
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
							},
							{
								displayName: 'City',
								name: 'city',
								type: 'string',
								default: '',
							},
							{
								displayName: 'State',
								name: 'state',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Country',
								name: 'country',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Postal Code',
								name: 'postalCode',
								type: 'string',
								default: '',
							},
						],
					},
				],
				description: 'Billing address of the account',
			},
			{
				displayName: 'Shipping Address',
				name: 'shippingAddress',
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
							},
							{
								displayName: 'City',
								name: 'city',
								type: 'string',
								default: '',
							},
							{
								displayName: 'State',
								name: 'state',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Country',
								name: 'country',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Postal Code',
								name: 'postalCode',
								type: 'string',
								default: '',
							},
						],
					},
				],
				description: 'Shipping address of the account',
			},
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                                account:getAll                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['account'],
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
				resource: ['account'],
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
				resource: ['account'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Where (Filter Conditions)',
				name: 'where',
				type: 'json',
				default: '[]',
				typeOptions: {
					alwaysParseJson: true,
				},
				description: 'Filter conditions for the query as defined in the EspoCrm API',
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
				displayName: 'Select Fields',
				name: 'select',
				type: 'string',
				default: '',
				placeholder: 'id,name,emailAddress',
				description: 'Comma-separated list of fields to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				description: 'Number of results to skip (for pagination)',
			},
			{
				displayName: 'Skip Total Count',
				name: 'skipTotalCount',
				type: 'boolean',
				default: false,
				description: 'Whether to skip calculating total count for large datasets to improve performance',
			},
			{
				displayName: 'Boolean Filter List',
				name: 'boolFilterList',
				type: 'string',
				default: '',
				placeholder: 'onlyMy,followed',
				description: 'Comma-separated list of predefined boolean filters',
			},
			{
				displayName: 'Primary Filter',
				name: 'primaryFilter',
				type: 'string',
				default: '',
				description: 'Context-specific base filter to apply',
			},
		],
	},
];
