const cssVariables = [
    '--gray-0', '--gray-1', '--gray-2', '--gray-3', '--gray-4', '--gray-5', '--gray-6', '--gray-7', '--gray-8', '--gray-9', '--gray-10', '--gray-11', '--gray-12',
    '--stone-0', '--stone-1', '--stone-2', '--stone-3', '--stone-4', '--stone-5', '--stone-6', '--stone-7', '--stone-8', '--stone-9', '--stone-10', '--stone-11', '--stone-12',
    '--red-0', '--red-1', '--red-2', '--red-3', '--red-4', '--red-5', '--red-6', '--red-7', '--red-8', '--red-9', '--red-10', '--red-11', '--red-12',
    '--pink-0', '--pink-1', '--pink-2', '--pink-3', '--pink-4', '--pink-5', '--pink-6', '--pink-7', '--pink-8', '--pink-9', '--pink-10', '--pink-11', '--pink-12',
    '--purple-0', '--purple-1', '--purple-2', '--purple-3', '--purple-4', '--purple-5', '--purple-6', '--purple-7', '--purple-8', '--purple-9', '--purple-10', '--purple-11', '--purple-12',
    '--violet-0', '--violet-1', '--violet-2', '--violet-3', '--violet-4', '--violet-5', '--violet-6', '--violet-7', '--violet-8', '--violet-9', '--violet-10', '--violet-11', '--violet-12',
    '--indigo-0', '--indigo-1', '--indigo-2', '--indigo-3', '--indigo-4', '--indigo-5', '--indigo-6', '--indigo-7', '--indigo-8', '--indigo-9', '--indigo-10', '--indigo-11', '--indigo-12',
    '--blue-0', '--blue-1', '--blue-2', '--blue-3', '--blue-4', '--blue-5', '--blue-6', '--blue-7', '--blue-8', '--blue-9', '--blue-10', '--blue-11', '--blue-12',
    '--cyan-0', '--cyan-1', '--cyan-2', '--cyan-3', '--cyan-4', '--cyan-5', '--cyan-6', '--cyan-7', '--cyan-8', '--cyan-9', '--cyan-10', '--cyan-11', '--cyan-12',
    '--teal-0', '--teal-1', '--teal-2', '--teal-3', '--teal-4', '--teal-5', '--teal-6', '--teal-7', '--teal-8', '--teal-9', '--teal-10', '--teal-11', '--teal-12',
    '--green-0', '--green-1', '--green-2', '--green-3', '--green-4', '--green-5', '--green-6', '--green-7', '--green-8', '--green-9', '--green-10', '--green-11', '--green-12',
    '--lime-0', '--lime-1', '--lime-2', '--lime-3', '--lime-4', '--lime-5', '--lime-6', '--lime-7', '--lime-8', '--lime-9', '--lime-10', '--lime-11', '--lime-12',
    '--yellow-0', '--yellow-1', '--yellow-2', '--yellow-3', '--yellow-4', '--yellow-5', '--yellow-6', '--yellow-7', '--yellow-8', '--yellow-9', '--yellow-10', '--yellow-11', '--yellow-12',
    '--orange-0', '--orange-1', '--orange-2', '--orange-3', '--orange-4', '--orange-5', '--orange-6', '--orange-7', '--orange-8', '--orange-9', '--orange-10', '--orange-11', '--orange-12',
    '--choco-0', '--choco-1', '--choco-2', '--choco-3', '--choco-4', '--choco-5', '--choco-6', '--choco-7', '--choco-8', '--choco-9', '--choco-10', '--choco-11', '--choco-12',
    '--brown-0', '--brown-1', '--brown-2', '--brown-3', '--brown-4', '--brown-5', '--brown-6', '--brown-7', '--brown-8', '--brown-9', '--brown-10', '--brown-11', '--brown-12',
    '--sand-0', '--sand-1', '--sand-2', '--sand-3', '--sand-4', '--sand-5', '--sand-6', '--sand-7', '--sand-8', '--sand-9', '--sand-10', '--sand-11', '--sand-12',
    '--camo-0', '--camo-1', '--camo-2', '--camo-3', '--camo-4', '--camo-5', '--camo-6', '--camo-7', '--camo-8', '--camo-9', '--camo-10', '--camo-11', '--camo-12',
    '--jungle-0', '--jungle-1', '--jungle-2', '--jungle-3', '--jungle-4', '--jungle-5', '--jungle-6', '--jungle-7', '--jungle-8', '--jungle-9', '--jungle-10', '--jungle-11', '--jungle-12'
];

