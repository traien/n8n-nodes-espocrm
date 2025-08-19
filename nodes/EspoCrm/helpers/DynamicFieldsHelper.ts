import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { MetadataService } from '../services/MetadataService';

/**
 * Helper class for dynamically generating field components based on EspoCrm metadata
 */
export class DynamicFieldsHelper {
  /**
   * Generate field selector for an entity type
   */
  static async generateFieldSelector(
    this: IExecuteFunctions,
    entityType: string,
    parameterName: string = 'field',
    displayName: string = 'Field',
    description: string = 'Select a field',
  ): Promise<INodeProperties> {
    // Fetch field definitions from EspoCrm API
    const fieldDefs = await MetadataService.getFieldDefs.call(this,this, entityType);

    // Create options from field definitions
    const options = Object.keys(fieldDefs).map((fieldName) => {
      const fieldDef = fieldDefs[fieldName] as IDataObject;
      return {
        name: fieldDef.label ? `${fieldDef.label as string} (${fieldName})` : fieldName,
        value: fieldName,
      };
    });

    // Sort options alphabetically by name
    options.sort((a, b) => a.name.localeCompare(b.name));

    // Return field selector component
    return {
      displayName,
      name: parameterName,
      type: 'options',
      options,
      default: '',
      description,
      required: true,
    };
  }

  /**
   * Generate a value input field based on the selected field's type
   */
  static async generateValueInput(
    this: IExecuteFunctions,
    entityType: string,
    fieldName: string,
    parameterName: string = 'value',
    displayName: string = 'Value',
  ): Promise<INodeProperties> {
    // Fetch field definitions from EspoCrm API
    const fieldDefs = await MetadataService.getFieldDefs.call(this,this, entityType);
    const fieldDef = fieldDefs[fieldName] as IDataObject;

    if (!fieldDef) {
      // Default to string if field not found
      return {
        displayName,
        name: parameterName,
        type: 'string',
        default: '',
        description: 'Value for the field',
      };
    }

    // Get n8n field type based on EspoCrm field type
    const fieldType = MetadataService.mapFieldTypeToN8n(fieldDef.type as string, fieldDef);

    // Base properties
    const baseProperties = {
      displayName,
      name: parameterName,
      description: `Value for the ${fieldDef.label || fieldName} field`,
    };

    // Extend properties based on field type
    if (fieldType === 'options') {
      if (fieldDef.type === 'multiEnum' || fieldDef.type === 'array' || fieldDef.type === 'checklist') {
        // Handle multi-select fields
        return {
          ...baseProperties,
          type: 'multiOptions',
          options: MetadataService.generateFieldOptions(fieldDefs, fieldName),
          default: [],
        };
      } else {
        // Handle single-select fields
        return {
          ...baseProperties,
          type: 'options',
          options: MetadataService.generateFieldOptions(fieldDefs, fieldName),
          default: '',
        };
      }
    } else if (fieldType === 'boolean') {
      // Handle boolean fields
      return {
        ...baseProperties,
        type: 'boolean',
        default: false,
      };
    } else if (fieldType === 'number') {
      // Handle numeric fields
      const typeOptions: IDataObject = {};

      // Add min/max constraints if provided in the field def
      if (fieldDef.min !== undefined) {
        typeOptions.minValue = fieldDef.min;
      }
      if (fieldDef.max !== undefined) {
        typeOptions.maxValue = fieldDef.max;
      }

      return {
        ...baseProperties,
        type: 'number',
        default: 0,
        typeOptions: Object.keys(typeOptions).length > 0 ? typeOptions : undefined,
      };
    } else if (fieldType === 'dateTime') {
      // Handle date/time fields
      return {
        ...baseProperties,
        type: 'dateTime',
        default: '',
      };
    } else if (fieldType === 'json') {
      // Handle JSON fields
      return {
        ...baseProperties,
        type: 'json',
        default: '{}',
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
      };
    } else if (MetadataService.isRelationshipField(fieldDef.type as string)) {
      // Handle relationship fields
      if (fieldDef.entity) {
        return {
          ...baseProperties,
          type: 'string',
          default: '',
          description: `ID of the related ${fieldDef.entity} record`,
          placeholder: fieldDef.type === 'linkMultiple' ? 'Comma-separated IDs' : 'Record ID',
        };
      } else {
        return {
          ...baseProperties,
          type: 'string',
          default: '',
          description: 'ID of the related record',
        };
      }
    } else {
      // Default to string for other types with appropriate customizations
      const typeOptions: IDataObject = {};

      // For text fields, use textarea
      if (fieldDef.type === 'text' || fieldDef.type === 'wysiwyg') {
        typeOptions.rows = 4;
      }

      // For password fields, use password input
      if (fieldDef.type === 'password') {
        typeOptions.password = true;
      }

      // For URL fields, use URL validation
      if (fieldDef.type === 'url') {
        typeOptions.validationRegex = '^(https?|ftp):\\/\\/[^\\s/$.?#].[^\\s]*$';
        typeOptions.validationMessage = 'Please enter a valid URL';
      }

      // For email fields, use email validation
      if (fieldDef.type === 'email') {
        typeOptions.validationRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
        typeOptions.validationMessage = 'Please enter a valid email address';
      }

      // For varchar fields with max length
      if (fieldDef.type === 'varchar' && fieldDef.maxLength) {
        typeOptions.maxLength = fieldDef.maxLength;
      }

      return {
        ...baseProperties,
        type: 'string',
        default: '',
        typeOptions: Object.keys(typeOptions).length > 0 ? typeOptions : undefined,
      };
    }
  }

