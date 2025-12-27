import { objectURLRegistry } from '../state.js';

export function createTrackedObjectURL(blob) {
    const url = URL.createObjectURL(blob);
    objectURLRegistry.add(url);
    return url;
}

export function cleanupObjectURLs() {
    objectURLRegistry.forEach(url => {
        try {
            URL.revokeObjectURL(url);
        } catch (e) {
            console.warn('Failed to revoke URL:', url);
        }
    });
    objectURLRegistry.clear();
}
