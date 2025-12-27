import { getFileIcon } from '../utils/format.js';
import { cleanupObjectURLs } from '../utils/objectUrl.js';
import { createTextDiff, createSinglePanelDiff } from './textDiff.js';
import { createImageDiff } from './imageDiff.js';
import { createPdfDiff } from './pdfDiff.js';
import { createSpreadsheetDiff } from './spreadsheetDiff.js';
import { createDicomDiff } from './dicomDiff.js';
import { parseDicomMetadata, parseDicomPixelData } from '../dicom/dicomParser.js';
import { renderDicomToCanvas } from '../dicom/dicomRenderer.js';
import { escapeHtml } from '../utils/dom.js';
import { formatSize } from '../utils/format.js';

export function openFileDiff(fileData) {
  if (!fileData) return;

  const { source, target, name, status } = fileData;
  const modal = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalStatus = document.getElementById('modal-status');
  const modalIcon = document.getElementById('modal-file-icon');
  const modalBody = document.getElementById('modal-body');

  const labelText = status === 'unchanged' ? 'IDENTICAL' : (status === 'changed' ? 'DIFFERENCES FOUND' : status.toUpperCase());
  modalTitle.textContent = name;
  modalStatus.textContent = labelText;
  modalStatus.className = `status-capsule ${status}`;

  const fileType = source?.type || target?.type;
  modalIcon.textContent = getFileIcon(fileType);

  modalBody.innerHTML = '';
  modalBody.classList.remove('hide-matched');
  const dToggle = document.getElementById('modal-diff-toggle');
  if (dToggle) dToggle.checked = false;

  const tContainer = document.getElementById('modal-diff-toggle-container');
  if (tContainer) tContainer.style.display = 'flex';

  switch (fileType) {
    case 'text':
      modalBody.appendChild(createTextDiff(source, target, status));
      break;
    case 'spreadsheet':
      modalBody.appendChild(createSpreadsheetDiff(source, target, status));
      break;
    case 'pdf':
      modalBody.appendChild(createPdfDiff(source, target, status));
      break;
    case 'image':
      modalBody.appendChild(createImageDiff(source, target, status));
      break;
    case 'dicom':
      modalBody.appendChild(createDicomDiff(source, target, status));
      break;
    default:
      modalBody.appendChild(createUnsupportedDiff(source, target, status));
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Attach toggle handler
  if (dToggle) {
    // Remove old listener if any (though we usually replace innerHTML or similar, 
    // but here we just ensure the listener is active)
    dToggle.onchange = (e) => {
      if (e.target.checked) {
        modalBody.classList.add('hide-matched');
      } else {
        modalBody.classList.remove('hide-matched');
      }
    };
  }
}

export function closeModal() {
  const modal = document.getElementById('modal-overlay');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
  cleanupObjectURLs();
}

export function openFileView(file, origin) {
  const modal = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalStatus = document.getElementById('modal-status');
  const modalIcon = document.getElementById('modal-file-icon');
  const modalBody = document.getElementById('modal-body');
  const toggleContainer = document.getElementById('modal-diff-toggle-container');

  modalTitle.textContent = `${file.name} (${origin})`;
  modalStatus.textContent = 'READY';
  modalStatus.className = 'status-capsule unchanged';
  modalIcon.textContent = getFileIcon(file.type);

  if (toggleContainer) toggleContainer.style.display = 'none';

  modalBody.innerHTML = '';
  modalBody.classList.remove('hide-matched');

  const container = document.createElement('div');
  container.className = 'text-diff';

  let contentHtml = '';
  switch (file.type) {
    case 'text':
      const lines = file.content.split('\n');
      contentHtml = `
        <div class="text-diff-container single-panel">
          <div class="diff-sub-panel">
            <div class="diff-sub-header">${origin} Content</div>
            <div class="diff-content-scroll">
              ${lines.map((line, i) => `
                <div class="diff-line">
                  <div class="line-num">${i + 1}</div>
                  <div class="line-content">${escapeHtml(line)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      break;

    case 'image':
      contentHtml = `
        <div class="text-diff-container single-panel">
          <div class="diff-sub-panel" style="align-items: center; justify-content: center; padding: 40px; overflow: auto;">
            <div style="font-size: 8rem; margin-bottom: 24px;">🖼️</div>
            <h3 style="margin-top: 24px;">${file.name}</h3>
            <div class="image-metadata" style="margin-top: 24px; width: 100%; max-width: 400px;">
              <div class="metadata-row"><span>File Size:</span><strong>${formatSize(file.size)}</strong></div>
              <div class="metadata-row"><span>Last Modified:</span><strong>${file.date}</strong></div>
            </div>
          </div>
        </div>
      `;
      break;

    case 'dicom':
      const canvasId = `dicom-canvas-${Math.random().toString(36).substr(2, 9)}`;
      const tableBodyId = `dicom-table-body-${Math.random().toString(36).substr(2, 9)}`;

      contentHtml = `
        <div class="dicom-diff" style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
          <div style="display: flex; gap: 24px; background: var(--bg-app); border-radius: 12px; padding: 24px; border: 1px solid var(--border-light);">
            <div class="dicom-pixel-preview" style="width: 300px; height: 300px; position: relative;">
              <canvas id="${canvasId}" style="width: 100%; height: 100%; object-fit: contain; background: black;"></canvas>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
              <h3>Real DICOM Scan (${origin})</h3>
              <p style="color: var(--text-muted); font-size: 0.875rem;">Binary data parsed from <strong>${file.name}</strong></p>
            </div>
          </div>
          <table class="diff-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid var(--border-light);">
                <th style="padding: 12px; text-align: left; width: 120px;">DICOM Tag</th>
                <th style="padding: 12px; text-align: left; width: 200px;">Attribute</th>
                <th style="padding: 12px; text-align: left;">Value</th>
              </tr>
            </thead>
            <tbody id="${tableBodyId}" style="font-size: 0.875rem;">
               <tr><td colspan="3" style="padding:20px; text-align:center;">Loading Metadata...</td></tr>
            <tbody>
          </table>
        </div>
      `;

      (async () => {
        setTimeout(() => {
          const canvas = document.getElementById(canvasId);
          if (canvas && file.file) {
            parseDicomPixelData(file.file).then(pixelInfo => {
              if (pixelInfo) renderDicomToCanvas(canvas, pixelInfo);
            });
          }
        }, 0);

        const dicomMeta = file.file ? await parseDicomMetadata(file.file) : { error: 'No File' };
        const dicomTags = [
          { label: 'Patient Name', key: 'patientName', tag: '(0010,0010)' },
          { label: 'Patient ID', key: 'patientId', tag: '(0010,0020)' },
          { label: 'Study Date', key: 'studyDate', tag: '(0008,0020)' },
          { label: 'Modality', key: 'modality', tag: '(0008,0060)' },
          { label: 'Series Description', key: 'seriesDesc', tag: '(0008,103E)' }
        ];

        const tbody = document.getElementById(tableBodyId);
        if (tbody) {
          tbody.innerHTML = dicomTags.map(tag => `
                <tr style="border-bottom: 1px solid var(--border-light);">
                  <td style="padding: 12px; color: var(--text-light); font-family: var(--font-mono); font-size: 0.75rem;">${tag.tag}</td>
                  <td style="padding: 12px; font-weight: 500;">${tag.label}</td>
                  <td style="padding: 12px; color: var(--text-main);">${dicomMeta[tag.key] || '—'}</td>
                </tr>
             `).join('');
        }
      })();
      break;

    default:
      contentHtml = `<div style="padding: 2rem; text-align: center;">Unsupported file view</div>`;
  }

  container.innerHTML = contentHtml;
  modalBody.appendChild(container);
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function createUnsupportedDiff(source, target, status) {
  const div = document.createElement('div');
  div.innerHTML = '<div style="padding: 2rem; text-align: center;">Unsupported diff view</div>';
  return div;
}
