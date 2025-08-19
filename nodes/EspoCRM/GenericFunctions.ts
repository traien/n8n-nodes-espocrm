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
		// Allow overriding full URL via `uri` if provided
		url: uri ?? endpoint,
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

	this.logger.debug('EspoCRM API request options:', options);

	try {
		const response = await this.helpers.httpRequest({
			baseURL: `${credentials.baseUrl}/api/v1`,
			...options,
		});
		this.logger.debug('EspoCRM API response:', response);
		return response;
	} catch (error) {
		this.logger.debug('EspoCRM API error message:', error.message);
		if (error.response) {
			this.logger.debug('EspoCRM API error response body:', error.response.body);
		}
		// Enhanced error handling with status code information
		if (error.response) {
            const errorMessage = (error.response.body && error.response.body.message) || error.message;
            const statusCode = error.statusCode;
            const statusReason = (error.response.headers && error.response.headers['x-status-reason']) || '';

            throw new NodeOperationError(
                this.getNode(),
                `EspoCRM API error: ${errorMessage}. Status: ${statusCode}${
                    statusReason ? `. Reason: ${statusReason}` : ''
                }`,
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

/**
 * Make an API request expecting binary (arraybuffer) response
 */
export async function espoApiRequestBinary(
	this: IFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	qs: IDataObject = {},
	uri?: string,
	headers: IDataObject = {},
): Promise<{ data: Buffer; headers: IDataObject }>
{
	const credentials = await this.getCredentials('espoCRMApi') as {
		baseUrl: string;
		authType: string;
		apiKey: string;
		secretKey: string;
	};

	const options: IHttpRequestOptions = {
		headers: {
			'Accept': 'application/octet-stream,*/*',
			...headers,
		},
		method,
		url: uri ?? endpoint,
		qs,
		// Request binary by disabling encoding; n8n returns Buffer when encoding is null
		encoding: null as any,
	};

	if (credentials.authType === 'hmac' && credentials.secretKey) {
		const hmacString = method + ' ' + endpoint;
		const hmac = crypto.createHmac('sha256', credentials.secretKey);
		hmac.update(hmacString);
		const signature = hmac.digest('base64');
		const authPart = Buffer.from(credentials.apiKey + ':').toString('base64') + signature;
		options.headers!['X-Hmac-Authorization'] = authPart;
	} else {
		options.headers!['X-Api-Key'] = credentials.apiKey;
	}

	this.logger.debug('EspoCRM API binary request options:', options);

	try {
		const response = await this.helpers.httpRequest({
			baseURL: `${credentials.baseUrl}/api/v1`,
			...options,
			returnFullResponse: true,
		});
		// Coerce body to Buffer for n8n binary helpers
		const resAny = response as any;
		let body: any = resAny.body ?? resAny.data;
		let buffer: Buffer;
		if (Buffer.isBuffer(body)) {
			buffer = body;
		} else if (body && typeof body.on === 'function') {
			// Node.js Readable stream
			buffer = await new Promise<Buffer>((resolve, reject) => {
				const chunks: Buffer[] = [];
				body.on('data', (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
				body.on('end', () => resolve(Buffer.concat(chunks)));
				body.on('error', (err: Error) => reject(err));
			});
		} else if (typeof body === 'string') {
			buffer = Buffer.from(body);
		} else if (body == null) {
			buffer = Buffer.alloc(0);
		} else {
			// Fallback attempt
			try { buffer = Buffer.from(body); } catch {
				throw new NodeOperationError(this.getNode(), 'Unexpected binary response type from EspoCRM');
			}
		}
		return { data: buffer, headers: (response.headers || {}) as IDataObject };
	} catch (error) {
		this.logger.debug('EspoCRM API binary error message:', error.message);
		if (error.response) {
			this.logger.debug('EspoCRM API binary error response body:', error.response.body || error.response.data);
		}
		if (error.response) {
			const errorMessage = (error.response.body && error.response.body.message) || error.message;
			const statusCode = error.statusCode;
			const statusReason = (error.response.headers && error.response.headers['x-status-reason']) || '';
			throw new NodeOperationError(
				this.getNode(),
				`EspoCRM API error: ${errorMessage}. Status: ${statusCode}${statusReason ? `. Reason: ${statusReason}` : ''}`,
			);
		}
		throw error;
	}
}
