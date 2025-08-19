import { IDataObject } from 'n8n-workflow';

/**
 * Process address fields for entities
 */
export function processAddressFields(prefix: string, addressData: IDataObject): IDataObject {
    const result: IDataObject = {};

    if (addressData.street) {
        result[`${prefix}Street`] = addressData.street;
    }

    if (addressData.city) {
        result[`${prefix}City`] = addressData.city;
    }

    if (addressData.state) {
        result[`${prefix}State`] = addressData.state;
    }

    if (addressData.country) {
        result[`${prefix}Country`] = addressData.country;
    }

    if (addressData.postalCode) {
        result[`${prefix}PostalCode`] = addressData.postalCode;
    }

    return result;
}

/**
 * Format a date-time string to EspoCRM expected format 'YYYY-MM-DD HH:mm:ss'.
 * Accepts ISO strings (e.g. 2025-08-14T00:00:00.000Z), date-only (YYYY-MM-DD),
 * or already formatted values. Returns undefined for falsy input.
 */
export function toEspoDateTime(value?: string): string | undefined {
    if (!value) return undefined;
    const v = value.trim();
    // If already in 'YYYY-MM-DD HH:mm:ss'
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)) {
        return v;
    }
    // If date-only, add midnight time
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        return `${v} 00:00:00`;
    }
    // Try to parse with Date
    const d = new Date(v);
    if (isNaN(d.getTime())) {
        // Fallback: return as-is and let API validate; safer than throwing here
        return v;
    }
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/**
 * Format a date string to EspoCRM expected date-only format 'YYYY-MM-DD'.
 * Returns undefined for falsy input.
 */
export function toEspoDate(value?: string): string | undefined {
    if (!value) return undefined;
    const v = value.trim();
    // If already date-only
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        return v;
    }
    // If in 'YYYY-MM-DD HH:mm:ss'
    const m = v.match(/^(\d{4}-\d{2}-\d{2}) \d{2}:\d{2}:\d{2}$/);
    if (m) return m[1];
    // Try to parse ISO or other formats
    const d = new Date(v);
    if (isNaN(d.getTime())) {
        return v;
    }
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    return `${yyyy}-${mm}-${dd}`;
}
