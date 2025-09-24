
// Popup script for {{EXTENSION_NAME}}

document.addEventListener('DOMContentLoaded', function() {
  // Load and display stats
  loadStats();

  // Button event listeners
  document.getElementById('clearData').addEventListener('click', clearData);
  document.getElementById('exportData').addEventListener('click', exportData);
  document.getElementById('testConnection').addEventListener('click', testConnection);
});

function loadStats() {
  chrome.storage.local.get(['pageCount', 'clickCount', 'dataSent'], function(result) {
    document.getElementById('pageCount').textContent = result.pageCount || 0;
    document.getElementById('clickCount').textContent = result.clickCount || 0;
    document.getElementById('dataSent').textContent = result.dataSent || 0;
  });
}

function clearData() {
  chrome.storage.local.clear(function() {
    loadStats();
    updateStatus('Data cleared successfully', 'success');
  });
}

function exportData() {
  chrome.storage.local.get(null, function(data) {
    const exportData = JSON.stringify(data, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: `${new Date().toISOString().split('T')[0]}_extension_data.json`
    });
    
    updateStatus('Data exported successfully', 'success');
  });
}

function testConnection() {
  updateStatus('Testing connection...', 'info');
  
  fetch('{{TRACKING_SERVER}}/api/test', {
    method: 'GET'
  })
  .then(response => {
    if (response.ok) {
      updateStatus('✅ Connection successful', 'success');
    } else {
      updateStatus('❌ Connection failed', 'error');
    }
  })
  .catch(error => {
    updateStatus('❌ Connection error', 'error');
  });
}

function updateStatus(message, type) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  
  // Reset to default after 3 seconds
  setTimeout(() => {
    statusElement.textContent = '✅ Extension Active';
    statusElement.className = 'status active';
  }, 3000);
}
