'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var backgroundChange = false;

var view = new JSONView('Sprite', {
  message: 'Select sprite element to show'
});

var backgroundPageConnection = chrome.runtime.connect({
  name: 'sprite-element'
});

document.body.appendChild(view.dom);

// Listen for change events
view.on('change', function (key, oldValue, newValue) {
  // console.log('change', key, oldValue, '=>', newValue)
  if (!backgroundChange) {
    backgroundPageConnection.postMessage({
      key: key,
      value: newValue,
      tabId: chrome.devtools.inspectedWindow.tabId
    });
  }
});

// Expand recursively
view.expand(true);

// Inspect window.data on the console and note that it changes with edits.
// window.data = view.value

backgroundPageConnection.postMessage({
  name: 'init',
  tabId: chrome.devtools.inspectedWindow.tabId
});

function isEqual(val1, val2) {
  if (val1 === val2) {
    return true;
  }

  if (val1 != null && val2 != null && (typeof val1 === 'undefined' ? 'undefined' : _typeof(val1)) === 'object' && (typeof val2 === 'undefined' ? 'undefined' : _typeof(val2)) === 'object') {
    if (Array.isArray(val1) ^ Array.isArray(val2)) {
      return false;
    }
    return !Object.entries(val1).some(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          key = _ref2[0],
          val = _ref2[1];

      return !isEqual(val, val2[key]);
    });
  }
  return false;
}

backgroundPageConnection.onMessage.addListener(function (element) {
  var data = view.value;
  if (data.message) {
    delete data.message;
    view.refresh();
  }
  Object.entries(element).forEach(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        key = _ref4[0],
        value = _ref4[1];

    if (!isEqual(value, data[key])) {
      backgroundChange = true;
      view.setChild(key, value);
      backgroundChange = false;
    }
  });
  // view.expand(true)
});