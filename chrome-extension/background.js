// ORCHESTR Chrome Extension - Background Service Worker

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ORCHESTR Extension installed');
  } else if (details.reason === 'update') {
    console.log('ORCHESTR Extension updated');
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === 'openSettings') {
    chrome.runtime.openOptionsPage();
  }
  return true;
});

