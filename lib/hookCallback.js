/**
 * @title HookCallback Reference
 * @author Elmar Langholz
 */

var url = require('url');
var RemoteHook = require('./remoteHook.js');

/**
 * Create a HookCallback object
 * @class HookCallback
 * @member {string} uri The uri to the resource containing the function to execute. Supported protocols: `file | http | https`.
 * @member {string} func The function to execute.
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
    } else if (uri.protocol === 'http:' || uri.protocol === 'https:') {
        var remoteHook = new RemoteHook(hook);
        functor = remoteHook.callback;
    }

    return functor;
}

module.exports = {
    createFunctionFromHook: createFunctionFromHook,
    createFunctionFromFileHookCallback: createFunctionFromFileHookCallback
};
