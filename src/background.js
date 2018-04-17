// background.js
const connections = {}

function postEvent(eventType, eventArgs = {}) {
  return `
    ;(function(){
      const event = new CustomEvent('${eventType}', ${JSON.stringify({detail: eventArgs})})
      document.dispatchEvent(event)
    }())
  `
}

chrome.runtime.onConnect.addListener((port) => {
  // background.js

  const extensionListener = function (message, sender, sendResponse) {
    // The original connection event doesn't include the tab ID of the
    // DevTools page, so we need to send it explicitly.
    if(port.name === 'devtools-page' && message.name === 'init') {
      const tabId = message.tabId
      connections[tabId] = connections[tabId] || {}
      connections[tabId].devtools = port

      chrome.tabs.executeScript(message.tabId, {code: postEvent('spritejs: devtools-opened')})

      port.onDisconnect.addListener((port) => {
        chrome.tabs.executeScript(message.tabId, {code: postEvent('spritejs: devtools-closed')})
      })
    } else if(port.name === 'sprite-element' && message.name === 'init') {
      const tabId = message.tabId
      connections[tabId].sidebar = port
    } else if(port.name === 'sprite-element') {
      chrome.tabs.executeScript(message.tabId, {code: postEvent('spritejs: attr-change', message)})
    }
  }

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(extensionListener)

  port.onDisconnect.addListener((port) => {
    port.onMessage.removeListener(extensionListener)

    const tabs = Object.keys(connections)
    for(let i = 0, len = tabs.length; i < len; i++) {
      if(connections[tabs[i]] === port) {
        delete connections[tabs[i]]
        break
      }
    }
  })
})

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Messages from content scripts should have sender.tab set
  if(sender.tab) {
    const tabId = sender.tab.id
    if(tabId in connections) {
      const {devtools, sidebar} = connections[tabId]
      if(request === 'init') {
        setTimeout(() => {
          chrome.tabs.executeScript(tabId, {code: postEvent('spritejs: devtools-opened')})
        }, 300)
        devtools.postMessage('init')
      } else if(sidebar) {
        sidebar.postMessage(request)
      }
      // connections[tabId].postMessage(request)
    } else {
      // console.log("Tab not found in connection list.", sender);
    }
  } else {
    // console.log("sender.tab not defined.");
  }
  return true
})
