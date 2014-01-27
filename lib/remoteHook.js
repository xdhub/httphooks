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
                debug('[HTTP] error: ' + JSON.stringify(error));
                cb(error);
            }
        });
    };
}

function createSocketIoFunction(options, isResponder) {
    return function (hookContext, cb) {
        var remoteUrl = options.url.protocol.replace('ws', 'http') + '//' + options.url.host
        var socket = require('socket.io-client').connect(remoteUrl, true);
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

function createSockJsFunction(options, isResponder) {
    return function (hookContext, cb) {
        var remoteUrl = options.url.protocol.replace('ws', 'http') + '//' + options.url.host
        var request = {
            method: hookContext.request.method.toUpperCase(),
            url: options.url.path,
            headers: options.headers,
            content: JSON.stringify(hookContext)
        };
        var sockjsClient = require('sockjs-client');
        var client = sockjsClient.create(remoteUrl);
        client.on('connection', function () {
            debug('[Socket(sockjs)] connection');
            client.write(JSON.stringify(request));
        });
        client.on('data', function (responseAsText) {
            debug('[Socket(sockjs)] data');
            var response = JSON.parse(responseAsText);
            if (isResponder) {
                hookContext.setResponse(response.statusCode, response.headers, response.content);
            }

            client.close();
        });
        client.on('close', function() {
            debug('[Socket(sockjs)] close');
            cb();
        });
        client.on('error', function (error) {
            debug('[Socket(sockjs)] error: ' + JSON.stringify(error));
            cb(error);
        });
    };
}

function createSocketFunction(options, isResponder, socketFramework) {
    var functor = null;
    if (socketFramework === 'socket.io') {
        functor = createSocketIoFunction(options, isResponder);
    } else if (socketFramework === 'sockjs') {
        functor = createSockJsFunction(options, isResponder);
    }

    return functor;
}

function createCallbackFunction(options, hookType, socketFramework) {
    var functor = function () {};
    var isResponder = hookType.indexOf('responder') >= 0;
    if (options.url.protocol === 'ws:') {
        functor = createSocketFunction(options, isResponder, socketFramework);
    } else {
        functor = createHttpFunction(options, isResponder);
    }

    return functor;
}

/**
 * Create a RemoteHookOptions object
 * @class RemoteHookOptions
 * @member {[URL](http://nodejs.org/api/url.html)} uri The uri to the resource containing the function(s) to execute. Supported protocols: `file | http | https | ws`.
 * @member {string} hookType The hook type.
 * @member {string[]} [hookFilter] For remote hooks (e.g. non-`file` protocol), the hook types to execute.
 * @member {string} [socketFramework] If the uri uses the `ws` protocol, the socket service to use: `sockjs | socket.io`; otherwise, it is not required.
 */

/**
 * Create an RemoteHook object
 * @class RemoteHook
 */

/**
 * Initializes a new instance of the `RemoteHook`.
 * @function RemoteHook
 * @param {RemoteHookOptions} opts The options to initialize the remote hook instance with.
 */
var RemoteHook = function (opts) {
    if (typeof opts !== 'object') {
        throw new Error('Expected the options to be provided and of an object type');
    }

    if (typeof opts.uri !== 'object') {
        throw new Error('Expected the uri to be provided and of a URL type');
    }

    if (typeof opts.hookType !== 'string') {
        throw new Error('Expected the hook type to be provided and of a string type');
    }

    var options = {
        url: opts.uri,
        headers: {
            'Content-Type': 'application/json',
            'x-httphooks-request-type': 'remote-hook',
            'x-httphooks-hook-type-filter': !opts.hookFilter ? '*' : opts.hookFilter.join(',')
        }
    };

    this.callback = createCallbackFunction(options, opts.hookType, opts.socketFramework);
};

module.exports = RemoteHook;
