import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

import {
	espoApiRequest,
	espoApiRequestAllItems,
	testEspoConnection,
} from '../EspoCRM/GenericFunctions';

const OPERATION_VALUES = ['get', 'getAll', 'create', 'update', 'delete'] as const;
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
};

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

function normalizeFilters(
	filtersInput: unknown,
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject | undefined {
	if (filtersInput === undefined || filtersInput === null || filtersInput === '') {
		return undefined;
	}

	if (typeof filtersInput === 'string') {
		try {
			return JSON.parse(filtersInput);
		} catch (error) {
			throw new NodeOperationError(ctx.getNode(), 'Failed to parse filters JSON string', {
				itemIndex,
			});
		}
	}

	if (typeof filtersInput === 'object' && !Array.isArray(filtersInput)) {
		return filtersInput as IDataObject;
	}

	throw new NodeOperationError(ctx.getNode(), 'Filters must be a JSON object or JSON string', {
		itemIndex,
	});
}

function buildQueryParts(
	filters: IDataObject | undefined,
	ctx: IExecuteFunctions,
	itemIndex: number,
): {
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
					throw new NodeOperationError(ctx.getNode(), 'Invalid JSON supplied for filters.where', {
						itemIndex,
					});
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
	const valueFromInput = parseJsonInput(
		inputJson.data as IDataObject | string | undefined,
		'data',
		ctx,
		itemIndex,
	);
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
	if (
		key.startsWith('find ') ||
		key.startsWith('search ') ||
		key.startsWith('list ') ||
		key.startsWith('query ')
	)
		return 'getAll';
	if (key.startsWith('get ') || key.startsWith('read ') || key.startsWith('retrieve '))
		return 'get';
	if (
		key.startsWith('create ') ||
		key.startsWith('add ') ||
		key.startsWith('insert ') ||
		key.startsWith('make ')
	)
		return 'create';
	if (
		key.startsWith('update ') ||
		key.startsWith('modify ') ||
		key.startsWith('change ') ||
		key.startsWith('patch ')
	)
		return 'update';
	if (key.startsWith('delete ') || key.startsWith('remove ') || key.startsWith('destroy '))
		return 'delete';

	const mapped =
		OPERATION_ALIAS_MAP[key] ||
		(OPERATION_VALUES.find((op) => op.toLowerCase() === key) as ToolOperation | undefined);
	if (!mapped) {
		throw new NodeOperationError(ctx.getNode(), `Operation "${raw}" is not supported`, {
			itemIndex,
		});
	}
	return mapped;
}

function extractOperationsFromInput(
	inputJson: IDataObject,
	allowed: Set<ToolOperation>,
	ctx: IExecuteFunctions,
	itemIndex: number,
): ToolOperation[] | undefined {
	let raw =
		inputJson.operations ??
		inputJson.Operations ??
		(inputJson.operation as IDataObject | string | string[] | undefined);
	if (raw === undefined || raw === null || raw === '') return undefined;

	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (!trimmed) return undefined;
		try {
			raw = JSON.parse(trimmed);
		} catch {
			raw = trimmed;
		}
	}

	const collected: ToolOperation[] = [];
	const addOperation = (value: string) => {
		const op = mapOperationName(value, ctx, itemIndex);
		if (!allowed.has(op)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`Operation "${op}" is not enabled on this EspoCRM Tool node. Allowed operations: ${Array.from(allowed).join(', ')}`,
				{ itemIndex },
			);
		}
		if (!collected.includes(op)) {
			collected.push(op);
		}
	};

	if (Array.isArray(raw)) {
		raw.forEach((entry) => {
			if (typeof entry === 'string') addOperation(entry);
		});
	} else if (typeof raw === 'object') {
		const obj = raw as IDataObject;
		const opName = (obj.operation || obj.op || obj.type || obj.name) as string | undefined;
		if (opName) addOperation(opName);
		if (obj.where && inputJson.filters === undefined) {
			inputJson.filters = { where: obj.where } as IDataObject;
		}
		if (obj.filters && inputJson.filters === undefined) {
			inputJson.filters = obj.filters as IDataObject;
		}
		if (obj.data && inputJson.data === undefined) {
			inputJson.data = obj.data as IDataObject | string;
		}
		if (obj.returnAll !== undefined && inputJson.returnAll === undefined) {
			inputJson.returnAll = obj.returnAll as boolean;
		}
		if (obj.limit !== undefined && inputJson.limit === undefined) {
			inputJson.limit = obj.limit as number;
		}
	} else if (typeof raw === 'string') {
		addOperation(raw);
	} else {
		return undefined;
	}

	return collected.length > 0 ? collected : undefined;
}

