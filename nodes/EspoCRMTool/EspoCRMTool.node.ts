import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

import {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	NodeConnectionTypes,
	NodeOperationError,
	nodeNameToToolName,
	SupplyData,
} from 'n8n-workflow';

import { espoApiRequest, espoApiRequestAllItems } from '../EspoCRM/GenericFunctions';

const OPERATION_VALUES = ['get', 'getAll', 'create', 'update', 'delete'] as const;
type ToolOperation = (typeof OPERATION_VALUES)[number];

const toolInputSchema = z.object({
	entityType: z.string().min(1, 'entityType is required'),
	operation: z.enum(OPERATION_VALUES),
	recordId: z.string().optional(),
	data: z
		.string()
		.describe('JSON object encoded as a string (e.g. "{\\"name\\":\\"Acme\\"}")')
		.optional(),
	filters: z
		.string()
		.describe('JSON object or EspoCRM "where" array encoded as a string')
		.optional(),
	returnAll: z.boolean().optional(),
	limit: z.number().min(1).optional(),
});

function parseJsonInput(
	value: string | IDataObject | undefined,
	fieldName: string,
	ctx: ISupplyDataFunctions,
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
		);
	}
}

const MAX_LIMIT_CAP = 500;

function parseEntityList(raw: string): string[] {
	return raw
		.split(/[\n,]/)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

function toJsonString(payload: unknown): string {
	if (typeof payload === 'string') {
		return payload;
	}

	return JSON.stringify(payload, null, 2);
}

function normalizeFilters(filtersInput: unknown, ctx: ISupplyDataFunctions): IDataObject | undefined {
	if (filtersInput === undefined || filtersInput === null || filtersInput === '') {
		return undefined;
	}

	if (typeof filtersInput === 'string') {
		try {
			return JSON.parse(filtersInput);
		} catch (error) {
			throw new NodeOperationError(ctx.getNode(), 'Failed to parse filters JSON string');
		}
	}

	if (typeof filtersInput === 'object' && !Array.isArray(filtersInput)) {
		return filtersInput as IDataObject;
	}

	throw new NodeOperationError(ctx.getNode(), 'Filters must be a JSON object or JSON string');
}

function buildQueryParts(filters: IDataObject | undefined, ctx: ISupplyDataFunctions): {
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
					throw new NodeOperationError(ctx.getNode(), "Invalid JSON supplied for filters.where");
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
		subtitle: 'Expose EspoCRM to AI agents',
		description: 'Expose EspoCRM REST operations as an AI tool',
		defaults: {
			name: 'EspoCRM Tool',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiTool],
		outputNames: ['Tool'],
		documentationUrl: 'https://docs.espocrm.com/development/api/',
		credentials: [
			{
				name: 'espoCRMApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Connection',
				name: 'connectionNotice',
				type: 'notice',
				default: '',
				description:
					'Connect this node to the Tools input of an AI Agent node to make EspoCRM actions available during reasoning.',
			},
			{
				displayName: 'Tool Description',
				name: 'toolDescription',
				type: 'string',
				default:
					'Use this tool to create, read, update, delete and search EspoCRM entities via their REST API. Always provide the entityType and any field names exactly as EspoCRM expects.',
				typeOptions: {
					rows: 3,
				},
				description: 'Short instructions shown to the agent explaining when to prefer this tool',
			},
			{
				displayName: 'Allowed Operations',
				name: 'allowedOperations',
				type: 'multiOptions',
				options: [
					{ name: 'Get Record', value: 'get' },
					{ name: 'List/Search Records', value: 'getAll' },
					{ name: 'Create Record', value: 'create' },
					{ name: 'Update Record', value: 'update' },
					{ name: 'Delete Record', value: 'delete' },
				],
				default: ['get', 'getAll', 'create', 'update', 'delete'],
				description: 'Limit which EspoCRM actions the tool will accept at runtime',
			},
			{
				displayName: 'Entity Type Hints',
				name: 'allowedEntityTypes',
				type: 'string',
				default: 'Account,Contact,Lead,Opportunity,Case,Task,Meeting,Call,Document',
				description:
					'Comma or newline separated list of entity types the agent should focus on (e.g. Account,Contact). Leave blank to allow any entity type.',
				typeOptions: {
					rows: 2,
				},
			},
			{
				displayName: 'Strictly Enforce Entity List',
				name: 'enforceEntityList',
				type: 'boolean',
				default: false,
				description: 'When enabled the tool will reject requests for entity types not listed above',
			},
			{
				displayName: 'Default Limit',
				name: 'defaultLimit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
					maxValue: MAX_LIMIT_CAP,
				},
				description: 'Used when the agent does not supply a limit for list/search operations',
			},
			{
				displayName: 'Maximum Limit',
				name: 'maxLimit',
				type: 'number',
				default: 200,
				typeOptions: {
					minValue: 1,
					maxValue: MAX_LIMIT_CAP,
				},
				description: 'Hard cap applied to the limit requested by the agent to protect the Espo instance',
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const node = this.getNode();
		const toolName = nodeNameToToolName(node);

		const toolDescription = this.getNodeParameter('toolDescription', itemIndex, '') as string;
		const allowedOperations = this.getNodeParameter('allowedOperations', itemIndex, OPERATION_VALUES) as ToolOperation[];
		const entityTypeHints = parseEntityList(
			this.getNodeParameter('allowedEntityTypes', itemIndex, '') as string,
		);
		const enforceEntityList = this.getNodeParameter('enforceEntityList', itemIndex, false) as boolean;
		const defaultLimit = this.getNodeParameter('defaultLimit', itemIndex, 50) as number;
		const maxLimit = this.getNodeParameter('maxLimit', itemIndex, 200) as number;

		const sanitizedDefaultLimit = Math.max(1, Math.min(defaultLimit, MAX_LIMIT_CAP, maxLimit));
		const sanitizedMaxLimit = Math.max(1, Math.min(maxLimit, MAX_LIMIT_CAP));

		const descriptionParts = [toolDescription.trim()].filter(Boolean);
		descriptionParts.push(`Allowed operations: ${allowedOperations.join(', ')}.`);
		if (entityTypeHints.length) {
			descriptionParts.push(`Preferred entity types: ${entityTypeHints.join(', ')}.`);
		}
		descriptionParts.push(
			'Supply entityType, operation, and optional data/filters. Use recordId for single-record actions. Filters should follow EspoCRM "where" syntax and can be passed as JSON arrays.',
		);
		descriptionParts.push(
			`List/search requests default to limit ${sanitizedDefaultLimit} and are capped at ${sanitizedMaxLimit}. Set returnAll=true to stream through full pagination when necessary.`,
		);

		const description = descriptionParts.join(' ');
		const allowedOperationSet = new Set<ToolOperation>(allowedOperations);
		const entityHintSet = new Set(entityTypeHints.map((value) => value.toLowerCase()));

		const ctx = this;

		const tool = new DynamicStructuredTool({
			name: toolName,
			description,
			schema: toolInputSchema,
			func: async (input: z.infer<typeof toolInputSchema>) => {
				const { entityType: rawEntityType, operation, recordId, data, filters, returnAll, limit } = input;
				ctx.logger.debug(`[EspoCRM Tool] incoming input: ${JSON.stringify(input)}`);
				const entityType = rawEntityType?.trim();

				if (!entityType) {
					throw new NodeOperationError(ctx.getNode(), 'entityType is required');
				}

				if (!allowedOperationSet.has(operation as ToolOperation)) {
					throw new NodeOperationError(ctx.getNode(), `Operation "${operation}" is disabled for this tool`);
				}

				if (enforceEntityList && entityHintSet.size > 0 && !entityHintSet.has(entityType.toLowerCase())) {
					throw new NodeOperationError(
						ctx.getNode(),
						`Entity type "${entityType}" is not permitted. Allowed entity types: ${entityTypeHints.join(', ')}`,
					);
				}

				const parsedData = parseJsonInput(data, 'data', ctx);
				const parsedFiltersInput = parseJsonInput(filters, 'filters', ctx);
				const encodedEntityType = encodeURIComponent(entityType);
				const endpoint = `/${encodedEntityType}`;
				const encodeId = (value: string) => encodeURIComponent(value);

				ctx.logger.debug(
					`[EspoCRM Tool] op=${operation} entity=${entityType} encodedEntity=${encodedEntityType} recordId=${recordId ?? 'n/a'} returnAll=${returnAll ?? false} limit=${limit ?? 'n/a'} endpoint=${endpoint}`,
				);
				ctx.logger.debug(
					`[EspoCRM Tool] filters=${parsedFiltersInput ? JSON.stringify(parsedFiltersInput).slice(0, 500) : 'none'} data=${parsedData ? JSON.stringify(parsedData).slice(0, 500) : 'none'}`,
				);
				const parsedFilters = normalizeFilters(parsedFiltersInput, ctx);
				const { qs, headers } = buildQueryParts(parsedFilters, ctx);

				switch (operation as ToolOperation) {
					case 'get': {
						if (!recordId) {
							throw new NodeOperationError(ctx.getNode(), 'recordId is required for get operations');
						}
						const response = await espoApiRequest.call(ctx, 'GET', `${endpoint}/${encodeId(recordId)}`);
						return toJsonString(response);
					}
					case 'delete': {
						if (!recordId) {
							throw new NodeOperationError(ctx.getNode(), 'recordId is required for delete operations');
						}
						await espoApiRequest.call(ctx, 'DELETE', `${endpoint}/${encodeId(recordId)}`);
						return toJsonString({ success: true, entityType, id: recordId });
					}
					case 'update': {
						if (!recordId) {
							throw new NodeOperationError(ctx.getNode(), 'recordId is required for update operations');
						}
						if (!parsedData || Object.keys(parsedData).length === 0) {
							throw new NodeOperationError(ctx.getNode(), 'Provide a data object with fields to update');
						}
						const response = await espoApiRequest.call(ctx, 'PATCH', `${endpoint}/${encodeId(recordId)}`, parsedData as IDataObject);
						return toJsonString(response);
					}
					case 'create': {
						if (!parsedData || Object.keys(parsedData).length === 0) {
							throw new NodeOperationError(ctx.getNode(), 'Provide a data object with fields to create');
						}
						const response = await espoApiRequest.call(ctx, 'POST', endpoint, parsedData as IDataObject);
						return toJsonString(response);
					}
					case 'getAll': {
						const shouldReturnAll = returnAll === true;
						if (shouldReturnAll) {
							const items = await espoApiRequestAllItems.call(ctx, 'GET', endpoint, {}, qs);
							return toJsonString(items);
						}

						const cappedLimit = Math.max(
							1,
							Math.min(limit ?? sanitizedDefaultLimit, sanitizedMaxLimit, MAX_LIMIT_CAP),
						);
						qs.maxSize = cappedLimit;
						const response = await espoApiRequest.call(ctx, 'GET', endpoint, {}, qs, undefined, headers);
						if (Array.isArray((response as IDataObject).list)) {
							return toJsonString((response as IDataObject).list);
						}
						return toJsonString(response);
					}
					default:
						throw new NodeOperationError(ctx.getNode(), `Operation "${operation}" is not supported`);
				}
			},
		});

		return {
			response: tool,
			metadata: {
				allowedOperations,
				entityTypes: entityTypeHints,
			},
		};
	}
}
