import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { EntityHandler } from './EntityHandler';
import { espoApiRequest, espoApiRequestAllItems } from '../GenericFunctions';

export class AttachmentHandler implements EntityHandler {
  async create(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    // This method will be used for "upload" operation mapped to create
    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index) as string;
    const item = this.getInputData()[index];
    if (!item.binary || !item.binary[binaryPropertyName]) {
      throw new NodeOperationError(this.getNode(), `No binary data property "${binaryPropertyName}" exists on item!`);
    }
    const binary = item.binary[binaryPropertyName];

    // Get the actual binary data buffer using n8n's helper method
    // binary.data is just an internal reference, not the actual data
    const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(index, binaryPropertyName);
    const base64Data = binaryDataBuffer.toString('base64');

    const role = (this.getNodeParameter('role', index) as string) || 'Attachment';
    const relatedType = (this.getNodeParameter('relatedType', index) as string) || 'Document';
    const field = (this.getNodeParameter('field', index) as string) || 'file';
    const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

    const nameFromBinary = binary.fileName || (additionalFields.name as string) || 'file';
    // Try to use binary mime, fallback to guess by extension, then default
    const guessMimeByExt = (fileName?: string): string | undefined => {
      if (!fileName) return undefined;
      const ext = fileName.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'txt': return 'text/plain';
        case 'csv': return 'text/csv';
        case 'json': return 'application/json';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'gif': return 'image/gif';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls': return 'application/vnd.ms-excel';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        default: return undefined;
      }
    };
    const typeFromBinary = binary.mimeType || (additionalFields.type as string) || guessMimeByExt(nameFromBinary) || 'application/octet-stream';
    // Get size from the actual buffer
    const sizeFromBinary = typeof binary.fileSize !== 'undefined'
      ? Number(binary.fileSize)
      : binaryDataBuffer.length;

    // Compose data: URI with the actual base64 data
    const dataUri = `data:${typeFromBinary};base64,${base64Data}`;

    const body: IDataObject = {
      role,
      relatedType,
      field,
      name: nameFromBinary,
      type: typeFromBinary,
      file: dataUri,
      ...additionalFields,
    };
    if (typeof sizeFromBinary === 'number' && !isNaN(sizeFromBinary)) {
      body.size = sizeFromBinary;
    }

  const response = await espoApiRequest.call(this, 'POST', '/Attachment', body);
    return response as IDataObject;
  }

  async get(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('attachmentId', index) as string;
  const response = await espoApiRequest.call(this, 'GET', `/Attachment/${id}`);
    return response as IDataObject;
  }

  async update(this: IExecuteFunctions, index: number): Promise<IDataObject> {
  // Read a parameter to avoid unused parameter warning
  void this.getNodeParameter('attachmentId', index, '');
  throw new NodeOperationError(this.getNode(), 'Update operation is not supported for Attachment');
  }

  async delete(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    const id = this.getNodeParameter('attachmentId', index) as string;
  await espoApiRequest.call(this, 'DELETE', `/Attachment/${id}`);
    return { success: true, entityType: 'attachment', id } as IDataObject;
  }

  async getAll(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
    // Not typically used for attachments but provide minimal implementation
    const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
    const qs: IDataObject = {};
    if (returnAll) {
  return await espoApiRequestAllItems.call(this, 'GET', '/Attachment', {}, qs);
    } else {
      const limit = this.getNodeParameter('limit', index, 50) as number;
      qs.maxSize = limit;
  const response = await espoApiRequest.call(this, 'GET', '/Attachment', {}, qs);
      return response.list as IDataObject[];
    }
  }

  // Custom: Download operation - not part of EntityHandler interface, so handled in node execute routing or via getAll mapping
  async download(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    throw new NodeOperationError(this.getNode(), 'Attachment download is temporarily disabled');
  }
}
