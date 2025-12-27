export function formatSize(sizeMB) {
    if (sizeMB < 1) {
        return `${(sizeMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeMB.toFixed(1)} MB`;
}

export function getFileIcon(type) {
    const icons = {
        text: '📄',
        spreadsheet: '📊',
        pdf: '📕',
        image: '🖼️',
        dicom: '🩻',
        default: '📄'
    };
    return icons[type] || icons.default;
}
