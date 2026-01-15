import {IDataObject, IExecuteFunctions, NodeOperationError} from 'n8n-workflow';
import {EntityHandler} from './EntityHandler';
import {espoApiRequest, espoApiRequestAllItems} from '../GenericFunctions';

export class AttachmentHandler implements EntityHandler {
  async create(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    // This method handles the "upload" operation
    const inputSource = (this.getNodeParameter('inputSource', index, 'binaryField') as string);
    const role = (this.getNodeParameter('role', index) as string) || 'Attachment';
    const relatedType = (this.getNodeParameter('relatedType', index) as string) || 'Document';
    const field = (this.getNodeParameter('field', index) as string) || 'file';
    const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

    // Helper function to guess MIME type from file extension
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
        case 'webp': return 'image/webp';
        case 'svg': return 'image/svg+xml';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls': return 'application/vnd.ms-excel';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'ppt': return 'application/vnd.ms-powerpoint';
        case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case 'zip': return 'application/zip';
        case 'rar': return 'application/x-rar-compressed';
        case 'tar': return 'application/x-tar';
        case 'gz': return 'application/gzip';
        case 'mp3': return 'audio/mpeg';
        case 'mp4': return 'video/mp4';
        case 'wav': return 'audio/wav';
        case 'html': return 'text/html';
        case 'xml': return 'application/xml';
        default: return undefined;
      }
    };

    let base64Data: string;
    let fileName: string;
    let mimeType: string;
    let fileSize: number;

    if (inputSource === 'base64Direct') {
      // Direct base64 input
      base64Data = this.getNodeParameter('base64Data', index) as string;
      fileName = this.getNodeParameter('fileName', index) as string;
      const providedMimeType = this.getNodeParameter('mimeType', index, '') as string;

      // Validate base64 data
      if (!base64Data || base64Data.trim() === '') {
        throw new NodeOperationError(this.getNode(), 'Base64 data is required');
      }

      // Validate file name
      if (!fileName || fileName.trim() === '') {
        throw new NodeOperationError(this.getNode(), 'File name is required');
      }

      // Strip data URI prefix if accidentally included
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',').pop() || base64Data;
      }

      // Remove any whitespace/newlines from base64
      base64Data = base64Data.replace(/\s/g, '');

      // Validate base64 format (basic check)
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
        throw new NodeOperationError(this.getNode(), 'Invalid base64 data format');
      }

      // Determine MIME type
      mimeType = providedMimeType || guessMimeByExt(fileName) || 'application/octet-stream';

      // Calculate size from base64
      fileSize = Math.floor((base64Data.length * 3) / 4);
      // Adjust for padding
      if (base64Data.endsWith('==')) {
        fileSize -= 2;
      } else if (base64Data.endsWith('=')) {
        fileSize -= 1;
      }

    } else {
      // Binary field input (existing behavior)
      const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index) as string;
      const item = this.getInputData()[index];

      if (!item.binary || !item.binary[binaryPropertyName]) {
        throw new NodeOperationError(this.getNode(), `No binary data property "${binaryPropertyName}" exists on item!`);
      }

      const binary = item.binary[binaryPropertyName];

      // Get the actual binary data buffer using n8n's helper method
      const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(index, binaryPropertyName);
      base64Data = binaryDataBuffer.toString('base64');

      // Get file name from binary metadata or additional fields
      fileName = binary.fileName || (additionalFields.name as string) || 'file';

      // Get MIME type from binary metadata, additional fields, or guess from extension
      mimeType = binary.mimeType || (additionalFields.type as string) || guessMimeByExt(fileName) || 'application/octet-stream';

      // Get size from binary metadata or calculate from buffer
      fileSize = typeof binary.fileSize !== 'undefined'
        ? Number(binary.fileSize)
        : binaryDataBuffer.length;
    }

    // Compose data URI
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    // Build request body
    const body: IDataObject = {
      role,
      relatedType,
      field,
      name: fileName,
      type: mimeType,
      file: dataUri,
      ...additionalFields,
    };

    if (!isNaN(fileSize)) {
      body.size = fileSize;
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
			qs.maxSize = this.getNodeParameter('limit', index, 50) as number;
  const response = await espoApiRequest.call(this, 'GET', '/Attachment', {}, qs);
      return response.list as IDataObject[];
    }
  }

  // Custom: Download operation - not part of EntityHandler interface, so handled in node execute routing or via getAll mapping
  async download(this: IExecuteFunctions, index: number): Promise<IDataObject> {
    throw new NodeOperationError(this.getNode(), 'Attachment download is temporarily disabled');
  }
}
