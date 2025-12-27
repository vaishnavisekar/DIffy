import { computeFileHash } from '../utils/hash.js';
import { compareFolders } from '../compare/compareFolders.js';
import { renderFolderInfo } from '../render/folderInfo.js';
import { renderSummary } from '../render/summary.js';
import { renderFileList } from '../render/fileList.js';
import { setGlobalComparisonData, setCurrentFilter } from '../state.js';

export function setupUploadHandlers(currentFolders) {
    const leftUpload = document.getElementById('upload-left');
    const rightUpload = document.getElementById('upload-right');

    if (leftUpload)
        leftUpload.addEventListener('change', (e) =>
            handleUpload(e, 'left', currentFolders)
        );
    if (rightUpload)
        rightUpload.addEventListener('change', (e) =>
            handleUpload(e, 'right', currentFolders)
        );
}

export async function handleUpload(event, side, folders) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    console.log(`Uploading ${files.length} file(s) for ${side} side`);

    const ignoredFiles = ['.ds_store', 'thumbs.db', 'desktop.ini'];
    const filteredFiles = files.filter(file => !ignoredFiles.includes(file.name.toLowerCase()));

    const filePromises = filteredFiles.map(async (file) => {
        const nameParts = file.name.split('.');
        const extension = nameParts.length > 1 ? nameParts.pop().toLowerCase() : '';
        const baseName = nameParts.join('.').toLowerCase();

        let type = 'default';
        const textExtensions = ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'c', 'cpp', 'h', 'xml', 'yaml', 'yml', 'sh', 'sql'];
        if (textExtensions.includes(extension) || baseName === 'readme') type = 'text';
        else if (['xlsx', 'xls', 'csv'].includes(extension)) type = 'spreadsheet';
        else if (['pdf'].includes(extension)) type = 'pdf';
        else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) type = 'image';
        else if (['dcm', 'dicom'].includes(extension)) type = 'dicom';

        let content = '';
        if (type === 'text') {
            try {
                content = await file.text();
            } catch (e) {
                console.warn('Failed to read text file:', file.name, e);
            }
        }

        let contentHash = null;
        try {
            contentHash = await computeFileHash(file, type === 'text');
        } catch (e) {
            console.warn('Hash computation failed:', file.name, e);
        }

        // --- USE ONLY THE FILE NAME ---
        const fileName = file.name;

        return {
            name: fileName,
            size: file.size / (1024 * 1024),
            date: new Date(file.lastModified).toISOString().split('T')[0],
            type,
            content,
            contentHash,
            file
        };
    });

    const processedFiles = await Promise.all(filePromises);
    const validFiles = processedFiles.filter(f => f.name);

    // --- Step 3: Update folders ---
    const folderName = side === 'left' ? 'Source' : 'Target';
    const newFolder = {
        name: folderName,
        totalSize: Math.round(validFiles.reduce((acc, f) => acc + f.size, 0) * 100) / 100,
        files: validFiles
    };

    if (side === 'left') folders.sourceFolder = newFolder;
    else folders.targetFolder = newFolder;

    // --- Step 4: Compare and render ---
    const comparison = compareFolders(folders.sourceFolder, folders.targetFolder);
    setGlobalComparisonData(comparison);
    setCurrentFilter('all');

    renderFolderInfo(folders);
    renderSummary(comparison);
    renderFileList(comparison);

    // Reset active summary highlight
    document.querySelectorAll('.summary-item').forEach(item => item.classList.remove('active'));
}
