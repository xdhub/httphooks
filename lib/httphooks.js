/**
 * @title HttpHooks API Reference
 * @author Elmar Langholz
 */

var debug = require('debug')('HttpHooks');
var http = require('http');
var Rx = require('rx');
var dict = require('dict');
var uuid = require('node-uuid');
var RoutePattern = require("route-pattern");
var async = require('async');
var constants = require('./constants.js');
var HookContext = require('./hookContext.js');
var Multipart = require('./multipart.js');
var headerutils = require('./headerutils.js');
var strings = require('./strings.js');
var clone = require('clone');

function initializeAsObserver() {
    Rx.Observer.call(this);
    this.isStopped = false;
}

/**
 * Create an HttpContext object
 * @class HttpContext
 * @member {object} request The HTTP request object.
 * @member {object} response The HTTP response object
 */

/**
 * Create a HookCallback object
 * @class HookCallback
 * @member {string} path The path to the node file containing the function to execute.
 * @member {string} func The function to execute.
 */

/**
 * Create a Hook object
 * @class Hook
 * @member {string} method The lower-cased HTTP method corresponding to the hook: `'get' | 'put' | 'post' | 'delete'`
 * @member {string} urlPattern The url pattern (in the form [route-pattern](https://github.com/bjoerge/route-pattern)) corresponding to the hook.
 * @member {string} order The lower-cased hook order corresponding to the hook: `'pre' | 'in' | 'post'`
 * @member {string} type The lower-cased hook type corresponding to the hook: `'listener' | 'responder'`
 * @member {function|HookCallback} callback The hook callback to invoke in the specified order when a matching request is determined.
 */

/**
 * Create an HttpHooks object
 * @class HttpHooks
 */

/**
 * Initializes a new instance of the `HttpHooks`.
 * @function HttpHooks
 * @param {Hook[]} [hooks] The hooks to initialize the instance with.
 */
var HttpHooks = function (hooks) {
    hooks = hooks || [];
    initializeHooks.call(this);
    validateHooks(hooks);
    addHooks.call(this, hooks);
    this.noMatch = respondWithNotFoundStatusCode;
    initializeAsObserver.call(this);

    debug('Constructor: ' + hooks.length + ' hook(s) provided');
};

HttpHooks.prototype = Object.create(Rx.Observer.prototype);
HttpHooks.prototype.constructor = HttpHooks;

Object.defineProperties(HttpHooks.prototype, {
    onNext: {
        value: function (httpContext) {
            if (!this.isStopped) {
                debug('Observer: next');
                dispatchRequest.call(this, httpContext);
            }
        }
    },
    onError: {
        value: function (error) {
            if (!this.isStopped) {
                this.isStopped = true;
                debug('Observer: error');
                debug(JSON.stringify(error));
            }
        }
    },
    onCompleted: {
        value: function () {
            if (!this.isStopped) {
                this.isStopped = true;
                debug('Observer: completed');
            }
        }
    }
});

function isValidRequestMethod(method) {
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
}

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

function isValidCallbackInfo(callback) {
    var valid = typeof callback === 'object';
    if (valid) {
        valid = typeof callback.path === 'string';
        if (valid) {
            valid = typeof callback.func === 'string';
            if (!valid) {
                debug(
                    'Function either not provided or of invalid type ' +
                    'in the callback info');
            }
        } else {
            debug(
                'Path either not provided or of invalid type in the ' +
                'callback info');
        }
    }

    return valid;
}

function isValidCallbackFunction(callback) {
    return typeof callback === 'function';
}

function isValidCallback(callback) {
    var valid = isValidCallbackFunction(callback)
                || isValidCallbackInfo(callback);
    if (!valid) {
         debug('Invalid callback type or not provided');
    }

    return valid;
}

function isValidHook(hook) {
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
}

function validateHooks(hooks) {
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
}

function validateIdentifiers(identifiers) {
    if (typeof identifiers === 'object' && identifiers instanceof Array) {
        identifiers.forEach(function (identifier) {
            if (typeof identifier !== 'string') {
                throw new TypeError('Invalid hook identifier type: ' + typeof identifier);
            }
        });
    } else {
        throw new TypeError('Invalid hook identifiers type');
    }
}

