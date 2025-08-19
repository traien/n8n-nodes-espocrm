import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { EntityHandler } from './EntityHandler';
import { espoApiRequest, espoApiRequestAllItems } from '../GenericFunctions';

/**
 * Class for handling Case entity operations
 */
export class CaseHandler implements EntityHandler {
  async create(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const entityData: IDataObject = {};
    entityData.name = this.getNodeParameter('name', index) as string;

    const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;
    Object.assign(entityData, additionalFields);

    const endpoint = '/case';
    const responseData = await espoApiRequest.call(this, 'POST', endpoint, entityData);
    return responseData as IDataObject;
  }

  async get(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('caseId', index) as string;
    const endpoint = `/case/${id}`;
    const responseData = await espoApiRequest.call(this, 'GET', endpoint);
    return responseData as IDataObject;
  }

  async update(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('caseId', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;
    const endpoint = `/case/${id}`;
    const responseData = await espoApiRequest.call(this, 'PATCH', endpoint, updateFields);
    return responseData as IDataObject;
  }

  async delete(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('caseId', index) as string;
    const endpoint = `/case/${id}`;
    await espoApiRequest.call(this, 'DELETE', endpoint);
    return { success: true, entityType: 'case', id, message: 'Case deleted successfully' };
  }

  async getAll(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const endpoint = '/case';
    const qs: IDataObject = {};

    const filterOptions = this.getNodeParameter('filterOptions', index, {}) as IDataObject;

    if (filterOptions.where) {
      if (typeof filterOptions.where === 'string') {
        try {
          qs.where = JSON.parse(filterOptions.where);
        } catch (e: any) {
          throw new NodeOperationError(this.getNode(), `Invalid JSON in 'where' parameter: ${e.message}`);
        }
      } else {
        qs.where = filterOptions.where;
      }
    }

    if (filterOptions.orderBy) qs.orderBy = filterOptions.orderBy;
    if (filterOptions.order) qs.order = filterOptions.order;
    if (filterOptions.select) qs.select = filterOptions.select;
    if (filterOptions.offset) qs.offset = filterOptions.offset;
    if (filterOptions.boolFilterList) qs.boolFilterList = filterOptions.boolFilterList;
    if (filterOptions.primaryFilter) qs.primaryFilter = filterOptions.primaryFilter;

    const headers: IDataObject = {};
    if (filterOptions.skipTotalCount === true) headers['X-No-Total'] = 'true';

    if (returnAll === true) {
      return await espoApiRequestAllItems.call(this, 'GET', endpoint, {}, qs);
    } else {
      const limit = this.getNodeParameter('limit', index) as number;
      qs.maxSize = limit;
      const response = await espoApiRequest.call(this, 'GET', endpoint, {}, qs, undefined, headers);
      return response.list as IDataObject[];
    }
  }
}
