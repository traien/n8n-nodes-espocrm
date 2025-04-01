import { INodeProperties } from 'n8n-workflow';

/**
 * Operations for the Dynamic Fields resource
 */
export const dynamicFieldsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['dynamicFields'],
			},
		},
		options: [
			{
				name: 'Filter Records',
				value: 'filterRecords',
				description: 'Filter records using dynamic field selection',
				action: 'Filter records',
			},
			{
				name: 'Get Entity Fields',
				value: 'getEntityFields',
				description: 'Get field metadata for an entity',
				action: 'Get entity fields',
			},
			{
				name: 'Get Entity Types',
				value: 'getEntityTypes',
				description: 'Get available entity types',
				action: 'Get entity types',
			},
			{
				name: 'Get Field Metadata',
				value: 'getFieldMetadata',
				description: 'Get detailed metadata for a specific field',
				action: 'Get field metadata',
			},
		],
		default: 'getEntityFields',
	},
];

/**
 * Fields for the Dynamic Fields resource
 */
export const dynamicFieldsFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                        dynamicFields:getEntityFields                      */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Entity Type',
		name: 'entityType',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['dynamicFields'],
				operation: ['getEntityFields', 'filterRecords', 'getFieldMetadata'],
			},
		},
		description: 'Type of entity to get field definitions for (e.g., Account, Contact, Lead)',
		placeholder: 'Contact',
	},
	
	/* -------------------------------------------------------------------------- */
	/*                        dynamicFields:getFieldMetadata                     */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Field Name',
		name: 'fieldName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['dynamicFields'],
				operation: ['getFieldMetadata'],
			},
		},
		description: 'Name of the field to get metadata for',
		placeholder: 'name',
	},
	
	/* -------------------------------------------------------------------------- */
	/*                        dynamicFields:filterRecords                        */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['dynamicFields'],
				operation: ['filterRecords'],
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
				resource: ['dynamicFields'],
				operation: ['filterRecords'],
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
		displayName: 'Filter Conditions',
		name: 'filterConditions',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'Add Condition',
		default: {},
		displayOptions: {
			show: {
				resource: ['dynamicFields'],
				operation: ['filterRecords'],
			},
		},
		options: [
			{
				name: 'conditions',
				displayName: 'Conditions',
				values: [
					{
						displayName: 'Field Name or ID',
						name: 'field',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getEntityFields',
							loadOptionsDependsOn: ['entityType'],
						},
						default: '',
						description: 'The field name to filter on. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
					},
					{
						displayName: 'Operator',
						name: 'operator',
						type: 'options',
						options: [
							{
								name: 'Contains',
								value: 'contains',
							},
							{
								name: 'Equals',
								value: 'equals',
							},
							{
								name: 'Greater Than',
								value: 'greaterThan',
							},
							{
								name: 'Greater Than or Equals',
								value: 'greaterThanOrEquals',
							},
							{
								name: 'In',
								value: 'in',
							},
							{
								name: 'Is Empty',
								value: 'isEmpty',
							},
							{
								name: 'Is Not Empty',
								value: 'isNotEmpty',
							},
							{
								name: 'Less Than',
								value: 'lessThan',
							},
							{
								name: 'Less Than or Equals',
								value: 'lessThanOrEquals',
							},
							{
								name: 'Not Contains',
								value: 'notContains',
							},
							{
								name: 'Not Equals',
								value: 'notEquals',
							},
							{
								name: 'Not In',
								value: 'notIn',
							},
						],
						default: 'equals',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						displayOptions: {
							hide: {
								operator: ['isEmpty', 'isNotEmpty'],
							},
						},
						default: '',
						description: 'The value to compare with (type will adapt based on field type)',
					},
				],
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['dynamicFields'],
				operation: ['filterRecords'],
			},
		},
		options: [
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				description: 'Number of results to skip (for pagination)',
			},
			{
				displayName: 'Order By Name or ID',
				name: 'orderBy',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getEntityFields',
					loadOptionsDependsOn: ['entityType'],
				},
				default: '',
				description: 'Field to sort results by. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
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
				displayName: 'Select Field Names or IDs',
				name: 'select',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getEntityFields',
					loadOptionsDependsOn: ['entityType'],
				},
				default: [],
				description: 'Fields to return in the response. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			},
			{
				displayName: 'Skip Total Count',
				name: 'skipTotalCount',
				type: 'boolean',
				default: false,
				description: 'Whether to skip calculating total count for large datasets to improve performance',
			},
		],
	},
];