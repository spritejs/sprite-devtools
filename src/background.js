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
  let openCount = 0,
    tabId = null
  const extensionListener = function (message, sender, sendResponse) {
    // The original connection event doesn't include the tab ID of the
    // DevTools page, so we need to send it explicitly.
    if(port.name === 'devtools-page' && message.name === 'init') {
      connections[message.tabId] = port
      tabId = message.tabId
      if(openCount === 0) {
        console.log('DevTools window opening.')
        chrome.tabs.executeScript(message.tabId, {code: postEvent('spritejs: devtools-opened')})
      }
      openCount++
      port.onDisconnect.addListener((port) => {
        openCount--
        if(openCount === 0) {
          console.log('Last DevTools window closing.')
          chrome.tabs.executeScript(message.tabId, {code: postEvent('spritejs: devtools-closed')})
        }
      })
    } else if(port.name === 'sprite-element' && message.name === 'init') {
      connections.sidebar = port
    } else if(port.name === 'sprite-element') {
      chrome.tabs.executeScript(tabId, {code: postEvent('spritejs: attr-change', message)})
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
      const port = connections[tabId]
      if(request === 'init' && port.name === 'devtools-page') {
        setTimeout(() => {
          chrome.tabs.executeScript(tabId, {code: postEvent('spritejs: devtools-opened')})
        }, 300)
        port.postMessage('init')
      } else if(connections.sidebar) {
        connections.sidebar.postMessage(request)
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
