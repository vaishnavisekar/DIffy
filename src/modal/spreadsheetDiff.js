export function createSpreadsheetDiff(source, target, status) {
    const container = document.createElement('div');
    container.className = 'spreadsheet-diff';
    container.innerHTML = `
    <h3 style="margin-bottom: 2rem; text-align: center;">Spreadsheet Comparison</h3>
    <div style="padding: 2rem; text-align: center; color: var(--neutral-600);">
      <p>Spreadsheet comparison view is coming soon.</p>
      <p style="font-size: 0.8rem; margin-top: 1rem;">Status: ${status.toUpperCase()}</p>
    </div>
  `;
    return container;
}
