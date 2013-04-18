function Bookmark(bookmark) {
  this.title = bookmark.title;
  this.url   = bookmark.url;
}

function App() {
  this.responseCallbacks = {};
  this.phrase = ko.observable();

  this.bookmarks = ko.observableArray([]);
  this.contentBookmarks = ko.observableArray([]);

  this.clearPreviousSearch = function() {
      this.bookmarks([]);
      this.contentBookmarks([]);
  };

  this.search = function(data, event) {
    this.selectFieldText();
    this.clearPreviousSearch();

    var self = this;
    this.sendMessage({action:"searchBookmarks", phrase: this.phrase()}, function(data) {
      data.forEach(function(bookmark) {
        self.bookmarks.push(new Bookmark(bookmark));
      });
    });

    this.sendMessage({action:"searchRemoteURLs", phrase: this.phrase()}, function(bookmark) {
      self.contentBookmarks.push(new Bookmark(bookmark));
    });
  }

  this.selectFieldText = function() {
    var searchField = document.getElementById("searchField");
    searchField.select();
  }

  this.onMessage = function(event) {
    var message = event.data;
    if (message.init) {
      this.parent = event.source;
    } else {
      this.dispatchCallback(message);
    }
  }

  this.dispatchCallback = function(message) {
    var responseCallback = this.responseCallbacks[message.callback];
    responseCallback(message.data);
  }

  this.sendMessage = function(data, responseCallback) {
    data._callbackId = (new Date()).getTime().toString() + data.action;
    this.responseCallbacks[data._callbackId] = responseCallback;
    this.parent.postMessage(data, "*");
  }

  window.addEventListener("message", this.onMessage.bind(this), false);

}

ko.applyBindings(new App());

