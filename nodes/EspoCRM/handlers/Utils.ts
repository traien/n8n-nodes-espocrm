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