import * as crypto from 'crypto';

function serialize(obj: any): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
}

export function Object2Hash(obj: any): string {
    // Convert the JSON object to a string
    const serializedObject = serialize(obj);

    // Create a SHA-256 hash of the serialized string
    const hash = crypto.createHash('sha256');
    hash.update(serializedObject);

    // Return the hash as a hexadecimal string
    return hash.digest('hex');
}
