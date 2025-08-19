import { AccountHandler } from './AccountHandler';
import { ContactHandler } from './ContactHandler';
import { LeadHandler } from './LeadHandler';
import { CustomEntityHandler } from './CustomEntityHandler';
import { MeetingHandler } from './MeetingHandler';
import { TaskHandler } from './TaskHandler';
import { CallHandler } from './CallHandler';
import { OpportunityHandler } from './OpportunityHandler';
import { CaseHandler } from './CaseHandler';
import { AttachmentHandler } from './AttachmentHandler';
import { DocumentHandler } from './DocumentHandler';
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
      case 'meeting':
        return new MeetingHandler();
      case 'task':
        return new TaskHandler();
      case 'call':
        return new CallHandler();
      case 'opportunity':
        return new OpportunityHandler();
      case 'case':
        return new CaseHandler();
      case 'customEntity':
        return new CustomEntityHandler();
      case 'attachment':
        return new AttachmentHandler();
      case 'document':
        return new DocumentHandler();
      default:
        throw new Error(`Unsupported resource type: ${resource}`);
    }
  }
}
