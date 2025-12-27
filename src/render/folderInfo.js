import { formatSize } from '../utils/format.js';

export function renderFolderInfo(folders) {
    const { sourceFolder, targetFolder } = folders;

    const leftName = document.getElementById('left-folder-name');
    const leftSize = document.getElementById('left-folder-size');
    const rightName = document.getElementById('right-folder-name');
    const rightSize = document.getElementById('right-folder-size');

    if (leftName) leftName.textContent = sourceFolder.name;
    if (leftSize) leftSize.textContent = formatSize(sourceFolder.totalSize);

    if (rightName) rightName.textContent = targetFolder.name;
    if (rightSize) rightSize.textContent = formatSize(targetFolder.totalSize);
}
