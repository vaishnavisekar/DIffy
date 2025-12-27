export let globalComparisonData = null;
export let currentFilter = 'all';

export const objectURLRegistry = new Set();

export function setGlobalComparisonData(data) {
    globalComparisonData = data;
}

export function setCurrentFilter(filter) {
    currentFilter = filter;
}
