var util = require('util');
var EventEmitter = require('events').EventEmitter;

var defaultOptions = { 
    statusCode: -1,
    headersSent: false,
    sendDate: true
};

var ServerResponse = function (options) {
    options = options || defaultOptions;
    for (var propertyName in options) {
        this[propertyName] = options[propertyName];
    }

    for (var propertyName in defaultOptions) {
        if (!this[propertyName]) {
            this[propertyName] = defaultOptions[propertyName];
        }
    }

    this._endCalled = false;
    this._data = [];
    this._headers = {};
    this._encoding = 'utf8';
    this._reasonPhrase = '';
};

util.inherits(ServerResponse, EventEmitter);

ServerResponse.prototype.getHeader = function (name) {
    return this.headers[name];
};

ServerResponse.prototype.setHeader = function (name, value) {
    this.headers[name] = value;
};

ServerResponse.prototype.removeHeader = function (name) {
    delete this.headers[name];
};

ServerResponse.prototype.writeHead = function (statusCode, reasonPhrase, headers) {
    if (this._endCalled) {
        throw new Error('Unable to write after end');
    }

    this.statusCode = statusCode;
    if (headers) {
        this._reasonPhrase = reasonPhrase;
        this._headers = headers;
    } else {
        this._headers = reasonPhrase;
    }
};

ServerResponse.prototype.write = function (chunk, encoding) {
    this._data.push(chunk);
    if (encoding) {
        this._encoding = encoding;
    }
};

ServerResponse.prototype.end = function (data, encoding) {
    this._endCalled = true;
    if (data) {
        this._data.push(data);
    }

    if (encoding) {
        this._encoding = encoding;
    }

    this.emit('end');
};

module.exports = ServerResponse;
