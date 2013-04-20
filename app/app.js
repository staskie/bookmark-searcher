function Bookmark(bookmark) {
  this.title = bookmark.title;
  this.url   = bookmark.url;
}

function App() {
  this.responseCallbacks = {};

  this.searched = false;

  this.phrase = ko.observable();
  this.bookmarks = ko.observableArray([]);
  this.contentBookmarks = ko.observableArray([]);

  this.nothingFound = ko.computed(function() {
    if (this.bookmarks().length == 0 && this.contentBookmarks().length == 0) {
      return true;
    } else {
      return false;
    }
  }, this);

  window.addEventListener("message", this.onMessage.bind(this), false);
}

App.prototype.clearPreviousSearch = function() {
  this.bookmarks([]);
  this.contentBookmarks([]);
}

App.prototype.search = function(data, event) {
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

App.prototype.selectFieldText = function() {
  var searchField = document.getElementById("searchField");
  searchField.select();
}

App.prototype.onMessage = function(event) {
  var message = event.data;
  if (message.init) {
    this.parent = event.source;
  } else {
    this.dispatchCallback(message);
  }
}

App.prototype.dispatchCallback = function(message) {
  var responseCallback = this.responseCallbacks[message.callback];
  responseCallback(message.data);
}

App.prototype.sendMessage = function(data, responseCallback) {
  data._callbackId = (new Date()).getTime().toString() + data.action;
  this.responseCallbacks[data._callbackId] = responseCallback;
  this.parent.postMessage(data, "*");
}

ko.applyBindings(new App());