export class EspoCRMTool implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'EspoCRM Tool',
		name: 'espoCrmTool',
		icon: 'file:espocrm.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: 'Interact with EspoCRM records',
		description:
			'Create, read, update, and delete records in EspoCRM. Use this tool to manage entities like Accounts, Contacts, Leads, and Cases.',
		defaults: {
			name: 'EspoCRM Tool',
		},
		inputs: ['main'],
		outputs: ['main'],
		documentationUrl: 'https://docs.espocrm.com/development/api/',
		credentials: [
			{
				name: 'espoCRMApi',
				required: true,
				testedBy: 'testEspoConnection',
			},
		],
		properties: [
			{
				displayName: 'Entity Type Name or ID',
				name: 'entityType',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getEntityTypes',
				},
				default: '',
				description:
					'The EspoCRM entity type (e.g., Account, Contact, Lead). Choose from the list, or leave empty to let the AI determine it. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Operations',
				name: 'operations',
				type: 'multiOptions',
				options: [
					{ name: 'Get Record', value: 'get' },
					{ name: 'Get Many', value: 'getAll' },
					{ name: 'Create Record', value: 'create' },
					{ name: 'Update Record', value: 'update' },
					{ name: 'Delete Record', value: 'delete' },
				],
				default: ['get'],
				description:
					'The operations to perform. When multiple operations are selected, only operations with their required parameters filled will be executed. Operations missing required parameters will be skipped.',
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
				description: 'The data object with fields to create or update',
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
				description: 'Filters to apply to the search (EspoCRM where clause)',
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
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						operations: ['getAll'],
						returnAll: [false],
					},
				},
				description: 'Max number of results to return',
			},
		],
	};

	methods = {
		loadOptions: {
			async getEntityTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await espoApiRequest.call(this, 'GET', 'Metadata');
				const scopes = response.scopes as IDataObject;
				const returnData: INodePropertyOptions[] = [];

				for (const [key, value] of Object.entries(scopes)) {
					const scopeData = value as IDataObject;
					if (scopeData.object && !scopeData.disabled) {
						returnData.push({
							name: key,
							value: key,
						});
					}
				}

				returnData.sort((a, b) => {
					if (a.name < b.name) {
						return -1;
					}
					if (a.name > b.name) {
						return 1;
					}
					return 0;
				});

				return returnData;
			},
		},
		credentialTest: {
			testEspoConnection,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const inputJson = items[i].json as IDataObject;
				const entityTypeParam = (this.getNodeParameter('entityType', i) as string).trim();
				const entityType = ((inputJson.entityType as string) || entityTypeParam).trim();
				const configuredOperationsRaw = this.getNodeParameter('operations', i);
				// Safeguard: Ensure configuredOperations is an array, even if n8n returns a string (e.g. from AI input mapping)
				const configuredOperations = (
					Array.isArray(configuredOperationsRaw)
						? configuredOperationsRaw
						: [configuredOperationsRaw]
				) as ToolOperation[];
				const allowedOperations = new Set(configuredOperations);
				const operationsOverride = extractOperationsFromInput(
					inputJson,
					allowedOperations,
					this,
					i,
				);
				const operations =
					operationsOverride && operationsOverride.length > 0
						? operationsOverride
						: configuredOperations;

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

				// Execute all selected operations for this item
				const results: any[] = [];

				for (const operation of operations) {
					let result: any;

					try {
						switch (operation) {
							case 'get': {
								const fallbackRecordId = this.getNodeParameter('recordId', i, '') as string;
								const recordIdRaw = inputJson.recordId ?? inputJson.id ?? fallbackRecordId;
								const recordId =
									recordIdRaw === undefined || recordIdRaw === null ? '' : `${recordIdRaw}`.trim();

								// Skip this operation if recordId is not provided (when multiple operations selected)
								if (!recordId) {
									if (operations.length === 1) {
										throw new NodeOperationError(
											this.getNode(),
											'recordId is required for get operations',
											{ itemIndex: i },
										);
									}
									continue; // Skip this operation
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
								result = await espoApiRequest.call(
									this,
									'GET',
									`${endpoint}/${encodeId(recordId)}`,
								);
								break;
							}

							case 'delete': {
								const fallbackRecordId = this.getNodeParameter('recordId', i, '') as string;
								const recordIdRaw = inputJson.recordId ?? inputJson.id ?? fallbackRecordId;
								const recordId =
									recordIdRaw === undefined || recordIdRaw === null ? '' : `${recordIdRaw}`.trim();

								// Skip this operation if recordId is not provided (when multiple operations selected)
								if (!recordId) {
									if (operations.length === 1) {
										throw new NodeOperationError(
											this.getNode(),
											'recordId is required for delete operations',
											{ itemIndex: i },
										);
									}
									continue; // Skip this operation
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
								const fallbackRecordId = this.getNodeParameter('recordId', i, '') as string;
								const recordIdRaw = inputJson.recordId ?? inputJson.id ?? fallbackRecordId;
								const recordId =
									recordIdRaw === undefined || recordIdRaw === null ? '' : `${recordIdRaw}`.trim();

								// Skip this operation if recordId is not provided (when multiple operations selected)
								if (!recordId) {
									if (operations.length === 1) {
										throw new NodeOperationError(
											this.getNode(),
											'recordId is required for update operations',
											{ itemIndex: i },
										);
									}
									continue; // Skip this operation
								}

								if (!/^[a-zA-Z0-9_-]+$/.test(recordId)) {
									throw new NodeOperationError(
										this.getNode(),
										`Invalid recordId: "${recordId}". Record ID must contain only letters, numbers, underscores, or hyphens.`,
										{ itemIndex: i },
									);
								}

								const fallbackData = this.getNodeParameter('data', i, undefined) as
									| IDataObject
									| string
									| undefined;
								const parsedData = buildDataPayload(inputJson, this, i, fallbackData);

								// Skip this operation if data is not provided (when multiple operations selected)
								if (!parsedData || Object.keys(parsedData).length === 0) {
									if (operations.length === 1) {
										throw new NodeOperationError(
											this.getNode(),
											'Provide a data object with fields to update',
											{ itemIndex: i },
										);
									}
									continue; // Skip this operation
								}

								const encodeId = (value: string) => encodeURIComponent(value);
								result = await espoApiRequest.call(
									this,
									'PATCH',
									`${endpoint}/${encodeId(recordId)}`,
									parsedData as IDataObject,
								);
								break;
							}

							case 'create': {
								const fallbackData = this.getNodeParameter('data', i, undefined) as
									| IDataObject
									| string
									| undefined;
								const parsedData = buildDataPayload(inputJson, this, i, fallbackData);

								// Skip this operation if data is not provided (when multiple operations selected)
								if (!parsedData || Object.keys(parsedData).length === 0) {
									if (operations.length === 1) {
										throw new NodeOperationError(
											this.getNode(),
											'Provide a data object with fields to create',
											{ itemIndex: i },
										);
									}
									continue; // Skip this operation
								}

								result = await espoApiRequest.call(
									this,
									'POST',
									endpoint,
									parsedData as IDataObject,
								);
								break;
							}

							case 'getAll': {
								const fallbackFilters = this.getNodeParameter('filters', i, undefined) as
									| IDataObject
									| string
									| undefined;
								const filtersSource =
									inputJson.filters ??
									(inputJson.where ? { where: inputJson.where } : undefined) ??
									fallbackFilters;
								const parsedFiltersInput = parseJsonInput(
									filtersSource as IDataObject | string | undefined,
									'filters',
									this,
									i,
								);
								const parsedFilters = normalizeFilters(parsedFiltersInput, this, i);
								const { qs, headers } = buildQueryParts(parsedFilters, this, i);

								const returnAllInput = inputJson.returnAll ?? inputJson.all;
								const returnAll =
									typeof returnAllInput === 'boolean'
										? returnAllInput
										: (this.getNodeParameter('returnAll', i, false) as boolean);
								const limitInput =
									inputJson.limit ?? inputJson.maxSize ?? this.getNodeParameter('limit', i, 50);
								let limit = Number(limitInput);
								if (!Number.isFinite(limit) || limit < 1) limit = 1;
								if (returnAll) {
									const items = await espoApiRequestAllItems.call(this, 'GET', endpoint, {}, qs);
									result = items;
								} else {
									const cappedLimit = Math.max(1, Math.min(limit, 500));
									qs.maxSize = cappedLimit;
									const response = await espoApiRequest.call(
										this,
										'GET',
										endpoint,
										{},
										qs,
										undefined,
										headers,
									);
									if (Array.isArray((response as IDataObject).list)) {
										result = (response as IDataObject).list;
									} else {
										result = response;
									}
								}
								break;
							}

							default:
								throw new NodeOperationError(
									this.getNode(),
									`Operation "${operation}" is not supported`,
									{ itemIndex: i },
								);
						}

						results.push({
							operation,
							result: typeof result === 'string' ? { result } : result,
						});
					} catch (operationError: any) {
						// If only one operation selected, throw the error
						// If multiple operations selected, collect the error and continue
						if (operations.length === 1) {
							throw operationError;
						}
						results.push({
							operation,
							result: { error: operationError.message },
						});
					}
				}

				// If only one operation was selected, return the result directly for backward compatibility
				// If multiple operations were selected, return an array with all results
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
