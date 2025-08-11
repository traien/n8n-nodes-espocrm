import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { EntityHandler } from './EntityHandler';
import { espoApiRequest, espoApiRequestAllItems } from '../GenericFunctions';
import { processAddressFields } from './Utils';

/**
 * Class for handling Account entity operations
 */
export class AccountHandler implements EntityHandler {
  /**
   * Handle the create operation for Account
   */
  async create(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    // Build account data
    const entityData: IDataObject = {};
    entityData.name = this.getNodeParameter('name', index) as string;
    
    // Add additional fields if provided
    const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;
    Object.assign(entityData, additionalFields);
    
    // Process billing address data if provided
    if (additionalFields.billingAddress) {
      const address = (additionalFields.billingAddress as IDataObject).details as IDataObject;
      Object.assign(entityData, processAddressFields('billingAddress', address));
      delete entityData.billingAddress;
    }
    
    // Process shipping address data if provided
    if (additionalFields.shippingAddress) {
      const address = (additionalFields.shippingAddress as IDataObject).details as IDataObject;
      Object.assign(entityData, processAddressFields('shippingAddress', address));
      delete entityData.shippingAddress;
    }
    
    // Execute API request
    const endpoint = '/account';
    const responseData = await espoApiRequest.call(this, 'POST', endpoint, entityData);
    return responseData as IDataObject;
  }

  /**
   * Handle the get operation for Account
   */
  async get(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const accountId = this.getNodeParameter('accountId', index) as string;
    const endpoint = `/account/${accountId}`;
    const responseData = await espoApiRequest.call(this, 'GET', endpoint);
    return responseData as IDataObject;
  }

  /**
   * Handle the update operation for Account
   */
  async update(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const accountId = this.getNodeParameter('accountId', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;
    const entityData = { ...updateFields };
    
    // Process billing address data if provided
    if (updateFields.billingAddress) {
      const address = (updateFields.billingAddress as IDataObject).details as IDataObject;
      Object.assign(entityData, processAddressFields('billingAddress', address));
      delete entityData.billingAddress;
    }
    
    // Process shipping address data if provided
    if (updateFields.shippingAddress) {
      const address = (updateFields.shippingAddress as IDataObject).details as IDataObject;
      Object.assign(entityData, processAddressFields('shippingAddress', address));
      delete entityData.shippingAddress;
    }
    
    const endpoint = `/account/${accountId}`;
    const responseData = await espoApiRequest.call(this, 'PATCH', endpoint, entityData);
    return responseData as IDataObject;
  }

  /**
   * Handle the delete operation for Account
   */
  async delete(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const accountId = this.getNodeParameter('accountId', index) as string;
    const endpoint = `/account/${accountId}`;
    await espoApiRequest.call(this, 'DELETE', endpoint);
    return { 
      success: true, 
      entityType: 'account', 
      id: accountId, 
      message: 'Account deleted successfully' 
    };
  }

  /**
   * Handle the getAll operation for Account
   */
  async getAll(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const endpoint = '/account';
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