var util = require('util');
var EventEmitter = require('events').EventEmitter;

var defaultOptions = { 
    method: 'GET',
    url: '/',
    query: {},
    headers: {},
    params: {},
    cookies: {},
    session: {},
    content: {},
    body: {},
    files: {}
};

var IncomingMessage = function (options) {
    options = options || defaultOptions;
    for (var propertyName in options) {
        this[propertyName] = options[propertyName];
    }

    for (var propertyName in defaultOptions) {
        if (!this[propertyName]) {
            this[propertyName] = defaultOptions[propertyName];
        }
    }
};

util.inherits(IncomingMessage, EventEmitter);
module.exports = IncomingMessage;
