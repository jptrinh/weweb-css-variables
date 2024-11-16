class Autocomplete {
    constructor() {
        this.container = null;
        this.targetInput = null;
        this.suggestions = [];
        this.selectedIndex = -1;
        this.variables = []; // Initialize empty variables array

        this.loadVariables().then(() => {
            console.log('Variables loaded:', this.variables);
            this.init();
        });
    }

    async loadVariables() {
        return new Promise((resolve) => {
            chrome.storage.sync.get('cssVariables', (data) => {
                if (data.cssVariables) {
                    this.variables = data.cssVariables;
                    console.log('Loaded variables from storage:', this.variables);
                }
                resolve();
            });
        });
    }

    filterSuggestions(value) {
        if (!value) {
            this.suggestions = [...this.variables]; // Use this.variables and create a copy
        } else {
            const searchValue = value.replace(/["']/g, '').toLowerCase();
            this.suggestions = this.variables.filter(variable =>
                variable.toLowerCase().includes(searchValue)
            );
        }
        console.log('Filtered suggestions:', this.suggestions);
        this.selectedIndex = -1;
    }

    async reloadVariables() {
        console.log('Reloading variables...');
        await this.loadVariables();
        if (this.targetInput) {
            this.handleInput();
        }
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
        console.log('Input value:', value);
        this.filterSuggestions(value);
        this.showSuggestions();
    }

    parseVariable(variableString) {
        const [name, value] = variableString.split(': ');
        return {
            name: name.trim(),
            value: value.trim()
        };
    }

    showSuggestions() {
        console.log('Showing suggestions:', this.suggestions);
        
        if (!this.suggestions || !this.suggestions.length) {
            console.log('No suggestions to show');
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
                    <div class="ww-autocomplete-item ${index === this.selectedIndex ? 'selected' : ''}"
                         data-index="${index}">
                        <div class="ww-color-preview" style="background-color: ${color.value}"></div>
                        <div class="ww-variable-name">${color.name}</div>
                    </div>
                `;
            })
            .join('');

        this.container.querySelectorAll('.ww-autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                console.log('Suggestion clicked:', index);
                this.selectSuggestion(index);
            });
        });

        requestAnimationFrame(() => {
            this.container.style.display = 'block';
            this.container.style.opacity = '1';
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
        const selectedVariable = this.parseVariable(this.suggestions[index]).name;
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
const autocomplete = new Autocomplete();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'variablesUpdated') {
        console.log('Variables updated:', message.variables);
        autocomplete.variables = message.variables;
        autocomplete.handleInput();
        // Send response to avoid connection error
        sendResponse({ status: 'success' });
    }
    return true; // Keep the message channel open for async responses
});