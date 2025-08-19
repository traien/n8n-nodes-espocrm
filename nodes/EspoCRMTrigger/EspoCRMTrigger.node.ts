import {
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	INodeExecutionData,
	IHookFunctions,
	IHttpRequestOptions,
	NodeOperationError,
} from 'n8n-workflow';
import { createHmac } from 'crypto';

export class EspoCRMTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'EspoCRM Trigger',
		name: 'espoCrmTrigger',
		icon: 'file:espocrm-trigger.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["eventType"] + ": " + $parameter["entityType"]}}',
		description: 'Handle EspoCRM Webhooks',
		defaults: {
			name: 'EspoCRM Trigger',
		},
		inputs: [],
		outputs: ['main'],
		documentationUrl: 'https://docs.espocrm.com/administration/webhooks',
		credentials: [
			{
				name: 'espoCRMApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				options: [
					{
						name: 'Record Created',
						value: 'create',
						description: 'Triggered when a record is created',
					},
					{
						name: 'Record Updated',
						value: 'update',
						description: 'Triggered when a record is updated',
					},
					{
						name: 'Record Deleted',
						value: 'delete',
						description: 'Triggered when a record is deleted',
					},
					{
						name: 'Field Updated',
						value: 'fieldUpdate',
						description: 'Triggered when a specific field is updated',
					},
				],
				default: 'create',
				required: true,
				description: 'Type of event to listen for',
			},
			{
				displayName: 'Entity Type',
				name: 'entityType',
				type: 'string',
				default: '',
				required: true,
				description: 'Type of entity to monitor (e.g., Contact, Account, Lead)',
				placeholder: 'Account',
			},
			{
				displayName: 'Field Name',
				name: 'fieldName',
				type: 'string',
				default: '',
				placeholder: 'assignedUserId',
				description: 'Name of the field to monitor for updates',
				displayOptions: {
					show: {
						eventType: ['fieldUpdate'],
					},
				},
			},
			{
				displayName: 'Verification',
				name: 'verification',
				type: 'boolean',
				default: true,
				description: 'Whether to verify the webhook signature to ensure it comes from EspoCRM',
			},
		],
	};

	// The function to register the webhook in EspoCRM system
	async webhookCreate(this: IHookFunctions): Promise<boolean> {
		const webhookUrl = this.getNodeWebhookUrl('default');
		const webhookData = this.getWorkflowStaticData('node');
		const eventType = this.getNodeParameter('eventType') as string;
		const entityType = this.getNodeParameter('entityType') as string;

		// Get credentials for API call
		const credentials = await this.getCredentials('espoCRMApi');

		// Build the event name for webhook registration based on selected parameters
		let eventName = `${entityType}.${eventType}`;

		// If it's a fieldUpdate, append the field name
		if (eventType === 'fieldUpdate') {
			const fieldName = this.getNodeParameter('fieldName') as string;
			if (!fieldName) {
				throw new NodeOperationError(this.getNode(), 'Field name is required for field update events');
			}
			eventName += `.${fieldName}`;
		}

		// Prepare request options for creating the webhook
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: '/Webhook',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: {
				event: eventName,
				url: webhookUrl,
			},
		};

		if (credentials.authType === 'hmac' && credentials.secretKey) {
			// Create HMAC signature
			const hmacString = 'POST /Webhook';
			const hmac = createHmac('sha256', credentials.secretKey as string);
			hmac.update(hmacString);
			const signature = hmac.digest('base64');

			// Format as X-Hmac-Authorization header
			const authPart = Buffer.from(credentials.apiKey + ':').toString('base64') + signature;
			options.headers!['X-Hmac-Authorization'] = authPart;
		} else {
			// Use API Key authentication
			options.headers!['X-Api-Key'] = credentials.apiKey;
		}

		try {
			// Send request to EspoCRM to create the webhook
			const response = await this.helpers.httpRequest({
				baseURL: `${credentials.baseUrl}/api/v1`,
				...options,
			});

			// Store the webhook ID and secret key for later verification and deletion
			if (response.id && response.secretKey) {
				webhookData.webhookId = response.id;
				webhookData.secretKey = response.secretKey;
				return true;
			} else {
				throw new NodeOperationError(this.getNode(), 'Failed to create webhook in EspoCRM: Invalid response');
			}
		} catch (error) {
			if (error.response && error.response.body) {
				const errorMessage = error.response.body.message || error.message;
				const statusCode = error.statusCode;
				throw new NodeOperationError(
					this.getNode(),
					`EspoCRM API error: ${errorMessage}. Status: ${statusCode}`
				);
			}
			throw error;
		}
	}

	// The function to delete the webhook from EspoCRM
	async webhookDelete(this: IHookFunctions): Promise<boolean> {
		const webhookData = this.getWorkflowStaticData('node');

		// Check if webhook was created previously
		if (!webhookData.webhookId) {
			// No webhook was created before
			return true;
		}

		// Get credentials for API call
		const credentials = await this.getCredentials('espoCRMApi');

		// Prepare request options for deleting the webhook
		const options: IHttpRequestOptions = {
			method: 'DELETE',
			url: `/Webhook/${webhookData.webhookId}`,
			headers: {
				'Accept': 'application/json',
			},
		};

		if (credentials.authType === 'hmac' && credentials.secretKey) {
			// Create HMAC signature
			const hmacString = `DELETE /Webhook/${webhookData.webhookId}`;
			const hmac = createHmac('sha256', credentials.secretKey as string);
			hmac.update(hmacString);
			const signature = hmac.digest('base64');

			// Format as X-Hmac-Authorization header
			const authPart = Buffer.from(credentials.apiKey + ':').toString('base64') + signature;
			options.headers!['X-Hmac-Authorization'] = authPart;
		} else {
			// Use API Key authentication
			options.headers!['X-Api-Key'] = credentials.apiKey;
		}

		try {
			// Send request to EspoCRM to delete the webhook
			await this.helpers.httpRequest({
				baseURL: `${credentials.baseUrl}/api/v1`,
				...options,
			});

			// Clear stored webhook data
			delete webhookData.webhookId;
			delete webhookData.secretKey;

			return true;
		} catch (error) {
			// If the webhook no longer exists (410 status), consider it deleted
			if (error.statusCode === 410 || error.statusCode === 404) {
				delete webhookData.webhookId;
				delete webhookData.secretKey;
				return true;
			}

			if (error.response && error.response.body) {
				const errorMessage = error.response.body.message || error.message;
				const statusCode = error.statusCode;
				throw new NodeOperationError(
					this.getNode(),
					`EspoCRM API error: ${errorMessage}. Status: ${statusCode}`
				);
			}
			throw error;
		}
	}

	// Function to handle incoming webhook data
	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const webhookData = this.getWorkflowStaticData('node');
		const bodyData = this.getBodyData();
		const headerData = this.getHeaderData();
		const verification = this.getNodeParameter('verification') as boolean;

		// Verify webhook signature if verification is enabled
		if (verification && webhookData.secretKey && webhookData.webhookId) {
			const signature = headerData.signature || headerData['x-signature']; // Support both v9.0+ and older versions

			if (!signature) {
				return {
					webhookResponse: {
						body: { error: 'Signature missing' },
						statusCode: 401,
					},
				};
			}

			try {
				// Calculate expected signature
				const payload = JSON.stringify(bodyData);
				const calculatedSignature = Buffer.from(`${webhookData.webhookId}:${createHmac('sha256', webhookData.secretKey as string).update(payload).digest('hex')}`).toString('base64');

				if (signature !== calculatedSignature) {
					return {
						webhookResponse: {
							body: { error: 'Invalid signature' },
							statusCode: 401,
						},
					};
				}
			} catch (error) {
				return {
					webhookResponse: {
						body: { error: 'Failed to verify signature' },
						statusCode: 500,
					},
				};
			}
		}

		// Process the webhook data
		// EspoCRM sends an array of records, even if it's just one
		if (Array.isArray(bodyData)) {
			const returnData: INodeExecutionData[] = [];

			// Process each record in the array
			for (const item of bodyData) {
				returnData.push({
					json: item,
					pairedItem: {
						item: 0,
					},
				});
			}

			return {
				workflowData: [
					[
						...returnData,
					],
				],
			};
		} else {
			// If for some reason the data is not an array, wrap it in an array
			return {
				workflowData: [
					[
						{
							json: bodyData,
							pairedItem: {
								item: 0,
							},
						},
					],
				],
			};
		}
	}
}
