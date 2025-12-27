import { createTrackedObjectURL } from '../utils/objectUrl.js';
import { formatSize } from '../utils/format.js';

export function createPdfDiff(source, target, status) {
    const container = document.createElement('div');
    container.className = 'pdf-diff';

    const file = source || target;
    const pdfSrc = file.url || (file.file ? createTrackedObjectURL(file.file) : '');

    container.innerHTML = `
    <div style="width: 100%; height: 100%; margin: 0 auto; display: flex; flex-direction: column;">
      <h3 style="margin-bottom: 16px; text-align: center;">PDF Document View</h3>
      <div class="pdf-preview" style="flex: 1; border: 1px solid var(--border-light); border-radius: 8px; overflow: hidden; background: #525659;">
        ${pdfSrc ?
            `<embed src="${pdfSrc}" type="application/pdf" width="100%" height="100%" />` :
            `<div class="pdf-icon">📕</div><h3>${file.name}</h3><p>Real PDF preview requires a file upload.</p>`
        }
      </div>
      <div style="margin-top: 16px; font-size: 0.875rem; color: var(--text-muted); text-align: center;">
        Size: ${formatSize(file.size)} | Modified: ${file.date} | Status: ${status}
      </div>
    </div>
  `;
    return container;
}
