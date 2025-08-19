import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { EntityHandler } from './EntityHandler';
import { espoApiRequest, espoApiRequestAllItems } from '../GenericFunctions';
import { toEspoDate, toEspoDateTime } from './Utils';

/**
 * Class for handling Task entity operations
 */
export class TaskHandler implements EntityHandler {
  async create(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const entityData: IDataObject = {};
    entityData.name = this.getNodeParameter('name', index) as string;

    const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;
    Object.assign(entityData, additionalFields);

    // Normalize date fields to EspoCRM expected formats
    if (entityData.dateStart) {
      const ds = toEspoDateTime(entityData.dateStart as string);
      entityData.dateStart = ds;
      // Provide date-only companion if backend expects it
      entityData.dateStartDate = toEspoDate(ds);
    }
    if (entityData.dateEnd) {
      const de = toEspoDateTime(entityData.dateEnd as string);
      entityData.dateEnd = de;
      entityData.dateEndDate = toEspoDate(de);
    }

    const endpoint = '/task';
    const responseData = await espoApiRequest.call(this, 'POST', endpoint, entityData);
    return responseData as IDataObject;
  }

  async get(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('taskId', index) as string;
    const endpoint = `/task/${id}`;
    const responseData = await espoApiRequest.call(this, 'GET', endpoint);
    return responseData as IDataObject;
  }

  async update(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('taskId', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;
    // Normalize date fields if present
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
    const endpoint = `/task/${id}`;
    const responseData = await espoApiRequest.call(this, 'PATCH', endpoint, updateFields);
    return responseData as IDataObject;
  }

  async delete(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('taskId', index) as string;
    const endpoint = `/task/${id}`;
    await espoApiRequest.call(this, 'DELETE', endpoint);
    return { success: true, entityType: 'task', id, message: 'Task deleted successfully' };
  }

  async getAll(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const endpoint = '/task';
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
