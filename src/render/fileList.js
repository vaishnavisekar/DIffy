import { getFileIcon, formatSize } from '../utils/format.js';
import { currentFilter } from '../state.js';

let prepareAndOpenDiffFn = null;
let prepareAndOpenViewFn = null;

export function setViewCallbacks(diffFn, viewFn) {
    prepareAndOpenDiffFn = diffFn;
    prepareAndOpenViewFn = viewFn;
}

export function renderFileList(comparison) {
    const fileList = document.getElementById('file-list');
    if (!fileList) return;

    fileList.innerHTML = '';

    if (!comparison) {
        console.warn('Comparison data not ready');
        return;
    }

    let allFiles = [
        ...(comparison.removed || []).map(f => ({ ...f, status: 'removed' })),
        ...(comparison.added || []).map(f => ({ ...f, status: 'added' })),
        ...(comparison.changed || []).map(f => ({ ...f, status: 'changed' })),
        ...(comparison.unchanged || []).map(f => ({ ...f, status: 'unchanged' }))
    ].sort((a, b) => a.name.localeCompare(b.name));

    if (currentFilter !== 'all') {
        allFiles = allFiles.filter(file => file.status === currentFilter);
    }

    if (allFiles.length === 0) {
        fileList.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--neutral-600);">
        No files match the current filter.
      </div>
    `;
        return;
    }

    allFiles.forEach(fileData => {
        const row = createFileRow(fileData);
        fileList.appendChild(row);
    });
}

export function createFileRow(fileData) {
    const { source, target, name, status } = fileData;

    const row = document.createElement('div');
    row.className = `file-row ${status}`;

    const leftItem = document.createElement('div');
    leftItem.className = 'file-cell';
    if (source) {
        const sizeChanged = status === 'changed' && target && source.size !== target.size;
        const dateChanged = status === 'changed' && target && source.date !== target.date;

        leftItem.innerHTML = `
      <div class="file-icon">${getFileIcon(source.type)}</div>
      <div class="file-info">
        <div class="file-name">${source.relativePath || source.name}</div>
        <div class="file-details">
          <span class="${sizeChanged ? 'changed-meta' : ''}">${formatSize(source.size)}</span>
          <span class="${dateChanged ? 'changed-meta' : ''}">${source.date}</span>
        </div>
      </div>
    `;
        leftItem.appendChild(createViewButton(source, 'Source'));
    } else {
        leftItem.innerHTML = '<div class="file-name" style="opacity: 0.3; padding-left: 48px;">—</div>';
    }

    const rightItem = document.createElement('div');
    rightItem.className = 'file-cell';
    if (target) {
        const sizeChanged = status === 'changed' && source && source.size !== target.size;
        const dateChanged = status === 'changed' && source && source.date !== target.date;

        rightItem.innerHTML = `
      <div class="file-icon">${getFileIcon(target.type)}</div>
      <div class="file-info">
        <div class="file-name">${target.relativePath || target.name}</div>
        <div class="file-details">
          <span class="${sizeChanged ? 'changed-meta' : ''}">${formatSize(target.size)}</span>
          <span class="${dateChanged ? 'changed-meta' : ''}">${target.date}</span>
        </div>
      </div>
    `;
        rightItem.appendChild(createViewButton(target, 'Target'));
    } else {
        rightItem.innerHTML = '<div class="file-name" style="opacity: 0.3; padding-left: 48px;">—</div>';
    }

    row.appendChild(leftItem);
    row.appendChild(rightItem);

    row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-view')) return;
        if (prepareAndOpenDiffFn) prepareAndOpenDiffFn(fileData);
    });

    return row;
}

export function createViewButton(file, origin) {
    const btn = document.createElement('button');
    btn.className = 'btn-view';
    btn.innerHTML = 'View';
    btn.onclick = (e) => {
        e.stopPropagation();
        if (prepareAndOpenViewFn) prepareAndOpenViewFn(file, origin);
    };
    return btn;
}
