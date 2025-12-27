import { createTrackedObjectURL, cleanupObjectURLs } from './objectUrl.js';

export async function computeFileHash(file, isText) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        let data = arrayBuffer;

        if (isText) {
            const text = new TextDecoder('utf-8').decode(arrayBuffer);
            const normalized = text.replace(/\r\n/g, '\n');
            data = new TextEncoder().encode(normalized);
        }

        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    } catch (e) {
        console.error('Hash computation failed:', e);
        return null;
    }
}

export { createTrackedObjectURL, cleanupObjectURLs };
