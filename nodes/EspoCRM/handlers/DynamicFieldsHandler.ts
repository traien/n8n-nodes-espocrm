import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { EntityHandler } from './EntityHandler';
import { espoApiRequest, espoApiRequestAllItems } from '../GenericFunctions';
import { MetadataService } from '../services/MetadataService';

/**
 * Class for handling dynamicFields operations
 */
export class DynamicFieldsHandler implements EntityHandler {
	/**
	 * Handle dynamicFields create operation (Not applicable, placeholder)
	 */
	async create(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		throw new NodeOperationError(
			this.getNode(),
			'Create operation is not supported for Dynamic Fields resource',
		);
	}

	/**
	 * Handle dynamicFields get operation (Gets field metadata or entity fields/types depending on the operation)
	 */
	async get(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const operation = this.getNodeParameter('operation', index) as string;

		if (operation === 'getEntityFields') {
			const entityType = this.getNodeParameter('entityType', index) as string;
			const fieldDefs = await MetadataService.getFieldDefs.call(this, this, entityType);
			return fieldDefs;
		}

		if (operation === 'getFieldMetadata') {
			const entityType = this.getNodeParameter('entityType', index) as string;
			const fieldName = this.getNodeParameter('fieldName', index) as string;
			const fieldDefs = await MetadataService.getFieldDefs.call(this, this, entityType);
			const fieldDef = fieldDefs[fieldName] as IDataObject;
			if (!fieldDef) {
				throw new NodeOperationError(
					this.getNode(),
					`Field "${fieldName}" not found on entity type "${entityType}"`,
				);
			}
			return fieldDef;
		}

		throw new NodeOperationError(this.getNode(), `Unsupported get operation: ${operation}`);
	}

	/**
	 * Handle dynamicFields update operation (Not applicable, placeholder)
	 */
	async update(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		throw new NodeOperationError(
			this.getNode(),
			'Update operation is not supported for Dynamic Fields resource',
		);
	}

	/**
	 * Handle dynamicFields delete operation (Not applicable, placeholder)
	 */
	async delete(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		throw new NodeOperationError(
			this.getNode(),
			'Delete operation is not supported for Dynamic Fields resource',
		);
	}

	/**
	 * Handle dynamicFields getAll operation
	 */
	async getAll(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
		const operation = this.getNodeParameter('operation', index) as string;

		if (operation === 'getEntityTypes') {
			const entityTypes = await MetadataService.getEntityList.call(this, this);
			return entityTypes.map((type) => ({ name: type, value: type }));
		}

		if (operation === 'filterRecords') {
			const entityType = this.getNodeParameter('entityType', index) as string;
			const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;

			const where: IDataObject[] = [];
			const filterConditions = this.getNodeParameter('filterConditions', index, {}) as IDataObject;
			const conditions = filterConditions.conditions as IDataObject[];

			if (conditions) {
				for (const condition of conditions) {
					const field = condition.field as string;
					const operator = condition.operator as string;
					let value = condition.value;

					if (!field || !operator) continue;

					const condObj: IDataObject = {
						type: operator,
						field,
					};

					if (operator !== 'isEmpty' && operator !== 'isNotEmpty') {
						if ((operator === 'in' || operator === 'notIn') && typeof value === 'string') {
							condObj.value = value.split(',').map((s) => s.trim());
						} else {
							condObj.value = value;
						}
					}
					where.push(condObj);
				}
			}

			const endpoint = `/${entityType}`;
			const qs: IDataObject = { where };

			const options = this.getNodeParameter('options', index, {}) as IDataObject;

			if (options.orderBy) qs.orderBy = options.orderBy;
			if (options.order) qs.order = options.order;
			if (options.select) {
				if (Array.isArray(options.select)) {
					qs.select = options.select.join(',');
				} else {
					qs.select = options.select;
				}
			}
			if (options.offset) qs.offset = options.offset;

			const headers: IDataObject = {};
			if (options.skipTotalCount === true) {
				headers['X-No-Total'] = 'true';
			}

			if (returnAll === true) {
				return await espoApiRequestAllItems.call(this, 'GET', endpoint, {}, qs);
			} else {
				const limit = this.getNodeParameter('limit', index, 50) as number;
				qs.maxSize = limit;
				const response = await espoApiRequest.call(
					this,
					'GET',
					endpoint,
					{},
					qs,
					undefined,
					headers,
				);
				return response.list as IDataObject[];
			}
		}

		throw new NodeOperationError(this.getNode(), `Unsupported getAll operation: ${operation}`);
	}
}
