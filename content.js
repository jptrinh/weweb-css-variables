const cssVariables = [
    "--gray-0: #f8f9fa"
];

class Autocomplete {
    constructor() {
        this.container = null;
        this.targetInput = null;
        this.suggestions = [];
        this.selectedIndex = -1;
        this.processedVariables = this.processCssVariables();

        this.init();
    }

    processCssVariables() {
        return cssVariables.map(variable => {
            const [name, value] = variable.split(': ');
            return {
                name: name,
                value: value
            };
        });
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'ww-autocomplete-container ww-scroll-bar';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);

        // Add styles for the color preview if not already added
        if (!document.getElementById('ww-autocomplete-styles')) {
            const styles = document.createElement('style');
            styles.id = 'ww-autocomplete-styles';
            styles.textContent = `
                .ww-autocomplete-item {
                    padding: 8px 12px;
                    cursor: pointer;
                }
                .ww-autocomplete-item.selected {
                    background-color: rgba(0, 0, 0, 0.05);
                }
                .ww-autocomplete-item-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .ww-autocomplete-color-preview {
                    width: 16px;
                    height: 16px;
                    border-radius: 4px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                }
                .ww-autocomplete-text {
                    flex: 1;
                }
            `;
            document.head.appendChild(styles);
        }

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
            this.suggestions = this.processedVariables;
        } else {
            const searchValue = value.replace(/["']/g, '').toLowerCase();
            this.suggestions = this.processedVariables.filter(variable =>
                variable.name.toLowerCase().includes(searchValue)
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
                    <div class="ww-autocomplete-item-content">
                        <span class="ww-autocomplete-color-preview" style="background-color: ${suggestion.value}"></span>
                        <span class="ww-autocomplete-text">${suggestion.name}</span>
                    </div>
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

    scrollToSelectedItem() {
        if (this.selectedIndex >= 0) {
            const selectedElement = this.container.querySelector(`[data-index="${this.selectedIndex}"]`);
            if (selectedElement) {
                const containerRect = this.container.getBoundingClientRect();
                const elementRect = selectedElement.getBoundingClientRect();

                const isAbove = elementRect.top < containerRect.top;
                const isBelow = elementRect.bottom > containerRect.bottom;

                if (isAbove) {
                    selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else if (isBelow) {
                    selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
        }
    }

    selectSuggestion(index) {
        const selectedVariable = this.suggestions[index].name;
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