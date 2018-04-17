'use strict';

(function () {
  chrome.runtime.sendMessage('init');
  document.addEventListener('spritejs: observer', function (evt) {
    // console.log(chrome.runtime.sendMessage)
    chrome.runtime.sendMessage(evt.detail);
  });
})();