function createFunctionFromCallbackInfo(callback) {
    var module = null;
    var func = null;
    try
    {
        module = require(callback.path);
    } catch (error) {
        var errorMessage =
            'Error encountered while trying to create function from a ' +
            'callback info.' +
            ' Error: ' + JSON.stringify(error) +
            ' CallbackInfo: ' + JSON.stringify(callback);
        throw new Error(errorMessage);
    }

    if (module) {
        func = module[callback.func];
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

function normalizeHook(hook) {
    var normalizedHook = {
        method: hook.method.toLowerCase(),
        urlPatternString: hook.urlPattern,
        urlPattern: RoutePattern.fromString(hook.urlPattern),
        type: hook.type.toLowerCase(),
        callback: typeof hook.callback === 'object'
                  ? createFunctionFromCallbackInfo(hook.callback)
                  : hook.callback
    };
    return normalizedHook;
}

function initializeHooks() {
    this.hooks = dict({});
    for (var index = 0; index < constants.requestMethods.length; index++) {
        var method = constants.requestMethods[index];
        var methodHooks = {
            hooks: []
        };
        this.hooks.set(method, methodHooks);
    }
}

function addHook(hook) {
    var normalizedHook = normalizeHook(hook);
    normalizedHook.identifier = uuid.v4();
    var methodHooks = this.hooks.get(normalizedHook.method);
    methodHooks.hooks.push(normalizedHook);
    return normalizedHook.identifier;
}

function addHooks(hooks) {
    var identifiers = [];
    for (var index = 0; index < hooks.length; index++) {
        var hook = hooks[index];
        identifiers.push(addHook.call(this, hook));
    }

    return identifiers;
}

function searchHookIndexes(hooks, matchFunc) {
    var matchedHooksIndexes = [];
    for (var index = 0; index < hooks.length; index++) {
        var hook = hooks[index];
        if (matchFunc(hook)) {
            matchedHooksIndexes.push(index);
        }
    }

    return matchedHooksIndexes;
}

function searchHooks(hooks, matchFunc) {
    var matchedHooks = [];
    for (var index = 0; index < hooks.length; index++) {
        var hook = hooks[index];
        if (matchFunc(hook)) {
            matchedHooks.push(hook);
        }
    }

    return matchedHooks;
}

function getHooksWithMethodAndUrl(method, url) {
    var matchHookWithUrl = function (hook) {
        return hook.urlPattern.matches(url);
    };
    var methodHooks = this.hooks.get(method);
    var matchedHooks = searchHooks(methodHooks.hooks, matchHookWithUrl);
    return matchedHooks;
}

function removeHook(identifier) {
    var matchHookWithIdentifier = function (hook) {
        return identifier === hook.identifier;
    };

    var removedHook = false;
    for (var index = 0; index < constants.requestMethods.length; index++) {
        var method = constants.requestMethods[index];
        var methodHooks = this.hooks.get(method);
        var matchedIndexes = searchHookIndexes(methodHooks.hooks, matchHookWithIdentifier);
        removedHook = matchedIndexes.length > 0;
        if (removedHook) {
            matchedIndexes.forEach(function (matchedIndex) {
               methodHooks.hooks.splice(matchedIndex, 1);
            });

            break;
        }
    }

    return removedHook;
}

function removeHooks(identifiers) {
    var that = this;
    var removedHooks = true;
    identifiers.forEach(function (identifier) {
        var removedHook = removeHook.call(that, identifier);
        removedHooks = removedHooks && removedHook;
    });

    return removedHooks;
}

/**
 * Adds a `hook` to an existing instance of the `HttpHooks`.
 * @method
 * @param {Hook} [hook] The hook to add to the instance.
 * @return {string[]} The collection of added hook identifiers.
 */
HttpHooks.prototype.addHook = function (hook) {
    var identifier = null;
    if (isValidHook(hook)) {
        identifier = addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }

    return identifier;
};

/**
 * Adds a collection of `hooks` to an existing instance of the `HttpHooks`.
 * @method
 * @param {Hook[]} hooks The hooks to add to the instance.
 * @return {string[]} The collection of added hook identifiers.
 */
HttpHooks.prototype.addHooks = function (hooks) {
    validateHooks(hooks);
    return addHooks.call(this, hooks);
};

/**
 * Removes a collection of hook given its corresponding `identifiers` from an existing instance of the `HttpHooks`.
 * @method
 * @param {string[]} identifiers The unique identifiers corresponding to the hooks to remove from the instance.
 */
HttpHooks.prototype.removeHooks = function (identifiers) {
    validateIdentifiers(identifiers);
    if (identifiers.length === 0) {
        throw new Error('Expected at least an identifier to be provided');
    }

    var removedHooks = removeHooks.call(this, identifiers);
    if (!removedHooks) {
        throw new Error('Unable to remove all provided hooks');
    }
};

/**
 * Removes a hook given its corresponding `identifier` from an existing instance of the `HttpHooks`.
 * @method
 * @param {string} identifier The unique identifier corresponding to the hook to remove from the instance.
 */
HttpHooks.prototype.removeHook = function (identifier) {
    if (typeof identifier === 'string') {
        var removedHooks = removeHook.call(this, identifier.toLowerCase());
        if (!removedHooks) {
            throw new Error('Unable to remove hook with identifier \'' + identifier + '\'');
        }
    } else {
        throw new TypeError('Invalid hook identifier');
    }
};

/**
 * Clears all and any existing hooks previously defined on an existing instance of the `HttpHooks`.
 * @method
 */
HttpHooks.prototype.clear = function () {
    initializeHooks.call(this);
};

/**
 * Defines an HTTP GET hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [type] The hook type: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`. The default value used when not provided is `'responder'`.
 */
HttpHooks.prototype.get = function (urlPattern, cb, type) {
    var hook = {
        method: 'get',
        urlPattern: urlPattern,
        type: typeof type === 'undefined' ? 'responder' : type,
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP GET listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [order] of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.
 */
HttpHooks.prototype.getListener = function (urlPattern, cb, order) {
    order = typeof order === 'undefined' ? 'response' : order;
    var hook = {
        method: 'get',
        urlPattern: urlPattern,
        type: (order !== '' ? order + '-' : '') + 'listener',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP GET request-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.getRequestListener = function (urlPattern, cb) {
    var hook = {
        method: 'get',
        urlPattern: urlPattern,
        type: 'request-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP GET pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.getPreListener = function (urlPattern, cb) {
    var hook = {
        method: 'get',
        urlPattern: urlPattern,
        type: 'pre-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP GET post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.getPostListener = function (urlPattern, cb) {
    var hook = {
        method: 'get',
        urlPattern: urlPattern,
        type: 'post-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP GET response-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.getResponseListener = function (urlPattern, cb) {
    var hook = {
        method: 'get',
        urlPattern: urlPattern,
        type: 'response-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP GET responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [order] of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.
 */
HttpHooks.prototype.getResponder = function (urlPattern, cb, order) {
    order = typeof order === 'undefined' ? '' : order;
    var hook = {
        method: 'get',
        urlPattern: urlPattern,
        type: (order !== '' ? order + '-' : '') + 'responder',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP GET pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.getPreResponder = function (urlPattern, cb) {
    var hook = {
        method: 'get',
        urlPattern: urlPattern,
        type: 'pre-responder',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP GET post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.getPostResponder = function (urlPattern, cb) {
    var hook = {
        method: 'get',
        urlPattern: urlPattern,
        type: 'post-responder',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP PUT hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [type] The hook type: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`. The default value used when not provided is `'responder'`.
 */
HttpHooks.prototype.put = function (urlPattern, cb, type) {
    var hook = {
        method: 'put',
        urlPattern: urlPattern,
        type: typeof type === 'undefined' ? 'responder' : type,
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP PUT listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [order] of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.
 */
HttpHooks.prototype.putListener = function (urlPattern, cb, order) {
    order = typeof order === 'undefined' ? 'response' : order;
    var hook = {
        method: 'put',
        urlPattern: urlPattern,
        type: (order !== '' ? order + '-' : '') + 'listener',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP PUT request-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.putRequestListener = function (urlPattern, cb) {
    var hook = {
        method: 'put',
        urlPattern: urlPattern,
        type: 'request-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP PUT pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.putPreListener = function (urlPattern, cb) {
    var hook = {
        method: 'put',
        urlPattern: urlPattern,
        type: 'pre-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP PUT post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.putPostListener = function (urlPattern, cb) {
    var hook = {
        method: 'put',
        urlPattern: urlPattern,
        type: 'post-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP PUT response-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.putResponseListener = function (urlPattern, cb) {
    var hook = {
        method: 'put',
        urlPattern: urlPattern,
        type: 'response-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP PUT responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [order] of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.
 */
HttpHooks.prototype.putResponder = function (urlPattern, cb, order) {
    order = typeof order === 'undefined' ? '' : order;
    var hook = {
        method: 'put',
        urlPattern: urlPattern,
        type: (order !== '' ? order + '-' : '') + 'responder',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP PUT pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.putPreResponder = function (urlPattern, cb) {
    var hook = {
        method: 'put',
        urlPattern: urlPattern,
        type: 'pre-responder',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP PUT post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.putPostResponder = function (urlPattern, cb) {
    var hook = {
        method: 'put',
        urlPattern: urlPattern,
        type: 'post-responder',
        callback: cb
    };

    if (isValidHook(hook)) {
       addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP POST hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [type] The hook type: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`. The default value used when not provided is `'responder'`.
 */
HttpHooks.prototype.post = function (urlPattern, cb, type) {
    var hook = {
        method: 'post',
        urlPattern: urlPattern,
        type: typeof type === 'undefined' ? 'responder' : type,
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP POST listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [order] of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.
 */
HttpHooks.prototype.postListener = function (urlPattern, cb, order) {
    order = typeof order === 'undefined' ? 'response' : order;
    var hook = {
        method: 'post',
        urlPattern: urlPattern,
        type: (order !== '' ? order + '-' : '') + 'listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP POST request-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.postRequestListener = function (urlPattern, cb) {
    var hook = {
        method: 'post',
        urlPattern: urlPattern,
        type: 'request-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP POST pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.postPreListener = function (urlPattern, cb) {
    var hook = {
        method: 'post',
        urlPattern: urlPattern,
        type: 'pre-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP POST post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.postPostListener = function (urlPattern, cb) {
    var hook = {
        method: 'post',
        urlPattern: urlPattern,
        type: 'post-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP POST response-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.postResponseListener = function (urlPattern, cb) {
    var hook = {
        method: 'post',
        urlPattern: urlPattern,
        type: 'response-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP POST responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [order] of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.
 */
HttpHooks.prototype.postResponder = function (urlPattern, cb, order) {
    order = typeof order === 'undefined' ? '' : order;
    var hook = {
        method: 'post',
        urlPattern: urlPattern,
        type: (order !== '' ? order + '-' : '') + 'responder',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP POST pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.postPreResponder = function (urlPattern, cb) {
    var hook = {
        method: 'post',
        urlPattern: urlPattern,
        type: 'pre-responder',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP POST post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.postPostResponder = function (urlPattern, cb) {
    var hook = {
        method: 'post',
        urlPattern: urlPattern,
        type: 'post-responder',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP DELETE hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [type] The hook type: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`. The default value used when not provided is `'responder'`.
 */
HttpHooks.prototype.delete = function (urlPattern, cb, type) {
    var hook = {
        method: 'delete',
        urlPattern: urlPattern,
        type: typeof type === 'undefined' ? 'responder' : type,
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP DELETE listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [order] of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.
 */
HttpHooks.prototype.deleteListener = function (urlPattern, cb, order) {
    order = typeof order === 'undefined' ? 'response' : order;
    var hook = {
        method: 'delete',
        urlPattern: urlPattern,
        type: (order !== '' ? order + '-' : '') + 'listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP DELETE request-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.deleteRequestListener = function (urlPattern, cb) {
    var hook = {
        method: 'delete',
        urlPattern: urlPattern,
        type: 'request-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP DELETE pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.deletePreListener = function (urlPattern, cb) {
    var hook = {
        method: 'delete',
        urlPattern: urlPattern,
        type: 'pre-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP DELETE post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.deletePostListener = function (urlPattern, cb) {
    var hook = {
        method: 'delete',
        urlPattern: urlPattern,
        type: 'post-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines a HTTP DELETE response-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.deleteResponseListener = function (urlPattern, cb) {
    var hook = {
        method: 'delete',
        urlPattern: urlPattern,
        type: 'response-listener',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP DELETE responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 * @param {string} [order] of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.
 */
HttpHooks.prototype.deleteResponder = function (urlPattern, cb, order) {
    order = typeof order === 'undefined' ? '' : order;
    var hook = {
        method: 'delete',
        urlPattern: urlPattern,
        type: (order !== '' ? order + '-' : '') + 'responder',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP DELETE pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.deletePreResponder = function (urlPattern, cb) {
    var hook = {
        method: 'delete',
        urlPattern: urlPattern,
        type: 'pre-responder',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

/**
 * Defines an HTTP DELETE post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.
 * @method
 * @param {string} urlPattern The url pattern that corresponds to the hook.
 * @param {function | HookCallback} cb The callback to invoke whenever there is a matching request.
 */
HttpHooks.prototype.deletePostResponder = function (urlPattern, cb) {
    var hook = {
        method: 'delete',
        urlPattern: urlPattern,
        type: 'post-responder',
        callback: cb
    };

    if (isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

function respondWithMethodNotAllowedStatusCode(response) {
    response.writeHead(405, { 'Content-Type': 'text/html' });
    response.write('Method Not Allowed');
    response.end();
}

function respondWithNotFoundStatusCode(httpContext) {
    httpContext.response.writeHead(404, { 'Content-Type': 'text/html' });
    httpContext.response.write('Not Found');
    httpContext.response.end();
}

function isValidRequest(httpContext) {
    var valid = isValidRequestMethod(httpContext.request.method);
    if (!valid) {
        debug('Received an unsupported request method: ' + httpContext.request.method);
        respondWithMethodNotAllowedStatusCode(httpContext.response);
    }

    return valid;
}

function getHooksWithType(hooks, type) {
    var matchHooksWithType = function (hook) {
        return hook.type === type;
    };
    var matchedHooks = searchHooks(hooks, getHooksWithType);
    return matchedHooks;
}

function getRequestListenerHooks(hooks) {
    return getHooksWithType(hooks, 'request-listener');
}

function getPreResponderHooks(hooks) {
    return getHooksWithType(hooks, 'pre-responder');
}

function getPreListenerHooks(hooks) {
    return getHooksWithType(hooks, 'pre-listener');
}

function getResponderHooks(hooks) {
    return getHooksWithType(hooks, 'responder');
}

function getPostListenerHooks(hooks) {
    return getHooksWithType(hooks, 'post-listener');
}

function getPostResponderHooks(hooks) {
    return getHooksWithType(hooks, 'post-responder');
}

function getResponseListenerHooks(hooks) {
    return getHooksWithType(hooks, 'response-listener');
}

function mapToHookExecutionContext(hooks, httpContext) {
    return hooks.map(function (hook) {
        return {
            hook: hook,
            httpContext: httpContext
        };
    });
}

function executeHook(hookExecutionContext, executionCompleteCallback) {
    var hook = hookExecutionContext.hook;
    var hookContext = new HookContext(hookExecutionContext.httpContext, hook);
    try {
        hook.callback(hookContext, function () {
            executionCompleteCallback(hookContext);
        });
    } catch (error) {
        debug(
            'Error while processing ' + hook.type + ' hook with identifier ' + hook.identifier +
            ' (\'' + hook.method + '\' on ' + '\''+ hook.urlPatternString + '\'): ' + error);
        debug('HookContext: ' + JSON.stringify(hookContext));
        executionCompleteCallback(hookContext);
    }
}

function executeListenerHooks(hooks, httpContext) {
    async.each(
        mapToHookExecutionContext(hooks, httpContext),
        function (hookExecutionContext, cb) {
            if (strings.endsWith(hookExecutionContext.hook.type, 'listener')) {
                executeHook(hookExecutionContext, function () {
                    var hook = hookExecutionContext.hook;
                    debug(
                        'Hook execution complete for ' + hook.type + ' hook with identifier ' + hook.identifier +
                        ' (\'' + hook.method + '\' on ' + '\''+ hook.urlPatternString + '\')');
                });
            }

            cb();
        },
        function (error) {
            if (error) {
                debug(
                    'We should not reach this condition since we never pass an' +
                    'error in the callback: ' + error);
            }
        });
}

function isValidHookContextResponse(hookExecutionContext, response) {
    var valid = HookContext.isValidHookContextResponse(response);
    var hook = hookExecutionContext.hook;
    if (!valid) {
        debug(
            'Error while processing ' + hook.type + ' hook with identifier ' + hook.identifier +
            ' (' + hook.method + ' on ' + '\''+ hook.urlPatternString + '\'): ' +
            'The response is not in a valid format!');
        debug('HookContext response: ' +
            (response)
            ? JSON.stringify(response)
            : typeof response);
    }

    return valid;
}

function getResponseFromHookResponseContent(hookExecutionContext, hookContext) {
    var response = null;
    try {
        response = JSON.parse(hookContext.response.content);
    } catch (error) {
        debug(
            'Error encountered while trying to parse the JSON string into ' +
            'a response');
    }

    if (!isValidHookContextResponse(hookExecutionContext, response)) {
        response = null;
        debug(
            'The provided JSON string (response content) is not a valid ' +
            'response type');
    }

    return response;
}

function processPreResponderHookContinueResponse(hookExecutionContext, hookContext) {
    // If the defined hook is a pre processing responder
    // and the returned HTTP status code for it is Continue, this means that
    // we will override the request content with the content one returned by the hook
    var response = getResponseFromHookResponseContent(hookExecutionContext, hookContext);
    if (response) {
        var mergedHeaders = headerutils.mergeHeaders(hookExecutionContext.httpContext.request.headers, response.headers);
        var contentBuffer = new Buffer(response.content);
        var contentLengthAsString = 'Content-Length';
        var contentLengthHeaderName = headerutils.getActualHeaderName(mergedHeaders, contentLengthAsString) || contentLengthAsString;
        mergedHeaders[contentLengthHeaderName] =  contentBuffer.length;
        hookExecutionContext.httpContext.request.headers = mergedHeaders;
        hookExecutionContext.httpContext.request.content = response.content;
    }
}

function processPostResponderHookContinueResponse(hookExecutionContext, hookContext) {
    // If the defined hook is a post processing responder
    // and the returned HTTP status code for it is Continue, this means that we will override
    // the actual response with the response content. Such response content is expected to be
    // a single response containing the actual status code to return and the
    // content that will be ultimately relayed back if we are able to deserialize it
    var response = getResponseFromHookResponseContent(hookExecutionContext, hookContext);
    if (response) {
        hookExecutionContext.httpContext.response.responses.length = 0;
        var shortenedResponse = HookContext.createResponse(
            response.statusCode,
            response.headers,
            response.content);
        hookExecutionContext.httpContext.response.responses.push(shortenedResponse);
    }
}

function processPreOrPostResponderHook(hookExecutionContext, hookContext, cb) {
    if (isValidHookContextResponse(hookExecutionContext, hookContext.response)) {
        if (hookContext.response.statusCode === 100) {
            if (hookExecutionContext.hook.order === 'pre') {
                debug('Pre-processing responder hook responded with Continue');
                processPreResponderHookContinueResponse(hookExecutionContext, hookContext);
            } else if (hookExecutionContext.hook.order === 'post') {
                debug('Post-processing responder hook responded with Continue');
                processPostResponderHookContinueResponse(hookExecutionContext, hookContext);
            }

            cb();
        } else if (!HookContext.isSuccessfulStatusCode(hookContext.response.statusCode)) {
            hookExecutionContext.httpContext.response.responses.length = 0;
            var shortenedResponse = HookContext.createResponse(
                hookContext.response.statusCode,
                hookContext.response.headers,
                hookContext.response.content);
            hookExecutionContext.httpContext.response.responses.push(shortenedResponse);
            var hook = hookExecutionContext.hook;
            var errorMessage =
                'Finalizing hook execution chain for request since ' + hook.type +
                ' hook with identifier ' + hook.identifier +
                ' (' + hook.method + ' on ' + '\''+ hook.urlPatternString + '\') returned a unsuccessful ' +
                'response for the following HookContext: ' + JSON.stringify(hookContext);
            cb(new Error(errorMessage));
        } else {
            cb();
        }
    } else {
        var hook = hookExecutionContext.hook;
        debug(
            'Skipping hook response processing for request since ' + hook.type +
            ' hook with identifier ' + hook.identifier +
            ' (' + hook.method + ' on ' + '\''+ hook.urlPatternString + '\') returned an invalid ' +
            'response for the following HookContext: ' + JSON.stringify(hookContext));
        cb();
    }
}

function processPreResponderHook(hookExecutionContext, hookContext, cb) {
    processPreOrPostResponderHook(hookExecutionContext, hookContext, cb);
}

function processResponderHook(hookExecutionContext, hookContext, cb) {
    if (isValidHookContextResponse(hookExecutionContext, hookContext.response)) {
    var shortenedResponse = HookContext.createResponse(
        hookContext.response.statusCode,
        hookContext.response.headers,
        hookContext.response.content);
        hookExecutionContext.httpContext.response.responses.push(shortenedResponse);
    } else {
        var hook = hookExecutionContext.hook;
        debug(
            'Skipping hook response processing for request since ' + hook.type +
            ' hook with identifier ' + hook.identifier +
            ' (' + hook.method + ' on ' + '\''+ hook.urlPatternString + '\') returned an invalid ' +
            'response for the following HookContext: ' + JSON.stringify(hookContext));
    }

    cb();
}

function processPostResponderHook(hookExecutionContext, hookContext, cb) {
    processPreOrPostResponderHook(hookExecutionContext, hookContext, cb);
}

function processResponderHookResponse(hookExecutionContext, hookContext, cb) {
    var hook = hookExecutionContext.hook;
    if (hook.type === 'pre-responder') {
        processPreResponderHook(hookExecutionContext, hookContext, cb);
    } else if (hook.type === 'responder') {
        processResponderHook(hookExecutionContext, hookContext, cb);
    } else if (hook.type === 'post-responder') {
        processPostResponderHook(hookExecutionContext, hookContext, cb);
    }
}

function executeResponderHooks(hooks, httpContext, stage, chainCallback) {
    async.eachSeries(
        mapToHookExecutionContext(hooks, httpContext),
        function (hookExecutionContext, cb) {
            if (strings.endsWith(hookExecutionContext.hook.type, 'responder')) {
                executeHook(hookExecutionContext, function (hookContext) {
                    var hook = hookExecutionContext.hook;
                    debug(
                        'Hook execution complete for ' + hook.type +
                        ' hook with identifier ' + hook.identifier +
                        ' (\'' + hook.method + '\' on ' + '\''+ hook.urlPatternString + '\')');
                    processResponderHookResponse(hookExecutionContext, hookContext, cb);
                });
            } else {
                cb();
            }
        },
        function (error) {
            // We either received an error that terminates the hook
            // execution chain meaning or we are at the end
            if (error) {
                chainCallback(error);
            } else {
                chainCallback(null, stage);
            }
        });
}

function requestPreProcessing(hooks, httpContext, chainCallback) {
    var stage = 'pre';
    var preResponderHooks = getPreResponderHooks(hooks);
    if (preResponderHooks.length > 0) {
        debug('Executing pre-responder hooks...');
        executeResponderHooks(preResponderHooks, httpContext, stage, chainCallback);
    } else {
        chainCallback(null, stage);
    }
}

function requestProcessing(hooks, httpContext, chainCallback) {
    var stage = 'in';
    var preListenerHooks = getPreListenerHooks(hooks);
    if (preListenerHooks.length > 0) {
        debug('Executing pre-listener hooks...');
        executeListenerHooks(preListenerHooks, httpContext);
    }

    var inResponderHooks = getResponderHooks(hooks);
    if (inResponderHooks.length > 0) {
        debug('Executing responder hooks...');
        executeResponderHooks(inResponderHooks, httpContext, stage, chainCallback);
    } else {
        chainCallback(null, stage);
    }

    var postListenerHooks = getPostListenerHooks(hooks);
    if (postListenerHooks.length > 0) {
        debug('Executing post-listener hooks...');
        executeListenerHooks(postListenerHooks, httpContext);
    }
}

function requestPostProcessing(hooks, httpContext, chainCallback) {
    var stage = 'post';
    var postResponderHooks = getPostResponderHooks(hooks);
    if (postResponderHooks.length > 0) {
        debug('Executing post-responder hooks...');
        executeResponderHooks(postResponderHooks, httpContext, stage, chainCallback);
    } else {
        chainCallback(null, stage);
    }
}

function convertResponseToMixedPart(response) {
    var httpVersion = new Buffer('HTTP/1.1');
    var crlf = new Buffer('\r\n');
    var space = new Buffer(' ');
    var partHeaders = Buffer.concat([
        new Buffer('Content-Type: application/http'),
        crlf,
        new Buffer('Content-Transfer-Encoding: binary'),
        crlf
    ]);
    var bodyContent = new Buffer(response.content);
    var statusHeader = Buffer.concat([
        new Buffer(httpVersion),
        space,
        new Buffer(response.statusCode.toString()),
        space,
        new Buffer(http.STATUS_CODES[response.statusCode]),
        crlf
    ]);
    var bodyHeaders = [ statusHeader ];
    for (var headerName in response.headers) {
        if (headerName.toLowerCase() !== 'content-length') {
            var header = Buffer.concat([
                new Buffer(headerName + ': ' + response.headers[headerName]),
                crlf]);
            bodyHeaders.push(header);
        }
    }

    var contentLengthHeader = Buffer.concat([
        new Buffer('Content-Length: ' + bodyContent.length),
        crlf
    ]);
    bodyHeaders.push(contentLengthHeader);
    var part = Buffer.concat([
        partHeaders,
        crlf,
        Buffer.concat(bodyHeaders),
        crlf,
        bodyContent
    ]);
    return part;
}

function convertResponsesToParts(responses) {
    var parts = [];
    responses.forEach(function (response) {
        var part = convertResponseToMixedPart(response);
        parts.push(part);
    });

    return parts;
}

function flattenResponsesIntoMultipart(responses) {
    var multipart = new Multipart({ parts: convertResponsesToParts(responses) });
    return multipart.compose();
}

function normalizeIntoSingleResponse(httpContext) {
    var response = null;
    if (httpContext.response.responses.length === 0) {
        var contentBuffer = new Buffer('');
        response = HookContext.createResponse(
            200,
            {
                'Content-Type': 'application/json',
                'Content-Length': contentBuffer.length
            },
            contentBuffer);
    } else if (httpContext.response.responses.length === 1) {
        var contentBuffer = new Buffer(httpContext.response.responses[0].content);
        response = HookContext.createResponse(
            httpContext.response.responses[0].statusCode,
            httpContext.response.responses[0].headers,
            contentBuffer);
        var contentLengthExists = headerutils.getActualHeaderName(response.headers, 'Content-Length') !== null;
        if (!contentLengthExists) {
            response.headers['Content-Length'] =  contentBuffer.length;
        }
    } else {
        var multipart = flattenResponsesIntoMultipart(httpContext.response.responses);
        response = HookContext.createResponse(
            202,
            multipart.headers,
            multipart.content);
    }

    return response;
}

function sendResponse(httpContext, response) {
    httpContext.response.writeHead(response.statusCode, response.headers);
    httpContext.response.write(response.content);
    httpContext.response.end();
}

/**
 * The `callback` function to invoke whenever there is no hooks that matches the request.
 * @method
 * @param {function} callback The callback to invoke when there is no matching hook.
 */
HttpHooks.prototype.onNoMatch = function (callback) {
    var valid = isValidCallback(callback);
    if (!valid) {
        throw new Error('Invalid callback');
    }

    this.noMatch = callback;
};

function processRequest(httpContext) {
    var hooks = getHooksWithMethodAndUrl.call(
        this,
        httpContext.request.method.toLowerCase(),
        httpContext.request.url);
    if (hooks.length > 0) {
        debug(
            'Found ' + hooks.length + ' matching hooks for method=\'' +
            httpContext.request.method + '\' and url=\'' +
            httpContext.request.url + '\'');
        // TODO: Process request-listeners asynchronously (fire and forget)
        async.series([
            function (cb) {
                debug('Request pre-processing...');
                requestPreProcessing(hooks, httpContext, cb);
            },
            function (cb) {
                debug('Request processing...');
                requestProcessing(hooks, httpContext, cb);
            },
            function (cb) {
                debug('Request post-processing...');
                requestPostProcessing(hooks, httpContext, cb);
            }
        ],
        function (error, result) {
            if (error) {
                debug('Execution chain cancelled');
            } else {
                debug('Execution chain completed');
            }

            var response = normalizeIntoSingleResponse(httpContext);
            sendResponse(httpContext, response);
            // TODO: Process response-listeners asynchronously (fire and forget)
        });
    } else {
        debug(
            'No hooks matched for method=\'' + httpContext.request.method +
            '\' and url=\'' + httpContext.request.url + '\'');
        this.noMatch(httpContext);
    }
}

function dispatchRequest(httpContext) {
    if (isValidRequest(httpContext)) {
        httpContext.request.chunks = [];
        httpContext.response.responses = [];
        httpContext.request.on('data', function (chunk) {
            debug('Starting to recieve data for request');
            httpContext.request.chunks.push(chunk.toString());
        });

        var that = this;
        httpContext.request.on('end', function () {
            debug('Finished recieving data for request');
            httpContext.request.content = httpContext.request.chunks.join('');
            processRequest.call(that, httpContext);
        });
    } else {
        debug('Skipping dispatch request since its invalid');
    }
}

/**
 * Dispatches the `httpContext` to the corresponding matching hooks.
 * @method
 * @param {HttpContext} httpContext The http context that represents the request.
 */
HttpHooks.prototype.dispatch = function (httpContext) {
    dispatchRequest.call(this, httpContext);
};

module.exports = HttpHooks;
