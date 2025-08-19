import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	NodeOperationError,
} from 'n8n-workflow';

// Import entity operations
import { accountOperations, accountFields } from './operations/account/account.operations';
import { contactOperations, contactFields } from './operations/contact/contact.operations';
import { leadOperations, leadFields } from './operations/lead/lead.operations';
import { dynamicOperations, dynamicFields } from './operations/dynamic/dynamic.operations';

// Import handler factory
import { HandlerFactory } from './handlers/HandlerFactory';

// Import services and helpers for dynamic fields
import { MetadataService } from './services/MetadataService';

// Import API request functions
import { espoApiRequest, espoApiRequestAllItems } from './GenericFunctions';

export class EspoCrm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'EspoCrm',
		name: 'espoCrm',
		icon: 'file:espocrm.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with EspoCrm API',
		defaults: {
			name: 'EspoCrm',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'espoCRMApi',
				required: true,
			},
		],
		documentationUrl: 'https://docs.espocrm.com/development/api/',
		properties: [
			// Primary resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Contact',
						value: 'contact',
					},
					{
						name: 'Custom Entity',
						value: 'customEntity',
					},
					{
						name: 'Dynamic',
						value: 'dynamic',
					},
					{
						name: 'Lead',
						value: 'lead',
					},
				],
				default: 'contact',
			},
			// Custom Entity Type field
			{
				displayName: 'Entity Type Name or ID',
				name: 'entityType',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getEntityTypes',
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['customEntity'],
					},
				},
				description: 'Type of entity to interact with (e.g., Opportunity, Case, Product). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			},

			// Include entity-specific operations and fields
			...accountOperations,
			...accountFields,
			...contactOperations,
			...contactFields,
			...leadOperations,
			...leadFields,
			...dynamicOperations,
			...dynamicFields,

			// Operations for custom entities
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['customEntity'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new record',
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
						description: 'Get a single record',
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

			// Fields for custom entity create operation
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['customEntity'],
						operation: ['create'],
					},
				},
				description: 'Data of the record to create',
			},

			// Fields for custom entity get/update/delete operation
			{
				displayName: 'Record ID',
				name: 'id',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['customEntity'],
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'ID of the record',
			},

			// Fields for custom entity update operation
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['customEntity'],
						operation: ['update'],
					},
				},
				description: 'Data to update the record with',
			},

			// Fields for custom entity getAll operation
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['customEntity'],
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
						resource: ['customEntity'],
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
						resource: ['customEntity'],
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
						placeholder: 'id,name',
						description: 'Comma-separated list of fields to return',
					},
					{
						displayName: 'Where (Filter Conditions)',
						name: 'where',
						type: 'json',
						default: '[]',
						description: 'Filter conditions for the query as defined in the EspoCrm API',
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
		],
	};

	// Methods for loading dynamic options
	methods = {
		loadOptions: {
			// Get list of entity types from EspoCrm metadata
			async getEntityTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const entityTypes = await MetadataService.getEntityList.call(this, this);
					return entityTypes.map(entityType => ({
						name: entityType,
						value: entityType,
					})).sort((a, b) => a.name.localeCompare(b.name));
				} catch (error) {
					console.error('Error loading entity types:', error);
					return [{ name: 'Error Loading Entity Types', value: '' }];
				}
			},

			// Get list of fields for a specific entity type
			async getEntityFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const entityType = this.getCurrentNodeParameter('entityType') as string;

				if (!entityType) {
					return [{ name: 'Please Select an Entity Type First', value: '' }];
				}

				try {
					const fieldDefs = await MetadataService.getFieldDefs.call(this, this, entityType);

					return Object.keys(fieldDefs).map(fieldName => {
						const fieldDef = fieldDefs[fieldName] as IDataObject;
						const label = fieldDef.label ? `${fieldDef.label as string} (${fieldName})` : fieldName;
						return {
							name: label,
							value: fieldName,
						};
					}).sort((a, b) => a.name.localeCompare(b.name));

				} catch (error) {
					console.error(`Error loading fields for entity type ${entityType}:`, error);
					return [{ name: `Error loading fields for ${entityType}`, value: '' }];
				}
			},

			// Get options for enum field
			async getEnumOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const entityType = this.getCurrentNodeParameter('entityType') as string;
				const fieldName = this.getCurrentNodeParameter('field') as string;

				if (!entityType || !fieldName) {
					return [{ name: 'Please Select an Entity Type and Field First', value: '' }];
				}

				try {
					const fieldDefs = await MetadataService.getFieldDefs.call(this, this, entityType);
					const fieldDef = fieldDefs[fieldName] as IDataObject;

					if (fieldDef && fieldDef.type === 'enum' && fieldDef.options) {
						const options = fieldDef.options as string[];
						return options.map((option) => ({
							name: option,
							value: option,
						}));
					}

					return [{ name: 'Not an Enum Field or No Options Available', value: '' }];

				} catch (error) {
					console.error(`Error loading enum options for ${entityType}.${fieldName}:`, error);
					return [{ name: `Error loading options for ${fieldName}`, value: '' }];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		// For each input item, execute the operation
		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				// Handle dynamic operations
				if (resource === 'dynamic') {
					const operation = this.getNodeParameter('operation', i) as string;
					const entityType = this.getNodeParameter('entityType', i) as string;

					if (operation === 'create') {
						// Create record in the dynamic entity
						const dataToSend: IDataObject = {};
						const fields = this.getNodeParameter('fieldsUi.fieldValues', i, []) as IDataObject[];

						// Process input fields
						for (const field of fields) {
							dataToSend[field.fieldName as string] = field.fieldValue;
						}

						// Execute API request
						const endpoint = `/${entityType}`;
						const responseData = await espoApiRequest.call(this, 'POST', endpoint, dataToSend);
						returnData.push(responseData as IDataObject);
					}
					else if (operation === 'get') {
						// Get a single record
						const recordId = this.getNodeParameter('recordId', i) as string;
						const endpoint = `/${entityType}/${recordId}`;
						const responseData = await espoApiRequest.call(this, 'GET', endpoint, {});
						returnData.push(responseData as IDataObject);
					}
					else if (operation === 'getAll') {
						// Get all records with filtering
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const endpoint = `/${entityType}`;
						const qs: IDataObject = {};

						// Process filters
						if (filters.where) {
							qs.where = filters.where;
						}
						if (filters.orderBy) {
							qs.orderBy = filters.orderBy;
						}
						if (filters.order) {
							qs.order = filters.order;
						}
						if (filters.select) {
							qs.select = filters.select;
						}

						// Handle pagination
						if (returnAll === true) {
							const responseData = await espoApiRequestAllItems.call(this, 'GET', endpoint, {}, qs);
							returnData.push(...responseData as IDataObject[]);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.maxSize = limit;
							const responseData = await espoApiRequest.call(this, 'GET', endpoint, {}, qs);
							returnData.push(...responseData.list as IDataObject[]);
						}
					}
					else if (operation === 'update') {
						// Update a record
						const recordId = this.getNodeParameter('recordId', i) as string;
						const dataToSend: IDataObject = {};
						const fields = this.getNodeParameter('fieldsUi.fieldValues', i, []) as IDataObject[];

						// Process input fields
						for (const field of fields) {
							dataToSend[field.fieldName as string] = field.fieldValue;
						}

						// Execute API request
						const endpoint = `/${entityType}/${recordId}`;
						const responseData = await espoApiRequest.call(this, 'PATCH', endpoint, dataToSend);
						returnData.push(responseData as IDataObject);
					}
					else if (operation === 'delete') {
						// Delete a record
						const recordId = this.getNodeParameter('recordId', i) as string;
						const endpoint = `/${entityType}/${recordId}`;
						await espoApiRequest.call(this, 'DELETE', endpoint, {});
						returnData.push({
							success: true,
							id: recordId,
							entityType,
						});
					}
				}
				// Handle regular entity operations
				else {
					// Get the appropriate handler for this resource type
					const handler = HandlerFactory.getHandler(resource);

					// Execute the operation using the handler
					let responseData: IDataObject | IDataObject[];

					switch (operation) {
						case 'create':
							responseData = await handler.create.call(this, i);
							returnData.push(responseData as IDataObject);
							break;

						case 'get':
							responseData = await handler.get.call(this, i);
							returnData.push(responseData as IDataObject);
							break;

						case 'update':
							responseData = await handler.update.call(this, i);
							returnData.push(responseData as IDataObject);
							break;

						case 'delete':
							responseData = await handler.delete.call(this, i);
							returnData.push(responseData as IDataObject);
							break;

						case 'getAll':
							responseData = await handler.getAll.call(this, i);
							returnData.push(...responseData as IDataObject[]);
							break;

						default:
							throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource type "${resource}"`);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
