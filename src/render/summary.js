import { animateCounter } from '../utils/dom.js';

export function renderSummary(comparison) {
    if (!comparison) {
        console.warn('Comparison data not ready');
        return;
    }

    const counts = {
        all: (comparison.removed?.length || 0) + (comparison.added?.length || 0) + (comparison.changed?.length || 0) + (comparison.unchanged?.length || 0),
        removed: comparison.removed?.length || 0,
        added: comparison.added?.length || 0,
        changed: comparison.changed?.length || 0,
        unchanged: comparison.unchanged?.length || 0
    };

    Object.keys(counts).forEach(key => {
        const badge = document.getElementById(`badge-${key}`);
        if(badge) animateCounter(badge, 0, counts[key], 1000);
    });
}
