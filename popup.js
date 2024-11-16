document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('variables');
  const saveButton = document.getElementById('save');
  const status = document.getElementById('status');

  // Load current variables
  chrome.storage.sync.get('cssVariables', (data) => {
    if (data.cssVariables) {
      textarea.value = data.cssVariables.join('\n');
    }
  });

  saveButton.addEventListener('click', () => {
    const variables = textarea.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line); // Remove empty lines

    // Save to storage
    chrome.storage.sync.set({
      cssVariables: variables
    }, () => {
      // Check if we're on a WeWeb editor page before trying to send message
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          const currentTab = tabs[0];
          
          // Check if we're on a WeWeb editor page
          if (currentTab.url && currentTab.url.includes('editor.weweb.io')) {
            // Try to send message to content script
            chrome.tabs.sendMessage(
              currentTab.id, 
              { 
                type: 'variablesUpdated',
                variables: variables
              },
              // Add response callback to handle errors
              (response) => {
                if (chrome.runtime.lastError) {
                  // Content script not ready or not loaded
                  console.log('Content script not available:', chrome.runtime.lastError);
                  status.textContent = 'Variables saved! Refresh the WeWeb editor to apply changes.';
                } else {
                  status.textContent = 'Variables saved and applied!';
                }
              }
            );
          } else {
            // Not on WeWeb editor
            status.textContent = 'Variables saved! Open the WeWeb editor to use them.';
          }
        }
      });

      status.classList.remove('error');
      setTimeout(() => {
        status.textContent = '';
      }, 3000);
    });
  });
});