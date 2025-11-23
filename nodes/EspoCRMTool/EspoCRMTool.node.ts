import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';


import { espoApiRequest, espoApiRequestAllItems } from '../EspoCRM/GenericFunctions';

const OPERATION_VALUES = ['get', 'getAll', 'create', 'update', 'delete', 'getSchema'] as const;
type ToolOperation = (typeof OPERATION_VALUES)[number];

const OPERATION_ALIAS_MAP: Record<string, ToolOperation> = {
	get: 'get',
	retrieve: 'get',
	getone: 'get',
	findone: 'get',
	read: 'get',
	getall: 'getAll',
	list: 'getAll',
	find: 'getAll',
	search: 'getAll',
	count: 'getAll',
	query: 'getAll',
	create: 'create',
	insert: 'create',
	add: 'create',
	make: 'create',
	update: 'update',
	modify: 'update',
	patch: 'update',
	change: 'update',
	delete: 'delete',
	remove: 'delete',
	destroy: 'delete',
	schema: 'getSchema',
	metadata: 'getSchema',
	describe: 'getSchema',
	structure: 'getSchema',
};

export class EspoCRMTool implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'EspoCRM Tool',
		name: 'espoCrmTool',
		icon: 'file:espocrm.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: 'Interact with EspoCRM records',
		description: 'Create, read, update, delete, and COUNT records in EspoCRM. Supports natural language commands like "Find all accounts" or "Create a new case". Note: You can only interact with ONE entity type per tool call. To interact with multiple entities, make multiple tool calls.',
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
				required: false,
				description: 'The EspoCRM entity type (e.g., Account, Contact, Lead). Required for all operations except "Get Schema".',
			},
			{
				displayName: 'Operations',
				name: 'operations',
				type: 'multiOptions',
				options: [
					{ name: 'Get Record', value: 'get' },
					{ name: 'List/Search Records', value: 'getAll' },
					{ name: 'Create Record', value: 'create' },
					{ name: 'Update Record', value: 'update' },
					{ name: 'Delete Record', value: 'delete' },
					{ name: 'Get Schema/Metadata', value: 'getSchema' },
				],
				default: ['get'],
				description: 'The action to perform. Use "Get Schema" to discover available entity types and their fields. "List/Search Records" returns the TOTAL count of records matching the filter, so use it for counting tasks.',
			},
			{
				displayName: 'Record ID',
				name: 'recordId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operations: ['get', 'update', 'delete'],
					},
				},
				description: 'The ID of the record to get, update, or delete',
			},
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						operations: ['create', 'update'],
					},
				},
				description: 'The data object with fields to create or update. \n\n**CRITICAL**: When creating a Case, Account, Contact, or Task, you **MUST** include a "name" field. \n\nExample: { "name": "Review Tasks", "status": "New" }',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						operations: ['getAll'],
					},
				},
				description: 'Filters to apply to the search (EspoCRM where clause). E.g. { "status": "Completed" } or { "name": "Acme%" }.',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operations: ['getAll'],
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
						operations: ['getAll'],
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
				const inputJson = items[i].json as IDataObject;
				const entityTypeParam = (this.getNodeParameter('entityType', i) as string).trim();
				const entityType = (inputJson.entityType as string || entityTypeParam).trim();

				const configuredOperationsRaw = this.getNodeParameter('operations', i);
				const configuredOperationsArray = (Array.isArray(configuredOperationsRaw) ? configuredOperationsRaw : [configuredOperationsRaw]) as string[];

				const allowedOperations = new Set<ToolOperation>();
				for (const rawOp of configuredOperationsArray) {
					try {
						const mapped = mapOperationName(rawOp, this, i);
						allowedOperations.add(mapped);
					} catch (error) {
						// Ignore invalid configured operations
					}
				}
				if (allowedOperations.size === 0) allowedOperations.add('get');

				// Determine Operations to Execute
				let rawOperationsInput = inputJson.operations ?? inputJson.Operations ?? configuredOperationsArray;
				if (!Array.isArray(rawOperationsInput)) {
					rawOperationsInput = [rawOperationsInput];
				}

				const operations: ToolOperation[] = [];
				for (const entry of (rawOperationsInput as any[])) {
					if (typeof entry === 'string') {
						try {
							const op = mapOperationName(entry, this, i);
							if (allowedOperations.has(op)) {
								operations.push(op);
							}
						} catch (e) {
							// Ignore
						}
					} else if (typeof entry === 'object' && entry !== null) {
						const obj = entry as IDataObject;
						const opName = (obj.operation || obj.op || obj.type || obj.name) as string | undefined;
						if (opName) {
							const op = mapOperationName(opName, this, i);
							if (allowedOperations.has(op)) {
								operations.push(op);
							}
						}
						// Replicate side effects
						if (obj.where && inputJson.filters === undefined) inputJson.filters = { where: obj.where } as IDataObject;
						if (obj.filters && inputJson.filters === undefined) inputJson.filters = obj.filters as IDataObject;
						if (obj.data && inputJson.data === undefined) inputJson.data = obj.data as IDataObject | string;
						if (obj.returnAll !== undefined && inputJson.returnAll === undefined) inputJson.returnAll = obj.returnAll as boolean;
						if (obj.limit !== undefined && inputJson.limit === undefined) inputJson.limit = obj.limit as number;
					}
				}

				if (operations.length === 0) {
					operations.push('get');
				}

				const results: any[] = [];

				for (const operation of operations) {
					let result: any;

					try {
						if (operation === 'getSchema') {
							const response = await espoApiRequest.call(this, 'GET', 'Metadata');
							if (entityType) {
								// Return specific entity definition
								const scopes = response.scopes || {};
								const entityDef = response.entityDefs?.[entityType] || {};
								result = {
									entity: entityType,
									scope: scopes[entityType],
									fields: entityDef.fields,
								};
							} else {
								// Return list of available entities
								const scopes = response.scopes || {};
								const entities = Object.keys(scopes).filter(key => scopes[key].object && !scopes[key].disabled);
								result = {
									availableEntityTypes: entities,
									message: 'Specify an entityType to get detailed field definitions.',
								};
							}
							results.push({ operation, result });
							continue;
						}

						// For other operations, entityType is required
						if (!entityType) {
							throw new NodeOperationError(this.getNode(), 'Entity Type is required for this operation.', { itemIndex: i });
						}

						if (!/^[a-zA-Z0-9_-]+$/.test(entityType)) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid Entity Type: "${entityType}". Must contain only letters, numbers, underscores, or hyphens.`,
								{ itemIndex: i },
							);
						}

						const encodedEntityType = encodeURIComponent(entityType);
						const endpoint = `/${encodedEntityType}`;

						switch (operation) {
							case 'get': {
								const fallbackRecordId = this.getNodeParameter('recordId', i, '') as string;
								const recordIdRaw = inputJson.recordId ?? inputJson.id ?? fallbackRecordId;
								const recordId = recordIdRaw === undefined || recordIdRaw === null ? '' : `${recordIdRaw}`.trim();

								if (!recordId) {
									if (operations.length === 1) {
										throw new NodeOperationError(this.getNode(), 'recordId is required for get operations', { itemIndex: i });
									}
									continue;
								}

								if (!/^[a-zA-Z0-9_-]+$/.test(recordId)) {
									throw new NodeOperationError(this.getNode(), `Invalid recordId: "${recordId}"`, { itemIndex: i });
								}

								const encodeId = (value: string) => encodeURIComponent(value);
								result = await espoApiRequest.call(this, 'GET', `${endpoint}/${encodeId(recordId)}`);
								break;
							}

							case 'delete': {
								const fallbackRecordId = this.getNodeParameter('recordId', i, '') as string;
								const recordIdRaw = inputJson.recordId ?? inputJson.id ?? fallbackRecordId;
								const recordId = recordIdRaw === undefined || recordIdRaw === null ? '' : `${recordIdRaw}`.trim();

								if (!recordId) {
									if (operations.length === 1) {
										throw new NodeOperationError(this.getNode(), 'recordId is required for delete operations', { itemIndex: i });
									}
									continue;
								}

								if (!/^[a-zA-Z0-9_-]+$/.test(recordId)) {
									throw new NodeOperationError(this.getNode(), `Invalid recordId: "${recordId}"`, { itemIndex: i });
								}

								const encodeId = (value: string) => encodeURIComponent(value);
								await espoApiRequest.call(this, 'DELETE', `${endpoint}/${encodeId(recordId)}`);
								result = { success: true, entityType, id: recordId };
								break;
							}

							case 'update': {
								const fallbackRecordId = this.getNodeParameter('recordId', i, '') as string;
								const recordIdRaw = inputJson.recordId ?? inputJson.id ?? fallbackRecordId;
								const recordId = recordIdRaw === undefined || recordIdRaw === null ? '' : `${recordIdRaw}`.trim();

								if (!recordId) {
									if (operations.length === 1) {
										throw new NodeOperationError(this.getNode(), 'recordId is required for update operations', { itemIndex: i });
									}
									continue;
								}

								if (!/^[a-zA-Z0-9_-]+$/.test(recordId)) {
									throw new NodeOperationError(this.getNode(), `Invalid recordId: "${recordId}"`, { itemIndex: i });
								}

								const fallbackData = this.getNodeParameter('data', i, undefined) as IDataObject | string | undefined;
								const parsedData = buildDataPayload(inputJson, this, i, fallbackData);

								if (!parsedData || Object.keys(parsedData).length === 0) {
									if (operations.length === 1) {
										throw new NodeOperationError(this.getNode(), 'Provide a data object with fields to update', { itemIndex: i });
									}
									continue;
								}

								const encodeId = (value: string) => encodeURIComponent(value);
								result = await espoApiRequest.call(this, 'PATCH', `${endpoint}/${encodeId(recordId)}`, parsedData as IDataObject);
								break;
							}

							case 'create': {
								const fallbackData = this.getNodeParameter('data', i, undefined) as IDataObject | string | undefined;
								const parsedData = buildDataPayload(inputJson, this, i, fallbackData);

								if (!parsedData || Object.keys(parsedData).length === 0) {
									if (operations.length === 1) {
										throw new NodeOperationError(this.getNode(), 'Provide a data object with fields to create', { itemIndex: i });
									}
									continue;
								}

								// Fallback: If name is missing for specific entities, auto-generate it to prevent 400 errors
								const entitiesRequiringName = ['Case', 'Account', 'Contact', 'Task', 'Opportunity', 'Lead'];
								if (entitiesRequiringName.includes(entityType) && !parsedData.name) {
									// Try to map from other common fields
									const fallbackName = parsedData.subject || parsedData.title || parsedData.description || `New ${entityType} (Auto-created)`;
									parsedData.name = fallbackName;
								}

								result = await espoApiRequest.call(this, 'POST', endpoint, parsedData as IDataObject);
								break;
							}

							case 'getAll': {
								const fallbackFilters = this.getNodeParameter('filters', i, undefined) as IDataObject | string | undefined;
								const filtersSource = inputJson.filters ?? (inputJson.where ? { where: inputJson.where } : undefined) ?? fallbackFilters;
								const parsedFiltersInput = parseJsonInput(filtersSource as IDataObject | string | undefined, 'filters', this, i);
								const parsedFilters = normalizeFilters(parsedFiltersInput, this, i);
								const { qs, headers } = buildQueryParts(parsedFilters, this, i);

								const returnAllInput = inputJson.returnAll ?? inputJson.all;
								const returnAll = typeof returnAllInput === 'boolean' ? returnAllInput : (this.getNodeParameter('returnAll', i, false) as boolean);
								const limitInput = inputJson.limit ?? inputJson.maxSize ?? this.getNodeParameter('limit', i, 50);
								let limit = Number(limitInput);
								if (!Number.isFinite(limit) || limit < 1) limit = 1;
								if (returnAll) {
									const items = await espoApiRequestAllItems.call(this, 'GET', endpoint, {}, qs);
									result = { list: items, total: items.length };
								} else {
									const cappedLimit = Math.max(1, Math.min(limit, 500));
									qs.maxSize = cappedLimit;
									const response = await espoApiRequest.call(this, 'GET', endpoint, {}, qs, undefined, headers);
									result = response;
								}
								break;
							}

							default:
								throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not supported`, { itemIndex: i });
						}

						results.push({
							operation,
							result: typeof result === 'string' ? { result } : result,
						});
					} catch (operationError: any) {
						if (operations.length === 1) {
							throw operationError;
						}
						results.push({
							operation,
							result: { error: operationError.message },
						});
					}
				}

				const outputJson = results.length === 1 ? results[0].result : { operations: results };

				returnData.push({
					json: outputJson,
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

function parseJsonInput(
	value: string | IDataObject | undefined,
	fieldName: string,
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	if (typeof value !== 'string') {
		return value as IDataObject;
	}
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	try {
		return JSON.parse(trimmed);
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

function buildDataPayload(
	inputJson: IDataObject,
	ctx: IExecuteFunctions,
	itemIndex: number,
	fallbackData?: IDataObject | string,
): IDataObject | undefined {
	const valueFromInput = parseJsonInput(inputJson.data as IDataObject | string | undefined, 'data', ctx, itemIndex);
	if (valueFromInput && Object.keys(valueFromInput).length > 0) {
		return valueFromInput;
	}
	const valueFromFallback = parseJsonInput(fallbackData, 'data', ctx, itemIndex);
	if (valueFromFallback && Object.keys(valueFromFallback).length > 0) {
		return valueFromFallback;
	}
	const {
		entityType: _et,
		recordId: _rid,
		id: _id,
		operations: _ops,
		filters: _filters,
		returnAll: _returnAll,
		limit: _limit,
		data: _data,
		...rest
	} = inputJson;
	const cleaned = rest as IDataObject;
	return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function mapOperationName(raw: string, ctx: IExecuteFunctions, itemIndex: number): ToolOperation {
	const key = raw.trim().toLowerCase();
	if (!key) {
		throw new NodeOperationError(ctx.getNode(), 'Operation name cannot be empty', { itemIndex });
	}

	// Handle natural language inputs (e.g. "Find Accounts" -> "getAll")
	if (key.startsWith('get all ') || key.startsWith('find ') || key.startsWith('search ') || key.startsWith('list ') || key.startsWith('query ') || key.startsWith('count ')) return 'getAll';
	if (key.startsWith('get ') || key.startsWith('read ') || key.startsWith('retrieve ')) return 'get';
	if (key.startsWith('create ') || key.startsWith('add ') || key.startsWith('insert ') || key.startsWith('make ')) return 'create';
	if (key.startsWith('update ') || key.startsWith('modify ') || key.startsWith('change ') || key.startsWith('patch ')) return 'update';
	if (key.startsWith('delete ') || key.startsWith('remove ') || key.startsWith('destroy ')) return 'delete';

	const mapped = OPERATION_ALIAS_MAP[key] || (OPERATION_VALUES.find((op) => op.toLowerCase() === key) as ToolOperation | undefined);
	if (!mapped) {
		throw new NodeOperationError(ctx.getNode(), `Operation "${raw}" is not supported`, { itemIndex });
	}
	return mapped;
}

