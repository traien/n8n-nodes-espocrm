import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { EntityHandler } from './EntityHandler';
import { espoApiRequest, espoApiRequestAllItems } from '../GenericFunctions';
import { toEspoDate } from './Utils';

export class DocumentHandler implements EntityHandler {
  async create(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const entityData: IDataObject = {};
    entityData.name = this.getNodeParameter('name', index) as string;
    entityData.fileId = this.getNodeParameter('fileId', index) as string;
    const publishDate = this.getNodeParameter('publishDate', index, '') as string;
    if (publishDate) entityData.publishDate = toEspoDate(publishDate);

    const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;
    Object.assign(entityData, additionalFields);

  const response = await espoApiRequest.call(this, 'POST', '/Document', entityData);
    return response as IDataObject;
  }

  async get(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('documentId', index) as string;
  const response = await espoApiRequest.call(this, 'GET', `/Document/${id}`);
    return response as IDataObject;
  }

  async update(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('documentId', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;
    if (updateFields.publishDate) updateFields.publishDate = toEspoDate(updateFields.publishDate as string);
  const response = await espoApiRequest.call(this, 'PATCH', `/Document/${id}`, updateFields);
    return response as IDataObject;
  }

  async delete(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('documentId', index) as string;
  await espoApiRequest.call(this, 'DELETE', `/Document/${id}`);
    return { success: true, entityType: 'document', id } as IDataObject;
  }

  async getAll(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const qs: IDataObject = {};
    const filterOptions = this.getNodeParameter('filterOptions', index, {}) as IDataObject;

    if (filterOptions.where) {
      if (typeof filterOptions.where === 'string') {
        try { qs.where = JSON.parse(filterOptions.where); } catch (e: any) { throw new NodeOperationError(this.getNode(), `Invalid JSON in 'where' parameter: ${e.message}`); }
      } else { qs.where = filterOptions.where; }
    }
    if (filterOptions.orderBy) qs.orderBy = filterOptions.orderBy;
    if (filterOptions.order) qs.order = filterOptions.order;
    if (filterOptions.select) qs.select = filterOptions.select;
    if (filterOptions.offset) qs.offset = filterOptions.offset;
    if (filterOptions.boolFilterList) qs.boolFilterList = filterOptions.boolFilterList;
    if (filterOptions.primaryFilter) qs.primaryFilter = filterOptions.primaryFilter;

    if (returnAll) {
  return await espoApiRequestAllItems.call(this, 'GET', '/Document', {}, qs);
    } else {
      const limit = this.getNodeParameter('limit', index) as number;
      qs.maxSize = limit;
  const response = await espoApiRequest.call(this, 'GET', '/Document', {}, qs);
      return response.list as IDataObject[];
    }
  }
}
