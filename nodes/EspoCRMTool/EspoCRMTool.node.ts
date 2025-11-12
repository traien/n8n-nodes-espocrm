import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { espoApiRequest, espoApiRequestAllItems } from '../EspoCRM/GenericFunctions';

const OPERATION_VALUES = ['get', 'getAll', 'create', 'update', 'delete'] as const;
type ToolOperation = (typeof OPERATION_VALUES)[number];

function parseJsonInput(
	value: string | IDataObject | undefined,
	fieldName: string,
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject | undefined {
	if (!value) {
		return undefined;
	}
	if (typeof value !== 'string') {
		return value as IDataObject;
	}
	try {
		return JSON.parse(value);
	} catch (error) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Invalid JSON provided for ${fieldName}: ${(error as Error).message}`,
			{ itemIndex },
		);
	}
}

function normalizeFilters(filtersInput: unknown, ctx: IExecuteFunctions, itemIndex: number): IDataObject | undefined {
	if (filtersInput === undefined || filtersInput === null || filtersInput === '') {
		return undefined;
	}

	if (typeof filtersInput === 'string') {
		try {
			return JSON.parse(filtersInput);
		} catch (error) {
			throw new NodeOperationError(ctx.getNode(), 'Failed to parse filters JSON string', { itemIndex });
		}
	}

	if (typeof filtersInput === 'object' && !Array.isArray(filtersInput)) {
		return filtersInput as IDataObject;
	}

	throw new NodeOperationError(ctx.getNode(), 'Filters must be a JSON object or JSON string', { itemIndex });
}

function buildQueryParts(filters: IDataObject | undefined, ctx: IExecuteFunctions, itemIndex: number): {
	qs: IDataObject;
	headers: IDataObject;
} {
	const qs: IDataObject = {};
	const headers: IDataObject = {};

	if (!filters) {
		return { qs, headers };
	}

	for (const [key, value] of Object.entries(filters)) {
		if (value === undefined || value === null || value === '') {
			continue;
		}

		if (key === 'where') {
			if (typeof value === 'string') {
				try {
					qs.where = JSON.parse(value);
				} catch (error) {
					throw new NodeOperationError(ctx.getNode(), "Invalid JSON supplied for filters.where", { itemIndex });
				}
			} else {
				qs.where = value as IDataObject;
			}
			continue;
		}

		if (key === 'skipTotalCount' && value === true) {
			headers['X-No-Total'] = 'true';
			continue;
		}

		qs[key] = value as IDataObject;
	}

	return { qs, headers };
}

export class EspoCRMTool implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'EspoCRM Tool',
		name: 'espoCrmTool',
		icon: 'file:espocrm.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: 'Expose EspoCRM to AI agents',
		description: 'Use this tool to interact with EspoCRM via REST API',
		defaults: {
			name: 'EspoCRM Tool',
		},
		inputs: [{ type: 'main', required: true }],
		outputs: [{ type: 'main', required: true }],
		documentationUrl: 'https://docs.espocrm.com/development/api/',
		credentials: [
			{
				name: 'espoCRMApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Entity Type',
				name: 'entityType',
				type: 'string',
				default: '',
				required: true,
				description: 'The EspoCRM entity type (e.g., Account, Contact, Lead)',
				placeholder: 'Account',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{ name: 'Get Record', value: 'get' },
					{ name: 'List/Search Records', value: 'getAll' },
					{ name: 'Create Record', value: 'create' },
					{ name: 'Update Record', value: 'update' },
					{ name: 'Delete Record', value: 'delete' },
				],
				default: 'get',
				required: true,
				description: 'The operation to perform',
			},
			{
				displayName: 'Record ID',
				name: 'recordId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete'],
					},
				},
				required: true,
				description: 'The ID of the record to get, update, or delete',
			},
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				required: true,
				description: 'The data object with fields to create or update',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
				description: 'Filters to apply to the search (EspoCRM where clause)',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
				description: 'Whether to return all results or use pagination',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
					maxValue: 500,
				},
				displayOptions: {
					show: {
						operation: ['getAll'],
						returnAll: [false],
					},
				},
				description: 'Maximum number of records to return',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const entityType = (this.getNodeParameter('entityType', i) as string).trim();
				const operation = this.getNodeParameter('operation', i) as ToolOperation;

				// Validate entityType format to prevent URL construction errors
				if (!entityType) {
					throw new NodeOperationError(this.getNode(), 'entityType is required', { itemIndex: i });
				}

				if (!/^[a-zA-Z0-9_-]+$/.test(entityType)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid entityType: "${entityType}". Entity type must contain only letters, numbers, underscores, or hyphens.`,
						{ itemIndex: i },
					);
				}

				const encodedEntityType = encodeURIComponent(entityType);
				const endpoint = `/${encodedEntityType}`;

				this.logger.debug(
					`[EspoCRM Tool] op=${operation} entity=${entityType} encodedEntity=${encodedEntityType} endpoint=${endpoint}`,
				);

				let result: any;

				switch (operation) {
					case 'get': {
						const recordId = (this.getNodeParameter('recordId', i) as string).trim();
						
						if (!recordId) {
							throw new NodeOperationError(this.getNode(), 'recordId is required for get operations', { itemIndex: i });
						}

						// Validate recordId format
						if (!/^[a-zA-Z0-9_-]+$/.test(recordId)) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid recordId: "${recordId}". Record ID must contain only letters, numbers, underscores, or hyphens.`,
								{ itemIndex: i },
							);
						}

						const encodeId = (value: string) => encodeURIComponent(value);
						result = await espoApiRequest.call(this, 'GET', `${endpoint}/${encodeId(recordId)}`);
						break;
					}

					case 'delete': {
						const recordId = (this.getNodeParameter('recordId', i) as string).trim();
						
						if (!recordId) {
							throw new NodeOperationError(this.getNode(), 'recordId is required for delete operations', { itemIndex: i });
						}

						if (!/^[a-zA-Z0-9_-]+$/.test(recordId)) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid recordId: "${recordId}". Record ID must contain only letters, numbers, underscores, or hyphens.`,
								{ itemIndex: i },
							);
						}

						const encodeId = (value: string) => encodeURIComponent(value);
						await espoApiRequest.call(this, 'DELETE', `${endpoint}/${encodeId(recordId)}`);
						result = { success: true, entityType, id: recordId };
						break;
					}

					case 'update': {
						const recordId = (this.getNodeParameter('recordId', i) as string).trim();
						
						if (!recordId) {
							throw new NodeOperationError(this.getNode(), 'recordId is required for update operations', { itemIndex: i });
						}

						if (!/^[a-zA-Z0-9_-]+$/.test(recordId)) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid recordId: "${recordId}". Record ID must contain only letters, numbers, underscores, or hyphens.`,
								{ itemIndex: i },
							);
						}

						const dataRaw = this.getNodeParameter('data', i) as string | IDataObject;
						const parsedData = parseJsonInput(dataRaw, 'data', this, i);
						
						if (!parsedData || Object.keys(parsedData).length === 0) {
							throw new NodeOperationError(this.getNode(), 'Provide a data object with fields to update', { itemIndex: i });
						}

						const encodeId = (value: string) => encodeURIComponent(value);
						result = await espoApiRequest.call(this, 'PATCH', `${endpoint}/${encodeId(recordId)}`, parsedData as IDataObject);
						break;
					}

					case 'create': {
						const dataRaw = this.getNodeParameter('data', i) as string | IDataObject;
						const parsedData = parseJsonInput(dataRaw, 'data', this, i);
						
						if (!parsedData || Object.keys(parsedData).length === 0) {
							throw new NodeOperationError(this.getNode(), 'Provide a data object with fields to create', { itemIndex: i });
						}

						result = await espoApiRequest.call(this, 'POST', endpoint, parsedData as IDataObject);
						break;
					}

					case 'getAll': {
						const filtersRaw = this.getNodeParameter('filters', i, '{}') as string | IDataObject;
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;

						const parsedFiltersInput = parseJsonInput(filtersRaw, 'filters', this, i);
						const parsedFilters = normalizeFilters(parsedFiltersInput, this, i);
						const { qs, headers } = buildQueryParts(parsedFilters, this, i);

						if (returnAll) {
							const items = await espoApiRequestAllItems.call(this, 'GET', endpoint, {}, qs);
							result = items;
						} else {
							const cappedLimit = Math.max(1, Math.min(limit, 500));
							qs.maxSize = cappedLimit;
							const response = await espoApiRequest.call(this, 'GET', endpoint, {}, qs, undefined, headers);
							if (Array.isArray((response as IDataObject).list)) {
								result = (response as IDataObject).list;
							} else {
								result = response;
							}
						}
						break;
					}

					default:
						throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not supported`, { itemIndex: i });
				}

				returnData.push({
					json: typeof result === 'string' ? { result } : result,
					pairedItem: { item: i },
				});

			} catch (error: any) {
				if (!this.continueOnFail()) throw error;
				
				returnData.push({
					json: { error: error.message },
					pairedItem: { item: i },
				});
			}
		}

		return [returnData];
	}
}
