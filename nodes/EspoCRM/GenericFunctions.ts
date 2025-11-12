import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	ISupplyDataFunctions,
	IDataObject,
	IHttpRequestOptions,
	NodeOperationError,
	IHttpRequestMethods,
} from 'n8n-workflow';
import * as crypto from 'crypto';

// Creating a type that combines the common functionalities of both types
type IFunctions = IExecuteFunctions | ILoadOptionsFunctions | ISupplyDataFunctions;

function resolveBaseUrl(this: IFunctions, rawUrl?: string): string {
	if (!rawUrl) {
		throw new NodeOperationError(
			this.getNode(),
			'EspoCRM credentials must include a Base URL such as "https://example.espocrm.com".',
		);
	}

	const trimmed = rawUrl.trim();
	const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	try {
		const parsed = new URL(withProtocol);
		const sanitizedPath = parsed.pathname.replace(/\/$/, '');
		return `${parsed.origin}${sanitizedPath}`;
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid EspoCRM Base URL "${rawUrl}". Please include the protocol (e.g. https://your-instance).`,
		);
	}
}

function joinUrl(base: string, path?: string): string {
	if (!path) {
		return base;
	}
	if (/^https?:\/\//i.test(path)) {
		return path;
	}
	const normalizedBase = base.endsWith('/') ? base : `${base}/`;
	const normalizedPath = path.replace(/^\/+/, '');
	return `${normalizedBase}${normalizedPath}`;
}

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

	const baseUrl = resolveBaseUrl.call(this, credentials.baseUrl);
	const apiBaseUrl = `${baseUrl.replace(/\/$/, '')}/api/v1`;
	const targetUrl = joinUrl(apiBaseUrl, uri ?? endpoint);
	const requestContext = `method=${method} url=${targetUrl} baseUrl=${credentials.baseUrl} endpoint=${endpoint} uriOverride=${uri ?? 'n/a'}`;
	this.logger.debug(
		`EspoCRM resolved URL -> credentialBase: ${credentials.baseUrl}, normalizedBase: ${baseUrl}, apiBase: ${apiBaseUrl}, endpoint: ${endpoint}, uriOverride: ${uri ?? 'n/a'}, final: ${targetUrl}`,
	);

	try {
		// Validate final URL early so we can provide useful feedback before axios throws
		new URL(targetUrl);
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid EspoCRM URL constructed (${requestContext}). Final URL: ${targetUrl}. Please double-check the Base URL stored in your EspoCRM credentials and ensure entity/record IDs do not contain unsupported characters.`,
		);
	}

	const options: IHttpRequestOptions = {
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			...headers,
		},
		method,
		body: Object.keys(body).length === 0 ? undefined : body,
		url: targetUrl,
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

	this.logger.debug(`EspoCRM API request ${method} ${targetUrl}`);

	try {
		const response = await this.helpers.httpRequest(options);
		this.logger.debug('EspoCRM API response:', response);
		return response;
	} catch (error) {
		const err = error as any;
		this.logger.error(`EspoCRM API error (${requestContext})`, err);
		let friendlyMessage = `EspoCRM API request failed (${requestContext}). ${err?.message ?? ''}`;
		if (err?.code === 'ERR_INVALID_URL' || /Invalid URL/i.test(err?.message ?? '')) {
			friendlyMessage = `Invalid URL generated for EspoCRM request (${requestContext}). Check your EspoCRM Base URL credential value plus any entity/record IDs.`;
		} else if (err?.response) {
			this.logger.error('EspoCRM API error response body:', err.response.body);
			const errorMessage = (err.response.body && err.response.body.message) || err.message;
			const statusCode = err.statusCode;
			const statusReason = (err.response.headers && err.response.headers['x-status-reason']) || '';
			friendlyMessage = `EspoCRM API error (${requestContext}). Status: ${statusCode}${statusReason ? `. Reason: ${statusReason}` : ''}. ${errorMessage}`;
		}
		throw new NodeOperationError(this.getNode(), friendlyMessage);
	}
}

/**
 * Make an API request to fetch all items
 */
export async function espoApiRequestAllItems(
	this: IExecuteFunctions | ISupplyDataFunctions,
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

	const baseUrl = resolveBaseUrl.call(this, credentials.baseUrl);
	const apiBaseUrl = `${baseUrl.replace(/\/$/, '')}/api/v1`;
	const targetUrl = joinUrl(apiBaseUrl, uri ?? endpoint);
	const requestContext = `method=${method} url=${targetUrl} baseUrl=${credentials.baseUrl} endpoint=${endpoint} uriOverride=${uri ?? 'n/a'}`;
	this.logger.debug(
		`EspoCRM binary resolved URL -> credentialBase: ${credentials.baseUrl}, normalizedBase: ${baseUrl}, apiBase: ${apiBaseUrl}, endpoint: ${endpoint}, uriOverride: ${uri ?? 'n/a'}, final: ${targetUrl}`,
	);

	try {
		new URL(targetUrl);
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid EspoCRM URL constructed (${requestContext}). Final URL: ${targetUrl}. Please double-check the Base URL stored in your EspoCRM credentials and ensure entity/record IDs do not contain unsupported characters.`,
		);
	}

	const options: IHttpRequestOptions = {
		headers: {
			'Accept': 'application/octet-stream,*/*',
			...headers,
		},
		method,
		url: targetUrl,
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

		this.logger.debug(`EspoCRM API binary request ${method} ${targetUrl}`);

	try {
		const response = await this.helpers.httpRequest({
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
		const err = error as any;
		this.logger.error(`EspoCRM API binary error (${requestContext})`, err);
		let friendlyMessage = `EspoCRM API binary request failed (${requestContext}). ${err?.message ?? ''}`;
		if (err?.code === 'ERR_INVALID_URL' || /Invalid URL/i.test(err?.message ?? '')) {
			friendlyMessage = `Invalid URL generated for EspoCRM request (${requestContext}). Check your EspoCRM Base URL credential value plus any entity/record IDs.`;
		} else if (err?.response) {
			this.logger.error('EspoCRM API binary error response body:', err.response.body || err.response.data);
			const errorMessage = (err.response.body && err.response.body.message) || err.message;
			const statusCode = err.statusCode;
			const statusReason = (err.response.headers && err.response.headers['x-status-reason']) || '';
			friendlyMessage = `EspoCRM API error (${requestContext}). Status: ${statusCode}${statusReason ? `. Reason: ${statusReason}` : ''}. ${errorMessage}`;
		}
		throw new NodeOperationError(this.getNode(), friendlyMessage);
	}
}
