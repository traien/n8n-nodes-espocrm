# @traien/n8n-nodes-espocrm
![@traien/n8n-nodes-espocrm](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

This is a community node for [n8n](https://n8n.io/) that enables seamless integration with [EspoCRM](https://www.espocrm.com/), a powerful open-source CRM platform. With this node, you can automate your CRM operations and integrate EspoCRM with other services in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Features

The EspoCRM node provides comprehensive access to EspoCRM's API functionality:

- **Entity Operations**
  - Create new records (Leads, Contacts, Accounts, etc.)
  - Retrieve entity details
  - Update records (full or partial updates)
  - Delete records
  - List/search entities with advanced filtering
  - Supported core entities: Account, Contact, Lead, Meeting, Task, Call, Opportunity, Case

- **Dynamic Entity Support**
  - Work with any entity type in your EspoCRM instance
  - Automatic field detection and validation
  - Custom field support

- **Advanced Filtering**
  - Complex search queries
  - Date-based filtering
  - Relationship filters
  - Array field operations
  - Custom boolean filters

- **Performance Optimizations**
  - Pagination support
  - Selective field loading
  - Skip total count for large datasets
  - Duplicate checking control

## Prerequisites

- Active EspoCRM instance (v6.0 or later recommended)
- API access enabled in EspoCRM
- API user with appropriate permissions
- n8n installation (v0.170.0 or later)

## Installation

Follow these steps to install this package in your n8n instance:

1. Open your n8n instance
2. Go to Settings > Community Nodes
3. Select "Install"
4. Enter `@traien/n8n-nodes-espocrm`
5. Click "Install"

For a manual installation, you can use:

```bash
npm install @traien/n8n-nodes-espocrm
```

Or if you have installed n8n globally:

```bash
npm install -g @traien/n8n-nodes-espocrm
```

## Configuration

### API Authentication

1. In EspoCRM:
   - Navigate to Administration > API Users
   - Create a new API User
   - Generate an API Key
   - Note down the API Key and API Secret

2. In n8n:
   - Add new credentials of type 'EspoCRM API'
   - Enter your EspoCRM instance URL
   - Input the API Key and API Secret
   - Save the credentials

## Usage Examples

### Creating a Contact

Create a new contact record with customized field values:

1. Add an "EspoCRM" node to your workflow
2. Select "Contact" as the Resource
3. Choose "Create" as the Operation
4. Fill in the required fields:
   - First Name
   - Last Name
   - Email Address
5. Add any additional fields as needed
6. Connect to other nodes in your workflow

### Creating a Meeting

1. Add an "EspoCRM" node to your workflow
2. Select `Meeting` as the Resource
3. Choose `Create` as the Operation
4. Fill in the required fields:
  - `Name`
  - `Start Date`
5. Optionally set `End Date`, `Status`, `Assigned User ID`, or parent (`parentType` + `parentId`)
6. Execute to create the meeting in EspoCRM

### Working with Dynamic Entities

The Dynamic resource allows you to work with any entity type in your EspoCRM system:

1. Add an "EspoCRM" node to your workflow
2. Select "Dynamic" as the Resource
3. Choose your desired Operation (Create, Update, Get, etc.)
4. Select the Entity Type from the dropdown
5. The available fields will be automatically loaded based on the entity type
6. Complete the required fields and connect to your workflow

### Advanced Filtering Example

```json
{
  "operation": "getAll",
  "entityType": "Lead",
  "filterOptions": {
    "where": [
      {
        "type": "and",
        "value": [
          {
            "type": "equals",
            "field": "status",
            "value": "New"
          },
          {
            "type": "greaterThan",
            "field": "createdAt",
            "value": "2024-01-01"
          }
        ]
      }
    ],
    "orderBy": "createdAt",
    "order": "desc",
    "maxSize": 50
  }
}
```

## Resources

- [EspoCRM API Documentation](https://docs.espocrm.com/development/api/)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## Support

- For EspoCRM-specific issues: [EspoCRM Forum](https://forum.espocrm.com/)
- For node-specific issues: Create an issue in the GitHub repository
- For n8n-related questions: [n8n Community](https://community.n8n.io/)

## Development

To run a local version of n8n with this node for development, you can use the following Docker command. Make sure to replace `/path/to/your/local/n8n-espocrm` with the absolute path to this repository on your machine.

```bash
docker run -it --rm \\
 --name n8n \\
 -p 5678:5678 \\
 -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \\
 -e N8N_RUNNERS_ENABLED=true \\
 -e N8N_LOG_LEVEL=debug -v n8n_data:/home/node/.n8n \\
 -v /path/to/your/local/n8n-espocrm:/home/node/.n8n/custom/n8n-espocrm
```

## License

[MIT](LICENSE.md)
