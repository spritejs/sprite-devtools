let backgroundChange = false

const view = new JSONView('Sprite', {
  message: 'Select sprite element to show',
})

const backgroundPageConnection = chrome.runtime.connect({
  name: 'sprite-element',
})

document.body.appendChild(view.dom)

// Listen for change events
view.on('change', (key, oldValue, newValue) => {
  // console.log('change', key, oldValue, '=>', newValue)
  if(!backgroundChange) {
    backgroundPageConnection.postMessage({
      key,
      value: newValue,
      tabId: chrome.devtools.inspectedWindow.tabId,
    })
  }
})

// Expand recursively
view.expand(true)

// Inspect window.data on the console and note that it changes with edits.
// window.data = view.value

backgroundPageConnection.postMessage({
  name: 'init',
  tabId: chrome.devtools.inspectedWindow.tabId,
})

function isEqual(val1, val2) {
  if(val1 === val2) {
    return true
  }

  if(val1 != null && val2 != null && typeof val1 === 'object' && typeof val2 === 'object') {
    if(Array.isArray(val1) ^ Array.isArray(val2)) {
      return false
    }
    return !Object.entries(val1).some(([key, val]) => {
      return !isEqual(val, val2[key])
    })
  }
  return false
}

backgroundPageConnection.onMessage.addListener((element) => {
  if(!element) {
    view.value = {
      message: 'Select sprite element to show',
    }
    return
  }
  const data = view.value
  if(data.message) {
    delete data.message
    view.refresh()
  }
  Object.entries(element).forEach(([key, value]) => {
    if(!isEqual(value, data[key])) {
      backgroundChange = true
      view.setChild(key, value)
      backgroundChange = false
    }
  })
  // view.expand(true)
})
