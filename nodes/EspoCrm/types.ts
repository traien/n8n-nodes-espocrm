import { INodePropertyOptions } from 'n8n-workflow';

// Base resource interface
export interface EspoCRMResource {
	resource: string;
	operation: string;
}

// Common resource operations
export const operations = [
	{
		name: 'Create',
		value: 'create',
		description: 'Create a new record',
		action: 'Create a record',
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
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete a record',
		action: 'Delete a record',
	},
];

// Filter options for Get Many operation
export const getFilterOptions: INodePropertyOptions[] = [
	{
		name: 'Where (Filter Conditions)',
		value: 'where',
		description: 'Filter conditions for the query as defined in the EspoCRM API',
	},
	{
		name: 'Order By',
		value: 'orderBy',
		description: 'Field to sort results by',
	},
	{
		name: 'Order Direction',
		value: 'order',
		description: 'Direction to sort results by',
	},
	{
		name: 'Select Fields',
		value: 'select',
		description: 'Comma-separated list of fields to return',
	},
	{
		name: 'Offset',
		value: 'offset',
		description: 'Number of results to skip (for pagination)',
	},
	{
		name: 'Skip Total Count',
		value: 'skipTotalCount',
		description: 'Skip calculating total count for large datasets to improve performance',
	},
	{
		name: 'Boolean Filter List',
		value: 'boolFilterList',
		description: 'Comma-separated list of predefined boolean filters',
	},
	{
		name: 'Primary Filter',
		value: 'primaryFilter',
		description: 'Context-specific base filter to apply',
	},
];