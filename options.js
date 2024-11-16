document.getElementById('save').addEventListener('click', () => {
    const source = document.getElementById('variablesSource').value;
    chrome.storage.sync.set({
      variablesSource: source
    }, () => {
      const status = document.getElementById('status');
      status.textContent = 'Settings saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  });
  
  chrome.storage.sync.get('variablesSource', (data) => {
    if (data.variablesSource) {
      document.getElementById('variablesSource').value = data.variablesSource;
    }
  });