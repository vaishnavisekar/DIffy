import { parseDicomMetadata, parseDicomPixelData } from '../dicom/dicomParser.js';
import { renderDicomToCanvas } from '../dicom/dicomRenderer.js';
import { formatSize } from '../utils/format.js';
import { highlightLineChanges } from '../utils/dom.js';

export function createDicomDiff(source, target, status) {
  const container = document.createElement('div');
  container.className = 'dicom-diff-container';

  const sId = `canvas-s-${Math.random().toString(36).substr(2, 9)}`;
  const tId = `canvas-t-${Math.random().toString(36).substr(2, 9)}`;
  const tableId = `table-${Math.random().toString(36).substr(2, 9)}`;

  const labelText = status === 'unchanged' ? 'IDENTICAL' : (status === 'changed' ? 'DIFFERENCES FOUND' : status.toUpperCase());

  container.innerHTML = `
    <div class="dicom-header-info">
      <div class="status-capsule ${status}">${labelText}</div>
    </div>
    <div class="dicom-previews-container">
      <div class="dicom-previews">
        <div class="dicom-view">
          <div class="view-header">Source File</div>
          <div class="dicom-canvas-container">
            <canvas id="${sId}" class="dicom-canvas"></canvas>
          </div>
        </div>
        <div class="dicom-view">
          <div class="view-header">Target File</div>
          <div class="dicom-canvas-container">
            <canvas id="${tId}" class="dicom-canvas"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="dicom-metadata-container">
      <table class="diff-table dicom-metadata-table">
        <thead>
          <tr>
            <th>DICOM Tag</th>
            <th>Attribute</th>
            <th>Source Value</th>
            <th>Target Value</th>
          </tr>
        </thead>
        <tbody id="${tableId}">
          <tr><td colspan="4" style="text-align:center; padding: 2rem;">Loading DICOM Metadata...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  // Async processing
  (async () => {
    const sMeta = source ? await parseDicomMetadata(source.file) : null;
    const tMeta = target ? await parseDicomMetadata(target.file) : null;

    const tbody = document.getElementById(tableId);
    if (tbody) {
      renderTable(tbody, sMeta, tMeta);
    }

    if (source && source.file) {
      const p = await parseDicomPixelData(source.file);
      if (p) renderDicomToCanvas(document.getElementById(sId), p);
    }
    if (target && target.file) {
      const p = await parseDicomPixelData(target.file);
      if (p) renderDicomToCanvas(document.getElementById(tId), p);
    }
  })();

  return container;
}

function renderTable(tbody, sMeta, tMeta) {
  const tags = [
    { label: 'Patient Name', key: 'patientName', tag: '(0010,0010)' },
    { label: 'Patient ID', key: 'patientId', tag: '(0010,0020)' },
    { label: 'Study Date', key: 'studyDate', tag: '(0008,0020)' },
    { label: 'Modality', key: 'modality', tag: '(0008,0060)' },
    { label: 'Series Description', key: 'seriesDesc', tag: '(0008,103E)' }
  ];

  tbody.innerHTML = tags.map(tag => {
    const sVal = sMeta ? sMeta[tag.key] : 'N/A';
    const tVal = tMeta ? tMeta[tag.key] : 'N/A';
    const isDiff = sVal !== tVal;

    return `
      <tr class="${isDiff ? 'row-diff' : 'row-matched'}">
        <td class="tag-code">${tag.tag}</td>
        <td class="tag-label">${tag.label}</td>
        <td class="tag-value ${isDiff ? 'val-removed' : ''}">${isDiff ? highlightLineChanges(sVal || '', tVal || '') : (sVal || '—')}</td>
        <td class="tag-value ${isDiff ? 'val-added' : ''}">${isDiff ? highlightLineChanges(tVal || '', sVal || '') : (tVal || '—')}</td>
      </tr>
    `;
  }).join('');
}
