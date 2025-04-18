import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { EntityHandler } from './EntityHandler';
import { espoApiRequest, espoApiRequestAllItems } from '../GenericFunctions';
import { processAddressFields } from './Utils';

/**
 * Class for handling Lead entity operations
 */
export class LeadHandler implements EntityHandler {
  /**
   * Handle the create operation for Lead
   */
  async create(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    // Build lead data
    const entityData: IDataObject = {};
    entityData.firstName = this.getNodeParameter('firstName', index, '') as string;
    entityData.lastName = this.getNodeParameter('lastName', index) as string;
    entityData.status = this.getNodeParameter('status', index) as string;
    
    // Add additional fields if provided
    const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;
    Object.assign(entityData, additionalFields);
    
    // Process address data if provided
    if (additionalFields.address) {
      const address = (additionalFields.address as IDataObject).details as IDataObject;
      Object.assign(entityData, processAddressFields('address', address));
      delete entityData.address;
    }
    
    // Execute API request
    const endpoint = '/lead';
    const responseData = await espoApiRequest.call(this, 'POST', endpoint, entityData);
    return responseData as IDataObject;
  }

  /**
   * Handle the get operation for Lead
   */
  async get(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const leadId = this.getNodeParameter('leadId', index) as string;
    const endpoint = `/lead/${leadId}`;
    const responseData = await espoApiRequest.call(this, 'GET', endpoint);
    return responseData as IDataObject;
  }

  /**
   * Handle the update operation for Lead
   */
  async update(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const leadId = this.getNodeParameter('leadId', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;
    const entityData = { ...updateFields };
    
    // Process address data if provided
    if (updateFields.address) {
      const address = (updateFields.address as IDataObject).details as IDataObject;
      Object.assign(entityData, processAddressFields('address', address));
      delete entityData.address;
    }
    
    const endpoint = `/lead/${leadId}`;
    const responseData = await espoApiRequest.call(this, 'PATCH', endpoint, entityData);
    return responseData as IDataObject;
  }

  /**
   * Handle the delete operation for Lead
   */
  async delete(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const leadId = this.getNodeParameter('leadId', index) as string;
    const endpoint = `/lead/${leadId}`;
    await espoApiRequest.call(this, 'DELETE', endpoint);
    return { 
      success: true, 
      entityType: 'lead', 
      id: leadId, 
      message: 'Lead deleted successfully' 
    };
  }

  /**
   * Handle the getAll operation for Lead
   */
  async getAll(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const endpoint = '/lead';
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
      qs.select = filterOptions.select;
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