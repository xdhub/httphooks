var debug = require('debug')('socketio/ServerResponse');
var util = require('util');
var events = require('events');
var clone = require('clone');
var initialization = require('../common/initialization.js');
var headerutils = require('../common/headerutils.js');
var EventEmitter = require('events').EventEmitter;

var sendResponse = function (statusCode, headers, content, responseCallback) {
    var response = { statusCode: statusCode, headers: headers, content: content };
    responseCallback(response);
    this.emit('finish');
    debug('Response has been sent');
};

var addData = function (dataSet, data) {
    if (data instanceof Buffer) {
        data = data.toString();
    } else if (typeof data === 'string') {
        data = data;
    } else {
        throw new TypeError('Invalid data type');
    }

    dataSet.push(data);
};

var ServerResponse = function (opts) {
    var defaultReadOnlyProperties = {
        headersSent: false
    };
    var properties = opts && opts.properties ? clone(opts.properties) : defaultReadOnlyProperties;
    initialization.initializeGetterProperties(this, defaultReadOnlyProperties, properties);

    this.statusCode = typeof properties.statusCode === 'undefined' ? -1 : properties.statusCode;
    this.sendDate = typeof properties.sendDate === 'undefined' ? true : properties.sendDate;

    var privateProperties = {
        socket: {
            context: typeof opts === 'undefined' || typeof opts.socketContext === 'undefined'
                     ? new events.EventEmitter()
                     : opts.socketContext,
            connectionClosed: false,
            responseCallback: typeof opts === 'undefined' || typeof opts.socketResponseCallback === 'undefined'
                              ? function () {}
                              : opts.socketResponseCallback
        },
        headers: properties.headers || {},
        endCalled: typeof properties.endCalled === 'undefined' ? false : properties.endCalled,
        data: typeof properties.content === 'undefined' ? [] : [ properties.content ],
        encoding: typeof properties.encoding === 'undefined' ? 'utf8' : properties.encoding,
        reasonPhrase: typeof properties.reasonPhrase === 'undefined' ? '' : properties.reasonPhrase
    };

    privateProperties.socket.context.on('disconnect', function() {
        debug('Socket has been disconnected');
        if (!privateProperties.socket.connectionClosed && !privateProperties.endCalled) {
            this.emit('close');
        }

        privateProperties.socket.connectionClosed = true;
    });

    this.getHeader = function (name) {
        return privateProperties.headers[name];
    };

    this.setHeader = function (name, value) {
        privateProperties.headers[name] = value;
    };

    this.removeHeader = function (name) {
        delete privateProperties.headers[name];
    };

    this.setEncoding = function (encoding) {
        privateProperties.encoding = encoding;
    };

    this.writeHead = function (statusCode, reasonPhrase, headers) {
        if (privateProperties.endCalled) {
            throw new Error('Unable to write after end');
        }

        this.statusCode = statusCode;
        if (headers) {
            privateProperties.reasonPhrase = reasonPhrase;
            privateProperties.headers = headers;
        } else {
            privateProperties.headers = reasonPhrase;
        }
    };

    this.write = function (data, encoding) {
        addData(privateProperties.data, data);
        if (encoding) {
            privateProperties.encoding = encoding;
        }
    };

    this.end = function (data, encoding) {
        if (privateProperties.endCalled) {
            throw new Error('Unable to end more than once');
        }

        privateProperties.endCalled = true;
        if (data) {
            addData(privateProperties.data, data);
        }

        if (encoding) {
            privateProperties.encoding = encoding;
        }

        if (!privateProperties.socket.connectionClosed) {
            var headerName = headerutils.getActualHeaderName(privateProperties.headers, 'Date') || 'Date';
            privateProperties.headers[headerName] = (new Date()).toUTCString();
            sendResponse.call(
                this,
                this.statusCode,
                privateProperties.headers,
                privateProperties.data.join(''),
                privateProperties.socket.responseCallback);
        } else {
            debug('Connection has been previously closed');
        }
    };
};

util.inherits(ServerResponse, EventEmitter);
module.exports = ServerResponse;
