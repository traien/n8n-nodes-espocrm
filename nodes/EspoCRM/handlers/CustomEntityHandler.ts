import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { EntityHandler } from './EntityHandler';
import { espoApiRequest, espoApiRequestAllItems } from '../GenericFunctions';

/**
 * Class for handling custom entity operations
 */
export class CustomEntityHandler implements EntityHandler {
  /**
   * Handle the create operation for custom entities
   */
  async create(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const entityType = this.getNodeParameter('entityType', index) as string;
    const entityData = JSON.parse(this.getNodeParameter('data', index) as string);
    
    // Execute API request
    const endpoint = `/${entityType}`;
    const responseData = await espoApiRequest.call(this, 'POST', endpoint, entityData);
    return responseData as IDataObject;
  }

  /**
   * Handle the get operation for custom entities
   */
  async get(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const entityType = this.getNodeParameter('entityType', index) as string;
    const recordId = this.getNodeParameter('id', index) as string;
    
    const endpoint = `/${entityType}/${recordId}`;
    const responseData = await espoApiRequest.call(this, 'GET', endpoint);
    return responseData as IDataObject;
  }

  /**
   * Handle the update operation for custom entities
   */
  async update(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const entityType = this.getNodeParameter('entityType', index) as string;
    const recordId = this.getNodeParameter('id', index) as string;
    const entityData = JSON.parse(this.getNodeParameter('data', index) as string);
    
    const endpoint = `/${entityType}/${recordId}`;
    const responseData = await espoApiRequest.call(this, 'PATCH', endpoint, entityData);
    return responseData as IDataObject;
  }

  /**
   * Handle the delete operation for custom entities
   */
  async delete(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const entityType = this.getNodeParameter('entityType', index) as string;
    const recordId = this.getNodeParameter('id', index) as string;
    
    const endpoint = `/${entityType}/${recordId}`;
    await espoApiRequest.call(this, 'DELETE', endpoint);
    return { 
      success: true, 
      entityType, 
      id: recordId, 
      message: `${entityType} deleted successfully` 
    };
  }

  /**
   * Handle the getAll operation for custom entities
   */
  async getAll(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
    const entityType = this.getNodeParameter('entityType', index) as string;
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const endpoint = `/${entityType}`;
    const qs: IDataObject = {};
    
    // Add filter options
    const filterOptions = this.getNodeParameter('filterOptions', index, {}) as IDataObject;
    
    if (filterOptions.where) {
      qs.where = filterOptions.where;
    }
    
    if (filterOptions.orderBy) {
      qs.orderBy = filterOptions.orderBy;
    }
    
    if (filterOptions.order) {
      qs.order = filterOptions.order;
    }
    
    if (filterOptions.select) {
      const selectValue = filterOptions.select as string;
      if (selectValue) {
        qs.select = selectValue.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    
    if (filterOptions.offset) {
      qs.offset = filterOptions.offset;
    }
    
    if (filterOptions.boolFilterList) {
      qs.boolFilterList = filterOptions.boolFilterList;
    }
    
    if (filterOptions.primaryFilter) {
      qs.primaryFilter = filterOptions.primaryFilter;
    }
    
    // Add header for skipping total count calculation for large datasets
    const headers: IDataObject = {};
    if (filterOptions.skipTotalCount === true) {
      headers['X-No-Total'] = 'true';
    }
    
    // Handle pagination
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