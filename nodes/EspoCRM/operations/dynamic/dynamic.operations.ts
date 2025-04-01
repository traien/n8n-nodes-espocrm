import { INodeProperties } from 'n8n-workflow';

export const dynamicOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['dynamic'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a record',
				action: 'Create a record',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a record',
				action: 'Delete a record',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a record',
				action: 'Get a record',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many records',
				action: 'Get many records',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a record',
				action: 'Update a record',
			},
		],
		default: 'create',
	},
];

export const dynamicFields: INodeProperties[] = [
	// Entity Type Field (common for all operations)
	{
		displayName: 'Entity Type Name or ID',
		name: 'entityType',
		type: 'options',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getEntityTypes',
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['dynamic'],
			},
		},
		description: 'Type of entity to interact with. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
	},

	// Fields for Create Operation
	{
		displayName: 'Fields',
		name: 'fieldsUi',
		placeholder: 'Add Field',
		type: 'fixedCollection',
		required: true,
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['dynamic'],
				operation: ['create'],
			},
		},
		default: {
			fieldValues: [
				{
					fieldName: '',
					fieldValue: '',
				},
			],
		},
		options: [
			{
				name: 'fieldValues',
				displayName: 'Field',
				values: [
					{
						displayName: 'Field Name or ID',
						name: 'fieldName',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getEntityFields',
							loadOptionsDependsOn: ['entityType'],
						},
						default: '',
						description: 'Name of the field. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
					},
					{
						displayName: 'Field Value',
						name: 'fieldValue',
						type: 'string',
						default: '',
						description: 'Value of the field',
					},
				],
			},
		],
	},

	// Fields for Get and Delete Operations
	{
		displayName: 'Record ID',
		name: 'recordId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['dynamic'],
				operation: ['get', 'delete', 'update'],
			},
		},
		default: '',
		description: 'ID of the record',
	},

	// Fields for Update Operation
	{
		displayName: 'Fields',
		name: 'fieldsUi',
		placeholder: 'Add Field',
		type: 'fixedCollection',
		required: true,
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['dynamic'],
				operation: ['update'],
			},
		},
		default: {
			fieldValues: [
				{
					fieldName: '',
					fieldValue: '',
				},
			],
		},
		options: [
			{
				name: 'fieldValues',
				displayName: 'Field',
				values: [
					{
						displayName: 'Field Name or ID',
						name: 'fieldName',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getEntityFields',
							loadOptionsDependsOn: ['entityType'],
						},
						default: '',
						description: 'Name of the field to update. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
					},
					{
						displayName: 'Field Value',
						name: 'fieldValue',
						type: 'string',
						default: '',
						description: 'New value of the field',
					},
				],
			},
		],
	},

	// Fields for GetAll Operation
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['dynamic'],
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
				resource: ['dynamic'],
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
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['dynamic'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Where (Filter Conditions)',
				name: 'where',
				type: 'json',
				default: '[]',
				description: 'Filter conditions for the query as defined in the EspoCRM API',
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
		],
	},
];
