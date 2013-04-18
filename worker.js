(function() {
  var appWindow = document.getElementById("appWindow").contentWindow;

  function filterOutNonHTTP(data) {
    var bookmarks = Object
    .keys(data)
    .map(function(index) {
      var title = data[index].title || "";
      var url   = data[index].url || "";

      var regExp = new RegExp(/^http/)
      var match  = url.match(regExp);

      if (match) {
        return data[index];
      }
    })
    .filter(function(bookmark) { if (bookmark) return bookmark; });
    return bookmarks;
  }

  function search(phrase, callback) {
    chrome.bookmarks.search(phrase, function(data) {
      var bookmarks = filterOutNonHTTP(data);
      callback(bookmarks);
    });
  };

  function postMessageToApp(message) {
    appWindow.postMessage(message, "*");
  }

  function getRemoteURL(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        callback(xhr.responseText);
      }
    }
    xhr.send();
  }

  function searchForPhrase(pageContent, phrase) {
    var regExp = new RegExp(phrase);
    var match  = pageContent.match(regExp);
    return match;
  }

  function handleMessage(event) {
    var message = event.data;
    var action  = message['action'];

    switch(action) {
      case "searchRemoteURLs":
        chrome.bookmarks.getChildren("1", function(data) {
          var bookmarks = filterOutNonHTTP(data);
          bookmarks.forEach(function(bookmark) {
            getRemoteURL(bookmark.url, function(pageContent) {
              var result = searchForPhrase(pageContent, message.phrase);
              if (result) {
                postMessageToApp({
                  callback: event.data._callbackId,
                  data: {
                    url: bookmark.url,
                    title: bookmark.title
                  }
                });
              }
            });
          });
        });
      break;

      case "searchRemoteURL":
        getRemoteURL(message.url, function(pageContent) {
        var found = searchForPhrase(pageContent, message.phrase)
        console.log(found);

        postMessageToApp({
          callback: event.data._callbackId,
          data: found
          });
        });
      break;

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
