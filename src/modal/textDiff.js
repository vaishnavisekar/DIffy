import { escapeHtml, highlightLineChanges } from '../utils/dom.js';

export function createTextDiff(source, target, status) {
  const container = document.createElement('div');
  container.className = 'text-diff';

  if (status === 'removed') {
    return createSinglePanelDiff(source.content, 'Source (Removed)', 'removed', true);
  } else if (status === 'added') {
    return createSinglePanelDiff(target.content, 'Target (Added)', 'added', false);
  } else {
    const sourceLines = source.content.split('\n');
    const targetLines = target.content.split('\n');
    const maxLines = Math.max(sourceLines.length, targetLines.length);

    container.innerHTML = `
      <div class="text-diff-container">
        <div class="diff-sub-panel">
          <div class="diff-sub-header">Source</div>
          <div class="diff-content-scroll" id="source-diff-content"></div>
        </div>
        <div class="diff-sub-panel">
          <div class="diff-sub-header">Target</div>
          <div class="diff-content-scroll" id="target-diff-content"></div>
        </div>
      </div>
    `;

    const sourceContent = container.querySelector('#source-diff-content');
    const targetContent = container.querySelector('#target-diff-content');

    for (let i = 0; i < maxLines; i++) {
      const sLine = sourceLines[i] || '';
      const tLine = targetLines[i] || '';
      const isChanged = sLine !== tLine;

      sourceContent.appendChild(createDiffLine(i + 1, sLine, isChanged ? 'removed' : '', isChanged ? tLine : null));
      targetContent.appendChild(createDiffLine(i + 1, tLine, isChanged ? 'added' : '', isChanged ? sLine : null));
    }
  }

  return container;
}

export function createSinglePanelDiff(content, header, status, isLeft) {
  const container = document.createElement('div');
  container.className = 'text-diff';

  const lines = content.split('\n');
  container.innerHTML = `
    <div class="text-diff-container">
      <div class="diff-sub-panel">
        <div class="diff-sub-header">${header}</div>
        <div class="diff-content-scroll">
          ${lines.map((line, i) => `
            <div class="diff-line ${status}">
              <div class="line-num">${i + 1}</div>
              <div class="line-content">${escapeHtml(line)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  return container;
}

export function createDiffLine(num, content, status, otherSideContent) {
  const line = document.createElement('div');
  line.className = `diff-line ${status}`;

  const numEl = document.createElement('div');
  numEl.className = 'line-num';
  numEl.textContent = num;

  const contentEl = document.createElement('div');
  contentEl.className = 'line-content';

  if (status && otherSideContent !== null) {
    contentEl.innerHTML = highlightLineChanges(content, otherSideContent);
  } else {
    contentEl.textContent = content;
  }

  line.appendChild(numEl);
  line.appendChild(contentEl);
  return line;
}



export function createDivider() {
  const div = document.createElement('div');
  div.className = 'diff-divider';
  div.innerHTML = '<span>...</span>';
  return div;
}
