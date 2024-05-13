import { readFileSync } from 'fs';

export function base64Encode(filePath: string) {
    const bitmap = readFileSync(filePath);
    // convert binary data to base64 encoded string
    return Buffer.from(bitmap).toString('base64');
}
