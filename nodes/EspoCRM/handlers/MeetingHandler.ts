import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { EntityHandler } from './EntityHandler';
import { espoApiRequest, espoApiRequestAllItems } from '../GenericFunctions';
import { toEspoDate, toEspoDateTime } from './Utils';

/**
 * Class for handling Meeting entity operations
 */
export class MeetingHandler implements EntityHandler {
  /**
   * Handle the create operation for Meeting
   */
  async create(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const entityData: IDataObject = {};

  entityData.name = this.getNodeParameter('name', index) as string;
  entityData.dateStart = this.getNodeParameter('dateStart', index) as string;

    const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;
    Object.assign(entityData, additionalFields);

    // Normalize date fields
    if (entityData.dateStart) {
      const ds = toEspoDateTime(entityData.dateStart as string);
      entityData.dateStart = ds;
      entityData.dateStartDate = toEspoDate(ds);
    }
    if (entityData.dateEnd) {
      const de = toEspoDateTime(entityData.dateEnd as string);
      entityData.dateEnd = de;
      entityData.dateEndDate = toEspoDate(de);
    }

    const endpoint = '/meeting';
    const responseData = await espoApiRequest.call(this, 'POST', endpoint, entityData);
    return responseData as IDataObject;
  }

  /**
   * Handle the get operation for Meeting
   */
  async get(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('meetingId', index) as string;
    const endpoint = `/meeting/${id}`;
    const responseData = await espoApiRequest.call(this, 'GET', endpoint);
    return responseData as IDataObject;
  }

  /**
   * Handle the update operation for Meeting
   */
  async update(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('meetingId', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;
    if (updateFields.dateStart) {
      const ds = toEspoDateTime(updateFields.dateStart as string);
      updateFields.dateStart = ds;
      updateFields.dateStartDate = toEspoDate(ds);
    }
    if (updateFields.dateEnd) {
      const de = toEspoDateTime(updateFields.dateEnd as string);
      updateFields.dateEnd = de;
      updateFields.dateEndDate = toEspoDate(de);
    }
    const endpoint = `/meeting/${id}`;
    const responseData = await espoApiRequest.call(this, 'PATCH', endpoint, updateFields);
    return responseData as IDataObject;
  }

  /**
   * Handle the delete operation for Meeting
   */
  async delete(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('meetingId', index) as string;
    const endpoint = `/meeting/${id}`;
    await espoApiRequest.call(this, 'DELETE', endpoint);
    return { success: true, entityType: 'meeting', id, message: 'Meeting deleted successfully' };
  }

  /**
   * Handle the getAll operation for Meeting
   */
  async getAll(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const endpoint = '/meeting';
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
