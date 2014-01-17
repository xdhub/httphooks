/**
 * @title RemoteHook Reference
 * @author Elmar Langholz
 */

/**
 * Create an RemoteHook object
 * @class RemoteHook
 */

/**
 * Initializes a new instance of the `RemoteHook`.
 * @function RemoteHook
 * @param {Hook} hook The hook to initialize the instance with.
 */
var RemoteHook = function (hook) {
    var options = {
        url: hook.callback.uri,
        headers: {
            'x-httphooks-request-type': 'remote-hook',
            'x-httphooks-hook-type': hook.type
        }
    };

    this.callback = function (hookContext, cb) {
        var request = require('request');
        var isResponder = options.headers['x-httphooks-hook-type'].indexOf('responder') >= 0;
        options.method = hookContext.request.method.toUpperCase();
        options.json = hookContext;
        request(options, function (error, response, body) {
            if (!error) {
                if (isResponder) {
                    body = typeof body !== 'undefined' ? body : '';
                    hookContext.setResponse(response.statusCode, response.headers, body.toString());
                }

                cb();
            } else {
                throw error;
            }
        });
    };
};

module.exports = RemoteHook;