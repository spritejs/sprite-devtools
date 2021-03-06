'use strict';

chrome.devtools.panels.elements.createSidebarPane('Spritejs', function (sidebar) {
  // DevTools page -- devtools.js
  // Create a connection to the background page
  var backgroundPageConnection = chrome.runtime.connect({
    name: 'devtools-page'
  });

  // sidebar.setObject({message: 'No element selected!'})
  sidebar.setPage('../sidebar.html');

  var timer = null;
  backgroundPageConnection.onMessage.addListener(function (message) {
    // Handle responses from the background page, if any
    if (message === 'init') {
      sidebar.setPage('../sidebar.html');
      return;
    }

    if (message.path) {
      message.path = JSON.stringify(message.path);
    }
    if (message.clip) {
      message.clip = JSON.stringify(message.clip);
    }
    if (!timer) {
      sidebar.setObject(message, 'Selected Element');
      timer = setTimeout(function () {
        timer = null;
      }, 100);
    }
  });

  backgroundPageConnection.postMessage({ name: 'init', tabId: chrome.devtools.inspectedWindow.tabId });
});