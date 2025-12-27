import { globalComparisonData, currentFilter, setCurrentFilter } from '../state.js';
import { renderFileList } from '../render/fileList.js';

export function setupSidebarFilters() {
    const navAll = document.getElementById('nav-all');
    if (navAll) {
        navAll.onclick = function () {
            setCurrentFilter('all');
            updateActiveNavItem(this);
            renderFileList(globalComparisonData);
        };
    }

    document.querySelectorAll('.status-filter').forEach(item => {
        item.onclick = function () {
            const status = this.getAttribute('data-status');
            toggleFilter(status, this);
        };
    });
}

export function updateActiveNavItem(activeItem) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
}

export function toggleFilter(status, element) {
    if (currentFilter === status) {
        setCurrentFilter('all');
        updateActiveNavItem(document.getElementById('nav-all'));
    } else {
        setCurrentFilter(status);
        updateActiveNavItem(element);
    }
    renderFileList(globalComparisonData);
}
