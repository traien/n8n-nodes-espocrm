import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IDataObject,
	IHttpRequestOptions,
	NodeOperationError,
	IHttpRequestMethods,
} from 'n8n-workflow';
import * as crypto from 'crypto';

// Creating a type that combines the common functionalities of both types
type IFunctions = IExecuteFunctions | ILoadOptionsFunctions;

/**
 * Make an API request to EspoCRM
 */
export async function espoApiRequest(
	this: IFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject | IDataObject[] = {},
	qs: IDataObject = {},
	uri?: string,
	headers: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('espoCRMApi') as {
		baseUrl: string;
		authType: string;
		apiKey: string;
		secretKey: string;
	};

	const options: IHttpRequestOptions = {
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			...headers,
		},
		method,
		body: Object.keys(body).length === 0 ? undefined : body,
		url: endpoint,
		qs,
	};

	if (credentials.authType === 'hmac' && credentials.secretKey) {
		// Create HMAC signature
		const hmacString = method + ' ' + endpoint;
		const hmac = crypto.createHmac('sha256', credentials.secretKey);
		hmac.update(hmacString);
		const signature = hmac.digest('base64');
		
		// Format as X-Hmac-Authorization header
		const authPart = Buffer.from(credentials.apiKey + ':').toString('base64') + signature;
		options.headers!['X-Hmac-Authorization'] = authPart;
	} else {
		// Use API Key authentication
		options.headers!['X-Api-Key'] = credentials.apiKey;
	}

	// Handle GET requests with JSON parameters
	if (method === 'GET' && Object.keys(qs).length > 0) {
		// Convert query parameters to JSON string for searchParams
		options.qs = { searchParams: JSON.stringify(qs) };
	}

	try {
		return await this.helpers.httpRequest({
			baseURL: `${credentials.baseUrl}/api/v1`,
			...options,
		});
	} catch (error) {
		// Enhanced error handling with status code information
		if (error.response && error.response.body) {
			const errorMessage = error.response.body.message || error.message;
			const statusCode = error.statusCode;
			const statusReason = error.response.headers && error.response.headers['x-status-reason'] || '';
			
			throw new NodeOperationError(
				this.getNode(), 
				`EspoCRM API error: ${errorMessage}. Status: ${statusCode}${statusReason ? `. Reason: ${statusReason}` : ''}`,
			);
		}
		throw error;
	}
}

/**
 * Make an API request to fetch all items
 */
export async function espoApiRequestAllItems(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<any> {
	const returnData: IDataObject[] = [];
	
	let responseData;
	qs.maxSize = 100;
	qs.offset = 0;
	
	do {
		responseData = await espoApiRequest.call(this, method, endpoint, body, qs);
		returnData.push.apply(returnData, responseData.list);
		qs.offset = returnData.length;
	} while (
		responseData.total !== undefined && 
		responseData.list.length > 0 &&
		returnData.length < responseData.total
	);
	
	return returnData;
}