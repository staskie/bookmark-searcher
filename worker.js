(function() {
  var appWindow = document.getElementById("appWindow").contentWindow;

  function search(phrase, callback) {
    chrome.bookmarks.search(phrase, function(data) {
      // filter out non http links
      var bookmarks = Object
        .keys(data)
        .map(function(index) {
          var title = data[index].title;
          var url   = data[index].url;

          var regExp = new RegExp(/^http:/)
          var match  = url.match(regExp);

          if (match) {
            return data[index];
          }
        })
        .filter(function(bookmark) { if (bookmark) return bookmark; });
      callback(bookmarks);
    });
  };

  function postMessageToApp(message) {
    appWindow.postMessage(message, "*");
  }

  function handleMessage(event) {
    var message = event.data;
    var action  = message['action'];

    switch(action) {
      case "searchBookmarks":
        search(message.phrase, function(data) {
          postMessageToApp({
            callback: event.data._callbackId,
            data: data
          });
        });
      break;
    }
  };

  var init = function() {
    window.addEventListener("message", handleMessage, false);
    postMessageToApp({init: true}, '*');
  };

  setTimeout(init, 500);
})();
