import { IExecuteFunctions, ILoadOptionsFunctions, IDataObject, INodePropertyOptions } from 'n8n-workflow';
import { espoApiRequest } from '../GenericFunctions';

// Creating a type that combines the common functionalities of both types
type IFunctions = IExecuteFunctions | ILoadOptionsFunctions;

/**
 * Service for handling EspoCrm metadata operations
 */
export class MetadataService {
  /**
   * Fetch entity metadata for a specific entity type
   */
  static async getEntityMetadata(
    execFunctions: IFunctions,
    entityType: string,
  ): Promise<IDataObject> {
    const endpoint = `/Metadata`;
    const responseData = await espoApiRequest.call(execFunctions, 'GET', endpoint);
    return responseData?.entityDefs?.[entityType] || {};
  }

  /**
   * Fetch all entity field definitions for a specific entity type
   */
  static async getFieldDefs(
    execFunctions: IFunctions,
    entityType: string,
  ): Promise<IDataObject> {
    const endpoint = `/Metadata`;
    const responseData = await espoApiRequest.call(execFunctions, 'GET', endpoint);
    return responseData?.entityDefs?.[entityType]?.fields || {};
  }

  /**
   * Get a list of all available entity types
   */
  static async getEntityList(
    execFunctions: IFunctions,
  ): Promise<string[]> {
    const endpoint = '/Metadata';
    const responseData = await espoApiRequest.call(execFunctions, 'GET', endpoint);
    return Object.keys(responseData?.entityDefs || {});
  }

  /**
   * Get complete entity definition including relationships, links, etc.
   */
  static async getEntityDefinition(
    execFunctions: IFunctions,
    entityType: string,
  ): Promise<IDataObject> {
    const endpoint = `/Metadata`;
    const responseData = await espoApiRequest.call(execFunctions, 'GET', endpoint);
    return responseData?.entityDefs?.[entityType] || {};
  }

  /**
   * Get entity relationships (links) for a specific entity type
   */
  static async getEntityLinks(
    execFunctions: IFunctions,
    entityType: string,
  ): Promise<IDataObject> {
    const endpoint = `/Metadata`;
    const responseData = await espoApiRequest.call(execFunctions, 'GET', endpoint);
    return responseData?.entityDefs?.[entityType]?.links || {};
  }

  /**
   * Get entity indexes for a specific entity type
   */
  static async getEntityIndexes(
    execFunctions: IFunctions,
    entityType: string,
  ): Promise<IDataObject> {
    const endpoint = `/Metadata`;
    const responseData = await espoApiRequest.call(execFunctions, 'GET', endpoint);
    return responseData?.entityDefs?.[entityType]?.indexes || {};
  }

  /**
   * Get entity's collection for a specific entity type
   */
  static async getEntityCollection(
    execFunctions: IFunctions,
    entityType: string,
  ): Promise<IDataObject> {
    const endpoint = `/Metadata`;
    const responseData = await espoApiRequest.call(execFunctions, 'GET', endpoint);
    return responseData?.entityDefs?.[entityType]?.collection || {};
  }

  /**
   * Convert EspoCrm field type to n8n field type
   */
  static mapFieldTypeToN8n(espoFieldType: string, fieldParams: IDataObject = {}): string {
    // Map EspoCrm field types to n8n field types
    switch (espoFieldType) {
      case 'varchar':
      case 'text':
      case 'url':
      case 'email':
      case 'phone':
      case 'personName':
      case 'foreign':
        return 'string';
      case 'int':
      case 'integer':
      case 'float':
      case 'currency':
      case 'currencyConverted':
        return 'number';
      case 'bool':
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'string';
      case 'datetime':
      case 'datetimeOptional':
        return 'dateTime';
      case 'enum':
      case 'multiEnum':
      case 'array':
      case 'checklist':
        return 'options';
      case 'jsonArray':
      case 'jsonObject':
        return 'json';
      case 'wysiwyg':
        return 'string';
      case 'file':
      case 'image':
      case 'attachment':
      case 'attachmentMultiple':
        return 'string';
      case 'link':
      case 'linkParent':
      case 'linkOne':
      case 'linkMultiple':
        return 'string';
      case 'password':
        return 'string';
      case 'autoincrement':
        return 'number';
      case 'barcode':
        return 'string';
      case 'map':
        return 'json';
      case 'rangeCurrency':
      case 'rangeFloat':
      case 'rangeInt':
        return 'json';
      default:
        return 'string';
    }
  }

  /**
   * Generate n8n field options from EspoCrm field metadata
   */
  static generateFieldOptions(
    fieldDefs: IDataObject,
    fieldName: string,
  ): INodePropertyOptions[] {
    const fieldDef = fieldDefs[fieldName] as IDataObject;

    if (fieldDef) {
      // Handle enum fields
      if (fieldDef.type === 'enum' && fieldDef.options) {
        const options = fieldDef.options as string[];
        return options.map((option) => ({
          name: option,
          value: option,
        }));
      }

      // Handle multiEnum fields
      if (fieldDef.type === 'multiEnum' && fieldDef.options) {
        const options = fieldDef.options as string[];
        return options.map((option) => ({
          name: option,
          value: option,
        }));
      }

      // Handle link and linkMultiple fields
      if ((fieldDef.type === 'link' || fieldDef.type === 'linkMultiple') && fieldDef.entity) {
        // For links, we would typically need to fetch the available options from the linked entity
        // This would require an additional API call, which might not be feasible in all contexts
        // For now, return an empty array, but this could be enhanced to fetch options
        return [];
      }
    }

    return [];
  }

  /**
   * Check if field is a relationship field
   */
  static isRelationshipField(fieldType: string): boolean {
    return ['link', 'linkOne', 'linkMultiple', 'linkParent'].includes(fieldType);
  }
}
