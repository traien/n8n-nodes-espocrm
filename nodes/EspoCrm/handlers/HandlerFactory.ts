import { AccountHandler } from './AccountHandler';
import { ContactHandler } from './ContactHandler';
import { LeadHandler } from './LeadHandler';
import { CustomEntityHandler } from './CustomEntityHandler';
import { EntityHandler } from './EntityHandler';

/**
 * Factory to create the appropriate entity handler based on resource type
 */
export class HandlerFactory {
  /**
   * Get the appropriate handler for a given resource type
   * 
   * @param resource The resource type from the node parameters
   * @returns The appropriate entity handler
   */
  static getHandler(resource: string): EntityHandler {
    switch (resource) {
      case 'account':
        return new AccountHandler();
      case 'contact':
        return new ContactHandler();
      case 'lead':
        return new LeadHandler();
      case 'customEntity':
        return new CustomEntityHandler();
      default:
        throw new Error(`Unsupported resource type: ${resource}`);
    }
  }
}