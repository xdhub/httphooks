/**
 * @title RemoteHook Reference
 * @author Elmar Langholz
 */

var debug = require('debug')('RemoteHook');

function createHttpFunction(options, isResponder) {
    return function (hookContext, cb) {
        var request = require('request');
        options.method = hookContext.request.method.toUpperCase();
        options.json = hookContext;
        request(options, function (error, response, body) {
            if (!error) {
                if (isResponder) {
                    hookContext.setResponse(response.statusCode, response.headers, body);
                }

                cb();
            } else {
                cb(error);
            }
        });
    };
}

function createSocketFunction(options, isResponder) {
    return function (hookContext, cb) {
        var remoteUrl = options.url.protocol.replace('ws', 'http') + '//' + options.url.host
        var socket = require('socket.io-client').connect(remoteUrl);
        var request = {
            method: hookContext.request.method.toUpperCase(),
            url: options.url.path,
            headers: options.headers,
            content: JSON.stringify(hookContext)
        };
        socket.on('connect', function () {
            debug('[Socket] connect');
            socket.emit('request', request, function (response) {
                if (isResponder) {
                    hookContext.setResponse(response.statusCode, response.headers, response.content);
                }

                socket.disconnect();
            });
        });
        socket.on('disconnect', function () {
            debug('[Socket] disconnect');
            cb();
        });
        socket.on('error', function (error) {
            debug('[Socket] disconnect: ' + JSON.stringify(error));
            cb(error);
        });
        socket.on('connect_failed', function () {
            debug('[Socket] connect_failed');
            cb(new Error('Unable to establish a connection with ' + remoteUrl));
        });
    };
}

function createCallbackFunction(options, hookType) {
    var functor = function () {};
    var isResponder = hookType.indexOf('responder') >= 0;
    if (options.url.protocol === 'ws:') {
        functor = createSocketFunction(options, isResponder);
    } else {
        functor = createHttpFunction(options, isResponder);
    }

    return functor;
}

/**
 * Create an RemoteHook object
 * @class RemoteHook
 */

/**
 * Initializes a new instance of the `RemoteHook`.
 * @function RemoteHook
 * @param {[URL](http://nodejs.org/api/url.html)} url The parsed uri.
 * @param {string} hookType The hook type.
 * @param {string[]} [hookFilter] The filter indicating which hook type to execute remotely.
 */
var RemoteHook = function (url, hookType, hookFilter) {
    var options = {
        url: url,
        headers: {
            'Content-Type': 'application/json',
            'x-httphooks-request-type': 'remote-hook',
            'x-httphooks-hook-type-filter': !hookFilter ? '*' : hookFilter.join(',')
        }
    };

    this.callback = createCallbackFunction(options, hookType);
};

module.exports = RemoteHook;
