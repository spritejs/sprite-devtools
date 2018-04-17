'use strict';

// background.js
var connections = {};

function postEvent(eventType) {
  var eventArgs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return '\n    ;(function(){\n      const event = new CustomEvent(\'' + eventType + '\', ' + JSON.stringify({ detail: eventArgs }) + ')\n      document.dispatchEvent(event)\n    }())\n  ';
}

chrome.runtime.onConnect.addListener(function (port) {
  // background.js

  var extensionListener = function extensionListener(message, sender, sendResponse) {
    // The original connection event doesn't include the tab ID of the
    // DevTools page, so we need to send it explicitly.
    if (port.name === 'devtools-page' && message.name === 'init') {
      var tabId = message.tabId;
      connections[tabId] = connections[tabId] || {};
      connections[tabId].devtools = port;

      chrome.tabs.executeScript(message.tabId, { code: postEvent('spritejs: devtools-opened') });

      port.onDisconnect.addListener(function (port) {
        chrome.tabs.executeScript(message.tabId, { code: postEvent('spritejs: devtools-closed') });
      });
    } else if (port.name === 'sprite-element' && message.name === 'init') {
      var _tabId = message.tabId;
      connections[_tabId].sidebar = port;
    } else if (port.name === 'sprite-element') {
      chrome.tabs.executeScript(message.tabId, { code: postEvent('spritejs: attr-change', message) });
    }
  };

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener(function (port) {
    port.onMessage.removeListener(extensionListener);

    var tabs = Object.keys(connections);
    for (var i = 0, len = tabs.length; i < len; i++) {
      if (connections[tabs[i]] === port) {
        delete connections[tabs[i]];
        break;
      }
    }
  });
});

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Messages from content scripts should have sender.tab set
  if (sender.tab) {
    var tabId = sender.tab.id;
    if (tabId in connections) {
      var _connections$tabId = connections[tabId],
          devtools = _connections$tabId.devtools,
          sidebar = _connections$tabId.sidebar;

      if (request === 'init') {
        setTimeout(function () {
          chrome.tabs.executeScript(tabId, { code: postEvent('spritejs: devtools-opened') });
        }, 300);
        devtools.postMessage('init');
      } else if (sidebar) {
        sidebar.postMessage(request);
      }
      // connections[tabId].postMessage(request)
    } else {
        // console.log("Tab not found in connection list.", sender);
      }
  } else {
      // console.log("sender.tab not defined.");
    }
  return true;
});