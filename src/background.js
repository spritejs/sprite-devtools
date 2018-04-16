// background.js
const connections = {}

function postEvent(eventType, eventArgs = {}) {
  return `
    ;(function(){
      const event = new CustomEvent('${eventType}', ${JSON.stringify(eventArgs)})
      document.dispatchEvent(event)
    }())
  `
}

chrome.runtime.onConnect.addListener((port) => {
  // background.js
  let openCount = 0
  const extensionListener = function (message, sender, sendResponse) {
    // The original connection event doesn't include the tab ID of the
    // DevTools page, so we need to send it explicitly.
    if(message.name === 'init') {
      connections[message.tabId] = port
    }
    if(port.name === 'devtools-page') {
      if(openCount === 0) {
        // lert("DevTools window opening.");
        chrome.tabs.executeScript(message.tabId, {code: postEvent('spritejs: devtools-opened')})
      }
      openCount++
      port.onDisconnect.addListener((port) => {
        openCount--
        if(openCount === 0) {
          // alert("Last DevTools window closing.");
          chrome.tabs.executeScript(message.tabId, {code: postEvent('spritejs: devtools-closed')})
        }
      })
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
      if(port.name === 'devtools-page' && request === 'init') {
        setTimeout(() => {
          chrome.tabs.executeScript(tabId, {code: postEvent('spritejs: devtools-opened')})
        }, 300)
      }
      connections[tabId].postMessage(request)
    } else {
      // console.log("Tab not found in connection list.", sender);
    }
  } else {
    // console.log("sender.tab not defined.");
  }
  return true
})