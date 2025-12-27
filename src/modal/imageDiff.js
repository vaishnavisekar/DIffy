import { createTrackedObjectURL } from '../utils/objectUrl.js';
import { formatSize } from '../utils/format.js';

export function createImageDiff(source, target, status) {
  const container = document.createElement('div');
  container.className = 'text-diff';

  if (status === 'changed') {
    const sSrc = source.url || (source.file ? createTrackedObjectURL(source.file) : '');
    const tSrc = target.url || (target.file ? createTrackedObjectURL(target.file) : '');

    container.innerHTML = `
      <div class="text-diff-container">
        <div class="diff-sub-panel" style="align-items: center;">
          <div class="diff-sub-header">Source Image</div>
          <div style="padding: 20px;">
            ${sSrc ? `<img src="${sSrc}" style="max-width: 100%; max-height: 220px; border-radius: 8px;">` : '<div style="font-size: 4rem;">🖼️</div>'}
          </div>
          <div class="image-metadata">
            <div class="metadata-row"><span>Size:</span><strong>${formatSize(source.size)}</strong></div>
          </div>
        </div>
        <div class="diff-sub-panel" style="align-items: center;">
          <div class="diff-sub-header">Target Image</div>
          <div style="padding: 20px;">
            ${tSrc ? `<img src="${tSrc}" style="max-width: 100%; max-height: 220px; border-radius: 8px;">` : '<div style="font-size: 4rem;">🖼️</div>'}
          </div>
          <div class="image-metadata">
            <div class="metadata-row"><span>Size:</span><strong>${formatSize(target.size)}</strong></div>
          </div>
        </div>
      </div>
    `;
  } else {
    const file = source || target;
    const src = file.url || (file.file ? createTrackedObjectURL(file.file) : '');
    container.innerHTML = `
      <div class="text-diff-container single-panel">
        <div class="diff-sub-panel" style="align-items: center; justify-content: center; padding: 40px;">
          ${src ? `<img src="${src}" style="max-width: 100%; max-height: 320px; border-radius: 8px;">` : '<div style="font-size: 8rem;">🖼️</div>'}
          <h3 style="margin-top: 24px;">${file.name}</h3>
          <p style="color: var(--text-muted);">Status: ${status.toUpperCase()}</p>
        </div>
      </div>
    `;
  }
  return container;
}
