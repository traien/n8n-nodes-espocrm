import { IDataObject, IExecuteFunctions } from 'n8n-workflow';

/**
 * Interface for all entity handlers
 */
export interface EntityHandler {
  /**
   * Handle the create operation for the entity
   */
  create(this: IExecuteFunctions, index: number): Promise<IDataObject>;
  
  /**
   * Handle the get operation for the entity
   */
  get(this: IExecuteFunctions, index: number): Promise<IDataObject>;
  
  /**
   * Handle the update operation for the entity
   */
  update(this: IExecuteFunctions, index: number): Promise<IDataObject>;
  
  /**
   * Handle the delete operation for the entity
   */
  delete(this: IExecuteFunctions, index: number): Promise<IDataObject>;
  
  /**
   * Handle the getAll operation for the entity
   */
  getAll(this: IExecuteFunctions, index: number): Promise<IDataObject[]>;
}