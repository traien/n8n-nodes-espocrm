import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EspoCRMApi implements ICredentialType {
	name = 'espoCRMApi';
	displayName = 'EspoCRM API';
	documentationUrl = 'https://docs.espocrm.com/development/api/';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://example.espocrm.com',
			required: true,
			description: 'The base URL of your EspoCRM instance (must include https:// or http://)',
			validateType: 'url',
		},
		{
			displayName: 'Authentication Type',
			name: 'authType',
			type: 'options',
			options: [
				{
					name: 'API Key',
					value: 'apiKey',
				},
				{
					name: 'HMAC',
					value: 'hmac',
				},
			],
			default: 'apiKey',
			description: 'The authentication method to use',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			displayOptions: {
				show: {
					authType: ['apiKey', 'hmac'],
				},
			},
			description: 'The API Key for your EspoCRM account',
		},
		{
			displayName: 'Secret Key',
			name: 'secretKey',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			},
			displayOptions: {
				show: {
					authType: ['hmac'],
				},
			},
			description: 'The Secret Key for HMAC authentication',
		},
	];

	// This allows the credential to be used by other parts of n8n
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				// This will be dynamically set in the node based on whether it's API Key or HMAC
				'X-Api-Key': '={{$credentials.authType === "apiKey" ? $credentials.apiKey : undefined}}',
			},
		},
	};

	// This function will be called to test if the credentials are valid
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}/api/v1',
			url: '/App/user',
			method: 'GET',
		},
	};
}