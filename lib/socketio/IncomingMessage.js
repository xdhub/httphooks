var util = require('util');
var clone = require('clone');
var initialization = require('../common/initialization.js');
var EventEmitter = require('events').EventEmitter;

var IncomingMessage = function (opts) {
    var defaultProperties = {
        httpVersion: null,
        method: null,
        url: '',
        query: {},
        headers: {},
        content: ''
    };
    var properties = opts && opts.properties ? clone(opts.properties) : defaultProperties;
    initialization.initializeGetterProperties(this, defaultProperties, properties);
};

util.inherits(IncomingMessage, EventEmitter);
module.exports = IncomingMessage;
