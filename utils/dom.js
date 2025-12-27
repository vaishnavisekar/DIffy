export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function animateCounter(element, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}
export function highlightLineChanges(text, compareText) {
    if (!text) return '';
    if (!compareText) return escapeHtml(text);

    const words = text.split(/(\s+)/);
    const compareWords = compareText.split(/(\s+)/);

    return words.map((word, i) => {
        if (word !== compareWords[i]) {
            return `<span class="diff-highlight">${escapeHtml(word)}</span>`;
        }
        return escapeHtml(word);
    }).join('');
}
