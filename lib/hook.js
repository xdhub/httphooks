//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// THIS CODE IS PROVIDED ON AN  *AS IS* BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT
// LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR
// A PARTICULAR PURPOSE, MERCHANTABILITY OR NON-INFRINGEMENT.
//
// See the Apache Version 2.0 License for specific language governing
// permissions and limitations under the License.
//

/**
 * @title Hook Reference
 */

var debug = require('debug')('Hook');
var url = require('url');
var validate = require('./common/validate.js');
var HookCallback = require('./hookCallback.js');

/**
 * Create a Hook object
 * @class Hook
 * @member {string} method The lower-cased HTTP method corresponding to the hook: `'get' | 'put' | 'post' | 'delete'`
 * @member {string} urlPattern The url pattern (in the form [route-pattern](https://github.com/bjoerge/route-pattern)) corresponding to the hook.
 * @member {string} type The lower-cased type corresponding to the hook: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`
 * @member {function | HookCallback} callback The hook callback to invoke in the specified order when a matching request is determined.
 */
function isValidUrlPattern(urlPattern) {
    var valid = typeof urlPattern === 'string';
    if (!valid) {
        debug('Invalid urlPattern type or not provided');
    }

    return valid;
}

function isValidCallbackFunction(callback) {
    return typeof callback === 'function';
}

var isValidCallback = function (callback) {
    var valid = isValidCallbackFunction(callback)
                || HookCallback.isValidHookCallback(callback);
    if (!valid) {
         debug('Invalid callback type or not provided');
    }

    return valid;
};

var isValidHook = function (hook) {
    var valid = typeof hook === 'object';
    if (valid) {
        valid = validate.isValidRequestMethod(hook.method)
            && isValidUrlPattern(hook.urlPattern)
            && validate.isValidHookType(hook.type)
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
    isValidCallback: isValidCallback
};
