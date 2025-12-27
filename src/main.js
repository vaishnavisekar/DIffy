import { setupUploadHandlers } from './upload/uploadHandler.js';
import { setupSidebarFilters } from './sidebar/filters.js';
import { closeModal, openFileDiff, openFileView } from './modal/modal.js';
import { setViewCallbacks } from './render/fileList.js';
import { compareFolders } from './compare/compareFolders.js';
import { renderFolderInfo } from './render/folderInfo.js';
import { renderSummary } from './render/summary.js';
import { renderFileList } from './render/fileList.js';
import { setGlobalComparisonData, setCurrentFilter } from './state.js';

const currentFolders = {
    sourceFolder: { name: 'Source', totalSize: 0, files: [] },
    targetFolder: { name: 'Target', totalSize: 0, files: [] }
};

export function initializeApp() {
    console.log('Modular DICOM Comparison App v3.0 Bootstrapping...');

    // Setup view callbacks for the renderer
    setViewCallbacks(prepareAndOpenDiff, prepareAndOpenView);

    // Initialize UI components
    setupUploadHandlers(currentFolders);
    setupSidebarFilters();

    // Modal close handler
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.onclick = closeModal;

    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };
    }

    // Check if we are in server mode
    checkServerMode(currentFolders);
}

async function checkServerMode(folders) {
    try {
        const response = await fetch('/api/comparison');
        if (response.ok) {
            const data = await response.json();
            console.log('Server Mode: Comparison data loaded from backend');

            folders.sourceFolder = {
                name: data.source.name || 'Source',
                totalSize: data.source.totalSize,
                files: data.source.files,
                mode: 'server'
            };
            folders.targetFolder = {
                name: data.target.name || 'Target',
                totalSize: data.target.totalSize,
                files: data.target.files,
                mode: 'server'
            };

            const comparison = compareFolders(folders.sourceFolder, folders.targetFolder);
            setGlobalComparisonData(comparison);
            setCurrentFilter('all');

            renderFolderInfo(folders);
            renderSummary(comparison);
            renderFileList(comparison);
        }
    } catch (e) {
        console.log('Client-only mode or server error:', e);
    }
}

export async function ensureFileContent(file, origin) {
    if (file.content !== undefined && file.content !== '') return true;

    if (file.type === 'text') {
        if (file.size > 50 && !confirm(`The file "${file.name}" is large (${file.size.toFixed(1)} MB). Loading it might freeze the browser. Continue?`)) {
            return false;
        }
        try {
            if (file.file) {
                // Client-side uploaded file
                file.content = await file.file.text();
            } else {
                // Server-side file
                const side = origin.toLowerCase(); // 'source' or 'target'
                const response = await fetch(`/files/${side}/${encodeURIComponent(file.relativePath || file.name)}`);
                if (response.ok) {
                    file.content = await response.text();
                } else {
                    console.error('Failed to fetch file from server:', response.statusText);
                    return false;
                }
            }
            return true;
        } catch (e) {
            console.error('Failed to load file content:', e);
            return false;
        }
    }

    // For binary files (images/dicom) we might need the Blob if not already present
    // But dicomParser handles the file object or we might need to fetch it too.
    if (file.type === 'dicom' || file.type === 'image') {
        if (!file.file) {
            const side = (origin === 'Source') ? 'source' : 'target';
            const response = await fetch(`/files/${side}/${encodeURIComponent(file.relativePath || file.name)}`);
            if (response.ok) {
                file.file = await response.blob();
            } else {
                return false;
            }
        }
    }

    return true;
}

export async function prepareAndOpenDiff(fileData) {
    if (fileData.source) {
        await ensureFileContent(fileData.source, 'Source');
    }
    if (fileData.target) {
        await ensureFileContent(fileData.target, 'Target');
    }
    openFileDiff(fileData);
}

export async function prepareAndOpenView(file, origin) {
    await ensureFileContent(file, origin);
    openFileView(file, origin);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
