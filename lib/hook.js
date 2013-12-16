/**
 * @title Hook Reference
 * @author Elmar Langholz
 */

var debug = require('debug')('Hook');
var url = require('url');
var constants = require('./constants.js');

/**
 * Create a HookCallback object
 * @class HookCallback
 * @member {string} uri The uri to the resource containing the function to execute.
 * @member {string} func The function to execute.
 */

/**
 * Create a Hook object
 * @class Hook
 * @member {string} method The lower-cased HTTP method corresponding to the hook: `'get' | 'put' | 'post' | 'delete'`
 * @member {string} urlPattern The url pattern (in the form [route-pattern](https://github.com/bjoerge/route-pattern)) corresponding to the hook.
 * @member {string} type The lower-cased type corresponding to the hook: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`
 * @member {function | HookCallback} callback The hook callback to invoke in the specified order when a matching request is determined.
 */
var isValidRequestMethod = function (method) {
    var valid = typeof method === 'string';
    if (valid) {
        valid = constants.requestMethods.indexOf(method.toLowerCase()) >= 0;
        if (!valid) {
            debug('Invalid hook request method: ' + method);
        }
    } else {
        debug('Invalid method type or not provided');
    }

    return valid;
};

function isValidUrlPattern(urlPattern) {
    var valid = typeof urlPattern === 'string';
    if (!valid) {
        debug('Invalid urlPattern type or not provided');
    }

    return valid;
}

function isValidHookType(type) {
    var valid = typeof type === 'string';
    if (valid) {
        valid = constants.hookTypes.indexOf(type.toLowerCase()) >= 0;
        if (!valid) {
            debug('Invalid hook type: ' + type);
        }
    } else {
        debug('Invalid hook type type or not provided');
    }

    return valid;
}

function isSupportedUrlProtocol(url) {
    return url.protocol === 'file:';
}

function isValidUrlPath(url) {
    return typeof url.path === 'string' && url.path !== '';
}

function isValidUri(uri) {
    var url = url.parse(uri);
    return isValidUrlPath(url) && isSupportedUrlProtocol(url);
}

function isValidCallbackInfo(callback) {
    var valid = typeof callback === 'object';
    if (valid) {
        valid = typeof callback.uri === 'string' && isValidUri(callback.uri);
        if (valid) {
            valid = typeof callback.func === 'string';
            if (!valid) {
                debug(
                    'Function either not provided or of invalid type ' +
                    'in the callback info');
            }
        } else {
            debug(
                'Uri either not provided or of invalid type in the ' +
                'callback info');
        }
    }

    return valid;
}

function isValidCallbackFunction(callback) {
    return typeof callback === 'function';
}

var isValidCallback = function (callback) {
    var valid = isValidCallbackFunction(callback)
                || isValidCallbackInfo(callback);
    if (!valid) {
         debug('Invalid callback type or not provided');
    }

    return valid;
};

var isValidHook = function (hook) {
    var valid = typeof hook === 'object';
    if (valid) {
        valid = isValidRequestMethod(hook.method)
            && isValidUrlPattern(hook.urlPattern)
            && isValidHookType(hook.type)
            && isValidCallback(hook.callback);
    } else {
        debug('Invalid hook type or not provided');
    }

    return valid;
};

var validateHooks = function (hooks) {
    if (typeof hooks === 'object' && hooks instanceof Array) {
        if (hooks.length > 0) {
            hooks.forEach(function (hook) {
                if (!isValidHook(hook)) {
                    throw new TypeError('Invalid hook: ' + JSON.stringify(hook));
                }
            });
        }
    } else {
        throw new TypeError('Invalid hooks type');
    }
};

module.exports = {
    isValidHook: isValidHook,
    validateHooks: validateHooks,
    isValidCallback: isValidCallback,
    isValidRequestMethod: isValidRequestMethod
};