class Autocomplete {
    constructor() {
        this.container = null;
        this.targetInput = null;
        this.suggestions = [];
        this.selectedIndex = -1;

        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'ww-autocomplete-container ww-scroll-bar';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);

        // Add event listeners
        document.addEventListener('focusin', this.handleFocus.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }

    handleFocus(event) {
        if (this.isCSSInput(event.target)) {
            this.targetInput = event.target;
            this.setupContentObserver();
            this.showSuggestions();
        }
    }

    setupContentObserver() {
        if (this.observer) {
            this.observer.disconnect();
        }
    
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    this.handleInput();
                }
            });
        });
    
        this.observer.observe(this.targetInput, {
            characterData: true,
            childList: true,
            subtree: true
        });
    
        // Add input event listener to catch all text changes
        this.targetInput.addEventListener('input', this.handleInput.bind(this));
    }

    isCSSInput(element) {
        return element.classList.contains('ww-formula-input');
    }

    handleInput() {
        const value = this.targetInput.textContent || '';
        this.filterSuggestions(value);
        this.showSuggestions();
    }

    filterSuggestions(value) {
        if (!value) {
            this.suggestions = cssVariables;
        } else {
            // Remove quotes from the search value to match against variables
            const searchValue = value.replace(/["']/g, '').toLowerCase();
            this.suggestions = cssVariables.filter(variable =>
                variable.toLowerCase().includes(searchValue)
            );
        }
        this.selectedIndex = -1;
    }

    showSuggestions() {
        if (!this.suggestions.length) {
            this.container.style.display = 'none';
            return;
        }

        const rect = this.targetInput.getBoundingClientRect();
        this.container.style.top = `${rect.bottom + window.scrollY}px`;
        this.container.style.left = `${rect.left + window.scrollX}px`;
        this.container.style.width = `${rect.width}px`;

        this.container.innerHTML = this.suggestions
            .map((suggestion, index) => `
          <div class="ww-autocomplete-item ${index === this.selectedIndex ? 'selected' : ''}"
               data-index="${index}">
            ${suggestion}
          </div>
        `)
            .join('');

        this.container.style.display = 'block';

        this.container.querySelectorAll('.ww-autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectSuggestion(parseInt(item.dataset.index));
            });
        });
    }

    handleKeydown(event) {
        if (!this.container.style.display || this.container.style.display === 'none') {
            return;
        }
    
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (this.selectedIndex === this.suggestions.length - 1) {
                    // If at the last item, loop to the first
                    this.selectedIndex = 0;
                } else {
                    this.selectedIndex = this.selectedIndex + 1;
                }
                this.showSuggestions();
                this.scrollToSelectedItem();
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (this.selectedIndex <= 0) {
                    // If at the first item or no selection, loop to the last
                    this.selectedIndex = this.suggestions.length - 1;
                } else {
                    this.selectedIndex = this.selectedIndex - 1;
                }
                this.showSuggestions();
                this.scrollToSelectedItem();
                break;
            case 'Enter':
                if (this.selectedIndex >= 0) {
                    event.preventDefault();
                    this.selectSuggestion(this.selectedIndex);
                }
                break;
            case 'Escape':
                this.container.style.display = 'none';
                break;
        }
    }

    scrollToSelectedItem() {
        if (this.selectedIndex >= 0) {
            const selectedElement = this.container.querySelector(`[data-index="${this.selectedIndex}"]`);
            if (selectedElement) {
                // Get container's scroll position and dimensions
                const containerRect = this.container.getBoundingClientRect();
                const elementRect = selectedElement.getBoundingClientRect();

                // Check if element is outside the visible area
                const isAbove = elementRect.top < containerRect.top;
                const isBelow = elementRect.bottom > containerRect.bottom;

                if (isAbove) {
                    // Scroll element into view at the top
                    selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else if (isBelow) {
                    // Scroll element into view at the bottom
                    selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
        }
    }

    selectSuggestion(index) {
        // Insert the variable with quotes
        const selectedVariable = this.suggestions[index];
        this.targetInput.textContent = `"var(${selectedVariable})"`;
        this.container.style.display = 'none';

        // Set focus back to the div
        this.targetInput.focus();

        // Position cursor at the end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(this.targetInput);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        // Dispatch input and change events
        this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    handleClickOutside(event) {
        if (!this.container.contains(event.target) && event.target !== this.targetInput) {
            this.container.style.display = 'none';
            if (this.observer) {
                this.observer.disconnect();
            }
        }
    }
}

// Initialize the autocomplete when the page loads
new Autocomplete();