  /**
   * Generate entity type selector
   */
  static async generateEntityTypeSelector(
    this: IExecuteFunctions,
    parameterName: string = 'entityType',
    displayName: string = 'Entity Type',
    description: string = 'Select an entity type',
  ): Promise<INodeProperties> {
    // Fetch entity list from EspoCrm API
    const entityList = await MetadataService.getEntityList.call(this,this);

    // Create options from entity list
    const options = entityList.map((entityType) => ({
      name: entityType,
      value: entityType,
    }));

    // Sort options alphabetically
    options.sort((a, b) => a.name.localeCompare(b.name));

    // Return entity type selector component
    return {
      displayName,
      name: parameterName,
      type: 'options',
      options,
      default: '',
      description,
      required: true,
    };
  }

  /**
   * Generate filters for relationship fields (links)
   */
  static async generateRelationshipFilterSelector(
    this: IExecuteFunctions,
    entityType: string,
    linkName: string,
    parameterName: string = 'relationFilter',
    displayName: string = 'Relation Filter',
  ): Promise<INodeProperties> {
    // Get all links for the entity
    const links = await MetadataService.getEntityLinks.call(this,this, entityType);
    const linkDef = links[linkName] as IDataObject;

    if (!linkDef || !linkDef.entity) {
      return {
        displayName,
        name: parameterName,
        type: 'string',
        default: '',
        description: 'Filter for related records',
      };
    }

    // Get fields for the related entity
    const relatedEntityType = linkDef.entity as string;
    const relatedFields = await MetadataService.getFieldDefs.call(this,this, relatedEntityType);

    // Build options for field selection
    const options = Object.keys(relatedFields).map((fieldName) => {
      const fieldDef = relatedFields[fieldName] as IDataObject;
      return {
        name: fieldDef.label ? `${fieldDef.label as string} (${fieldName})` : fieldName,
        value: fieldName,
      };
    });

    // Sort options alphabetically
    options.sort((a, b) => a.name.localeCompare(b.name));

    return {
      displayName,
      name: parameterName,
      type: 'options',
      options,
      default: '',
      description: `Select field from related ${relatedEntityType} to filter on`,
    };
  }
}
