/**
 * @title HookCallback Reference
 * @author Elmar Langholz
 */

var debug = require('debug')('HookCallback');
var url = require('url');
var validate = require('./common/validate.js');
var RemoteHook = require('./remoteHook.js');

function isSupportedUrlProtocol(url) {
    return url.protocol === 'file:' || url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'ws:';
}

function isValidUrlPath(url) {
    return typeof url.path === 'string' && url.path !== '';
}

function isValidUri(uri) {
    return isValidUrlPath(uri) && isSupportedUrlProtocol(uri);
}

function isValidFileFunction(func) {
    var valid = typeof func === 'string';
    if (!valid) {
        debug('File function either not provided or of invalid type in the callback info');
    }

    return valid;
}

function isValidHookFilter(hookFilter) {
    var hookFilterType = typeof hookFilter;
    var valid = hookFilterType === 'undefined';
    if (hookFilterType !== 'undefined') {
        valid = hookFilter instanceof Array;
        if (valid) {
            for (var index = 0; index < hookFilter.length; index++) {
                var element = hookFilter[index];
                if (!validate.isValidHookType(element)) {
                    valid = false;
                    debug('The provided hook type, in the hook filter at index ' + index + ', is invalid: ' + element);
                }
            }
        } else {
            debug('The provided hook filter is not an array');
        }
    }

    return valid;
}

var isValidHookCallback = function (callback) {
    var valid = typeof callback === 'object';
    if (valid) {
        valid = typeof callback.uri === 'string';
        if (valid) {
            var normalizedUri = url.parse(callback.uri);
            valid = isValidUri(normalizedUri);
            if (valid) {
                if (normalizedUri.protocol === 'file:') {
                    valid = isValidFileFunction(callback.func);
                } else {
                    valid = isValidHookFilter(callback.hookFilter);
                }
            }
        } else {
            debug('Uri either not provided or of invalid type in the callback');
        }
    }

    return valid;
}

/**
 * Create a HookCallback object
 * @class HookCallback
 * @member {string} uri The uri to the resource containing the function to execute. Supported protocols: `file | http | https | ws`.
 * @member {string[]} [hookFilter] For remote hooks (e.g. non-file protocol), the hook types to execute. By default, if not defined, we execute all and any corresponding. Hook types: `request-listener | pre-responder | pre-listener | responder | post-listener | post-responder | response-listener`.
 * @member {string} [func] If the uri uses the file protocol, the function to execute; otherwise, it is not required.
 */

function loadCallbackFunctionFromFileSystem(modulePath, functionName) {
    var module = null;
    var func = null;
    try
    {
        module = require(modulePath);
    } catch (error) {
        var errorMessage =
            'Error encountered while trying to create function from a callback info.' +
            '\r\nError: ' + JSON.stringify(error) +
            '\r\nModule path: ' + modulePath +
            '\r\nFunction name: ' + functionName;
        throw new Error(errorMessage);
    }

    if (module) {
        func = module[functionName];
        if (typeof func !== 'function') {
            func = null;
            var errorMessage =
                'Error encountered while trying to create function from a ' +
                'callback info: Invalid function type ' + typeof func;
            throw new TypeError(errorMessage);
        }
    }

    return func;
}

function createFunctionFromFileHookCallback(callback) {
    var uri = url.parse(callback.uri);
    if (uri.protocol !== 'file:') {
        throw new Error('Invalid protocol uri (' + uri.protocol + ')');
    }

    var modulePath = uri.path;
    if (modulePath.charAt(0) === '/') {
        modulePath = modulePath.substr(1, modulePath.length - 1);
    }

    return loadCallbackFunctionFromFileSystem(modulePath, callback.func);
}

function createFunctionFromHook(hook) {
    var functor = null;
    var uri = url.parse(hook.callback.uri);
    if (uri.protocol === 'file:') {
        functor = createFunctionFromFileHookCallback(hook.callback);
    } else if (uri.protocol === 'http:' || uri.protocol === 'https:' || uri.protocol === 'ws:') {
        var remoteHook = new RemoteHook(uri, hook.type, hook.callback.hookFilter);
        functor = remoteHook.callback;
    }

    return functor;
}

module.exports = {
    isValidHookCallback: isValidHookCallback,
    createFunctionFromHook: createFunctionFromHook,
    createFunctionFromFileHookCallback: createFunctionFromFileHookCallback
};
