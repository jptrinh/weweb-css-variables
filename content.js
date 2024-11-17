class Autocomplete {
    // 1. Constructor
    constructor() {
        this.container = null;
        this.targetInput = null;
        this.suggestions = [];
        this.selectedIndex = -1;
        this.variables = [];

        this.loadVariables().then(() => {
            this.init();
        });
    }

    // 2. Core Initialization & Loading
    init() {
        this.container = document.createElement('div');
        this.container.className = 'autocomplete-container ww-scroll-bar';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);

        document.addEventListener('focusin', this.handleFocus.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }

    async loadVariables() {
        return new Promise((resolve) => {
            chrome.storage.sync.get('cssVariables', (data) => {
                if (data.cssVariables) {
                    this.variables = data.cssVariables;
                }
                resolve();
            });
        });
    }

    async reloadVariables() {
        await this.loadVariables();
        if (this.targetInput) {
            this.handleInput();
        }
    }

    // 3. Event Handlers
    handleFocus(event) {
        if (this.isCSSInput(event.target)) {
            this.targetInput = event.target;
            this.setupContentObserver();
            this.showSuggestions();
        }
    }

    handleInput() {
        const value = this.targetInput.textContent || '';
        this.filterSuggestions(value);
        this.showSuggestions();
    }

    handleKeydown(event) {
        if (!this.container.style.display || this.container.style.display === 'none') {
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (this.selectedIndex === this.suggestions.length - 1) {
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

    handleClickOutside(event) {
        if (!this.container.contains(event.target) && event.target !== this.targetInput) {
            this.container.style.display = 'none';
            if (this.observer) {
                this.observer.disconnect();
            }
        }
    }

    // 4. Setup & Utility Methods
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

        this.targetInput.addEventListener('input', this.handleInput.bind(this));
    }

    isCSSInput(element) {
        return element.classList.contains('ww-formula-input');
    }

    parseVariable(variableString) {
        const [name, value] = variableString.split(': ');
        return {
            name: name.trim(),
            value: value.trim()
        };
    }

    // 5. Suggestion Management
    filterSuggestions(value) {
        if (!value) {
            this.suggestions = [...this.variables];
        } else {
            // Clean up search value: remove quotes, optional dashes at start
            const searchValue = value
                .replace(/["']/g, '') // remove quotes
                .replace(/^-{0,2}/, '') // remove up to two dashes at the start
                .toLowerCase();

            this.suggestions = this.variables.filter(variable => {
                // Get the variable name and clean it the same way
                const { name } = this.parseVariable(variable);
                const cleanName = name
                    .replace(/^-{0,2}/, '')
                    .toLowerCase();
                
                return cleanName.startsWith(searchValue);
            });
        }
        this.selectedIndex = this.suggestions.length > 0 ? 0 : -1;
    }

    showSuggestions() {
        if (!this.suggestions || !this.suggestions.length) {
            this.container.style.display = 'none';
            return;
        }

        const rect = this.targetInput.getBoundingClientRect();
        this.container.style.top = `${rect.bottom + window.scrollY}px`;
        this.container.style.left = `${rect.left + window.scrollX}px`;
        this.container.style.width = `${rect.width}px`;
        this.container.style.display = 'block';

        this.container.innerHTML = this.suggestions
            .map((suggestion, index) => {
                const color = this.parseVariable(suggestion);
                return `
                    <div class="autocomplete-item ${index === this.selectedIndex ? 'selected' : ''}"
                         data-index="${index}">
                        <div class="color-preview" style="background-color: ${color.value}"></div>
                        <div class="variable-name">${color.name}</div>
                    </div>
                `;
            })
            .join('');

        this.container.querySelectorAll('.ww-autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.selectSuggestion(index);
            });
        });

        requestAnimationFrame(() => {
            this.container.style.display = 'block';
            this.container.style.opacity = '1';
        });
    }

    scrollToSelectedItem() {
        if (this.selectedIndex >= 0) {
            const selectedElement = this.container.querySelector(`[data-index="${this.selectedIndex}"]`);
            if (selectedElement) {
                const containerRect = this.container.getBoundingClientRect();
                const elementRect = selectedElement.getBoundingClientRect();

                const isAbove = elementRect.top < containerRect.top;
                const isBelow = elementRect.bottom > containerRect.bottom;

                if (isAbove || isBelow) {
                    selectedElement.scrollIntoView({ block: 'nearest', behavior: 'auto' });
                }
            }
        }
    }

    selectSuggestion(index) {
        const selectedVariable = this.parseVariable(this.suggestions[index]).name;
        this.targetInput.textContent = `"var(${selectedVariable})"`;
        this.container.style.display = 'none';

        this.targetInput.focus();

        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(this.targetInput);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

// Initialize and setup message listener
const autocomplete = new Autocomplete();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'variablesUpdated') {
        autocomplete.variables = message.variables;
        autocomplete.handleInput();
        sendResponse({ status: 'success' });
    }
    return true;
});