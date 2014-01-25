/**
 * @title HttpHooks Reference
 * @author Elmar Langholz
 */

var debug = require('debug')('HttpHooks');
var http = require('http');
var url = require('url');
var Rx = require('rx');
var Map = require('collections/map');
var uuid = require('node-uuid');
var RoutePattern = require("route-pattern");
var async = require('async');
var constants = require('./common/constants.js');
var Hook = require('./hook.js');
var HookCallback = require('./hookCallback.js');
var HookContext = require('./hookContext.js');
var HookContextResponse = require('./hookContextResponse.js');
var socketIoHelper = require('./socketio/index.js');
var Multipart = require('./common/multipart.js');
var headerutils = require('./common/headerutils.js');
var strings = require('./common/strings.js');
var validate = require('./common/validate.js');

function initializeAsObserver() {
    Rx.Observer.call(this);
    this.isStopped = false;
}

/**
 * Create an HttpContext object
 * @class HttpContext
 * @member {object} request The HTTP request object.
 * @member {object} response The HTTP response object.
 */

/**
 * Create a SocketContext object
 * @class SocketContext
 * @member {object} socket The socket object.
 */

/**
 * Create an HttpHooksOptions object
 * @class HttpHooksOptions
 * @member {Hook[]} [hooks] The hooks to initialize the instance with.
 * @member {function} [noMatchHandler] The `httpContext` handler for when there is no matching hook or default responder. By default, a 404 response is issued if none is provided.
 * @member {function} [defaultResponder] The responder to use when there are no matching responder hooks. By default, null meaning nothing will be executed and instead causing the noMatchHandler to be called.
 */

/**
 * Create an HttpHooks object
 * @class HttpHooks
 */

/**
 * Initializes a new instance of the `HttpHooks`.
 * @function HttpHooks
 * @param {HttpHooksOptions} [options] The `HttpHooks` options to initialize the instance with.
 */
var HttpHooks = function (options) {
    options = options || { hooks: [], defaultResponder: null, noMatchHandler: respondWithNotFoundStatusCode };
    if (typeof options !== 'object') {
        throw new TypeError('Invalid options type: expected an object');
    }

    options.hooks = options.hooks || [];
    options.defaultResponder = typeof options.defaultResponder === 'undefined' ? null : options.defaultResponder;
    if (typeof options.defaultResponder !== 'function' && options.defaultResponder !== null) {
        throw new TypeError('Invalid options defaultResponder type: expected a function or null');
    }

    options.noMatchHandler = typeof options.noMatchHandler === 'undefined'
                             ? respondWithNotFoundStatusCode
                             : options.noMatchHandler;
    if (typeof options.noMatchHandler !== 'function') {
        throw new TypeError('Invalid options noMatchHandler type: expected a function');
    }

    options.hooks = options.hooks || [];
    initializeHooks.call(this);
    Hook.validateHooks(options.hooks);
    addHooks.call(this, options.hooks);
    this.noMatch = options.noMatchHandler;
    this.defaultResponder = options.defaultResponder;
    debug('defaultResponder ' + typeof this.defaultResponder);
    initializeAsObserver.call(this);

    debug('Constructor: ' + options.hooks.length + ' hook(s) provided');
};

HttpHooks.prototype = Object.create(Rx.Observer.prototype);
HttpHooks.prototype.constructor = HttpHooks;

Object.defineProperties(HttpHooks.prototype, {
    onNext: {
        value: function (context) {
            if (!this.isStopped) {
                debug('Observer: next');
                dispatchRequest.call(this, context);
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

function normalizeHook(hook) {
    var normalizedHook = {
        method: hook.method.toLowerCase(),
        urlPatternString: hook.urlPattern,
        urlPattern: RoutePattern.fromString(hook.urlPattern),
        type: hook.type.toLowerCase(),
        callback: hook.callback
    };
    return normalizedHook;
}

function initializeHooks() {
    this.hooks = new Map();
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

function getHooksWithMatchingMethodAndUrl(method, url) {
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
    if (Hook.isValidHook(hook)) {
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
    Hook.validateHooks(hooks);
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

    if (Hook.isValidHook(hook)) {
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
 * @param {string} [prefix] The prefix of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.
 */
HttpHooks.prototype.getListener = function (urlPattern, cb, prefix) {
    prefix = typeof prefix === 'undefined' ? 'response' : prefix;
    var hook = {
        method: 'get',
        urlPattern: urlPattern,
        type: (prefix !== '' ? prefix + '-' : '') + 'listener',
        callback: cb
    };

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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
 * @param {string} [prefix] of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.
 */
HttpHooks.prototype.getResponder = function (urlPattern, cb, prefix) {
    prefix = typeof prefix === 'undefined' ? '' : prefix;
    var hook = {
        method: 'get',
        urlPattern: urlPattern,
        type: (prefix !== '' ? prefix + '-' : '') + 'responder',
        callback: cb
    };

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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
 * @param {string} [prefix] of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.
 */
HttpHooks.prototype.putListener = function (urlPattern, cb, prefix) {
    prefix = typeof prefix === 'undefined' ? 'response' : prefix;
    var hook = {
        method: 'put',
        urlPattern: urlPattern,
        type: (prefix !== '' ? prefix + '-' : '') + 'listener',
        callback: cb
    };

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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
 * @param {string} [prefix] of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.
 */
HttpHooks.prototype.putResponder = function (urlPattern, cb, prefix) {
    prefix = typeof prefix === 'undefined' ? '' : prefix;
    var hook = {
        method: 'put',
        urlPattern: urlPattern,
        type: (prefix !== '' ? prefix + '-' : '') + 'responder',
        callback: cb
    };

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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
 * @param {string} [prefix] of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.
 */
HttpHooks.prototype.postListener = function (urlPattern, cb, prefix) {
    prefix = typeof prefix === 'undefined' ? 'response' : prefix;
    var hook = {
        method: 'post',
        urlPattern: urlPattern,
        type: (prefix !== '' ? prefix + '-' : '') + 'listener',
        callback: cb
    };

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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
 * @param {string} [prefix] of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.
 */
HttpHooks.prototype.postResponder = function (urlPattern, cb, prefix) {
    prefix = typeof prefix === 'undefined' ? '' : prefix;
    var hook = {
        method: 'post',
        urlPattern: urlPattern,
        type: (prefix !== '' ? prefix + '-' : '') + 'responder',
        callback: cb
    };

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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
 * @param {string} [prefix] of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.
 */
HttpHooks.prototype.deleteListener = function (urlPattern, cb, prefix) {
    prefix = typeof prefix === 'undefined' ? 'response' : prefix;
    var hook = {
        method: 'delete',
        urlPattern: urlPattern,
        type: (prefix !== '' ? prefix + '-' : '') + 'listener',
        callback: cb
    };

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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
 * @param {string} [prefix] of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.
 */
HttpHooks.prototype.deleteResponder = function (urlPattern, cb, prefix) {
    prefix = typeof prefix === 'undefined' ? '' : prefix;
    var hook = {
        method: 'delete',
        urlPattern: urlPattern,
        type: (prefix !== '' ? prefix + '-' : '') + 'responder',
        callback: cb
    };

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
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

    if (Hook.isValidHook(hook)) {
        addHook.call(this, hook);
    } else {
        throw new TypeError('Invalid hook');
    }
};

function respondWithBadRequestStatusCode(httpContext) {
    httpContext.response.writeHead(400, { 'Content-Type': 'text/html' });
    httpContext.response.write('Bad Request');
    httpContext.response.end();
}

function respondWithMethodNotAllowedStatusCode(httpContext) {
    httpContext.response.writeHead(405, { 'Content-Type': 'text/html' });
    httpContext.response.write('Method Not Allowed');
    httpContext.response.end();
}

function respondWithNotFoundStatusCode(httpContext) {
    httpContext.response.writeHead(404, { 'Content-Type': 'text/html' });
    httpContext.response.write('Not Found');
    httpContext.response.end();
}

function normalizeHttpContext(httpContext) {
    var requestType = httpContext.request.headers['x-httphooks-request-type'];
    if (typeof requestType === 'string' && requestType === 'remote-hook') {
        var remoteHookContext = JSON.parse(httpContext.request.content);
        httpContext.request.content = remoteHookContext.request.content;
        httpContext.request.headers = remoteHookContext.request.headers;
        httpContext.responseQueue = remoteHookContext.responseQueue;
    }
}

function isValidHttpRequest(httpContext) {
    var valid = validate.isValidRequestMethod(httpContext.request.method);
    if (!valid) {
        debug('Received an unsupported request method: ' + httpContext.request.method);
        respondWithMethodNotAllowedStatusCode(httpContext);
    }

    return valid;
}

function getHooksWithType(hooks, type) {
    var matchHooksWithType = function (hook) {
        return hook.type === type;
    };
    var matchedHooks = searchHooks(hooks, matchHooksWithType);
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

function mapToHookExecutionContext(hooks, context) {
    return hooks.map(function (hook) {
        return {
            hook: hook,
            context: context
        };
    });
}

function executeHook(hookExecutionContext, executionCompleteCallback) {
    var hook = hookExecutionContext.hook;
    var hookContext = new HookContext(hookExecutionContext.context, hook);
    try {
        // Delay loading of the function until it is first needed for execution
        if (typeof hook.callback === 'object') {
            hook.callback = HookCallback.createFunctionFromHook(hook);
        }

        hook.callback(hookContext, function (error) {
            executionCompleteCallback(hookContext, error);
        });
    } catch (error) {
        // TODO: Add a mechanism to black list hooks when we are unable to load the function with a possible time delay?
        debug('HookContext: ' + JSON.stringify(hookContext));
        executionCompleteCallback(hookContext, error, true);
    }
}

function executeListenerHooks(hooks, context) {
    async.each(
        mapToHookExecutionContext(hooks, context),
        function (hookExecutionContext, cb) {
            if (strings.endsWith(hookExecutionContext.hook.type, 'listener')) {
                executeHook(hookExecutionContext, function (hookContext, error, unexpectedError) {
                    var hook = hookExecutionContext.hook;
                    if (!error) {
                        debug(
                            'Hook execution complete for ' + hook.type + ' hook with identifier ' + hook.identifier +
                            ' (\'' + hook.method + '\' on ' + '\''+ hook.urlPatternString + '\')');
                    } else {
                        debug(
                            'Hook execution ' + (unexpectedError ? 'unexpected error' : 'error') + ' for ' + hook.type +
                            ' hook with identifier ' + hook.identifier + ' (\'' + hook.method + '\' on ' +
                            '\''+ hook.urlPatternString + '\'): ' + JSON.stringify(error));
                    }
                });
            }

            cb();
        },
        function (error) {
            if (error) {
                debug('We should not reach this condition since we never pass an error in the callback: ' + error);
            }
        });
}

function executeResponderHooks(hooks, context, stage, chainCallback) {
    async.eachSeries(
        mapToHookExecutionContext(hooks, context),
        function (hookExecutionContext, cb) {
            if (strings.endsWith(hookExecutionContext.hook.type, 'responder')) {
                executeHook(hookExecutionContext, function (hookContext, error, unexpectedError) {
                    var hook = hookExecutionContext.hook;
                    if (!error) {
                        debug(
                            'Hook execution complete for ' + hook.type +
                            ' hook with identifier ' + hook.identifier +
                            ' (\'' + hook.method + '\' on ' + '\''+ hook.urlPatternString + '\')');
                    } else {
                        var content = unexpectedError ? { error: 'Internal server error' } : { error: error };
                        hookContext.setResponse(500, { 'Content-Type': 'application/json' }, content);
                        debug(
                            'Hook execution ' + (unexpectedError ? 'unexpected error' : 'error') + ' for ' + hook.type +
                            ' hook with identifier ' + hook.identifier + ' (\'' + hook.method + '\' on ' +
                            '\''+ hook.urlPatternString + '\'): ' + JSON.stringify(error));
                    }

                    processResponderHookResponse(hookExecutionContext, hookContext, cb);
                });
            } else {
                cb();
            }
        },
        function (error) {
            // We either received an error that terminates the hook
            // execution chain meaning that a pre or post responder hook
            // returned an unsuccessful status code, or we are at the end of the
            // execution chain of the hook type
            if (error) {
                chainCallback(error);
            } else {
                chainCallback(null, stage);
            }
        });
}

function isValidHookContextResponse(hookExecutionContext, response) {
    var valid = HookContextResponse.isValid(response);
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
        var mergedHeaders = headerutils.mergeHeaders(hookExecutionContext.context.request.headers, response.headers);
        var contentBuffer = new Buffer(response.content);
        var contentLengthAsString = 'Content-Length';
        var contentLengthHeaderName = headerutils.getActualHeaderName(mergedHeaders, contentLengthAsString) || contentLengthAsString;
        mergedHeaders[contentLengthHeaderName] =  contentBuffer.length;
        hookExecutionContext.context.request.headers = mergedHeaders;
        hookExecutionContext.context.request.content = response.content;
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
        hookExecutionContext.context.responseQueue.length = 0;
        var shortenedResponse = HookContextResponse.createResponse(
            response.statusCode,
            response.headers,
            response.content);
        hookExecutionContext.context.responseQueue.push(shortenedResponse);
    }
}

function processPreOrPostResponderHook(hookExecutionContext, hookContext, cb) {
    if (isValidHookContextResponse(hookExecutionContext, hookContext.response)) {
        if (hookContext.response.statusCode === 100) {
            if (hookExecutionContext.hook.type.indexOf('pre') === 0) {
                debug('Pre-processing responder hook responded with Continue');
                processPreResponderHookContinueResponse(hookExecutionContext, hookContext);
            } else if (hookExecutionContext.hook.type.indexOf('post') === 0) {
                debug('Post-processing responder hook responded with Continue');
                processPostResponderHookContinueResponse(hookExecutionContext, hookContext);
            }

            cb();
        } else if (!HookContextResponse.isSuccessfulStatusCode(hookContext.response.statusCode)) {
            hookExecutionContext.context.responseQueue.length = 0;
            var shortenedResponse = HookContextResponse.createResponse(
                hookContext.response.statusCode,
                hookContext.response.headers,
                hookContext.response.content);
            hookExecutionContext.context.responseQueue.push(shortenedResponse);
            var hook = hookExecutionContext.hook;
            var errorMessage =
                'Finalizing hook execution chain for request since ' + hook.type +
                ' hook with identifier ' + hook.identifier +
                ' (' + hook.method + ' on ' + '\''+ hook.urlPatternString + '\') returned a unsuccessful ' +
                'response for the following HookContext: ' + JSON.stringify(hookContext);
            debug(errorMessage);
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
    var shortenedResponse = HookContextResponse.createResponse(
        hookContext.response.statusCode,
        hookContext.response.headers,
        hookContext.response.content);
        hookExecutionContext.context.responseQueue.push(shortenedResponse);
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
    if (httpContext.responseQueue.length === 0) {
        var contentBuffer = new Buffer('');
        response = HookContextResponse.createResponse(
            200,
            {
                'Content-Type': 'application/json',
                'Content-Length': contentBuffer.length
            },
            contentBuffer);
    } else if (httpContext.responseQueue.length === 1) {
        var contentBuffer = new Buffer(httpContext.responseQueue[0].content);
        response = HookContextResponse.createResponse(
            httpContext.responseQueue[0].statusCode,
            httpContext.responseQueue[0].headers,
            contentBuffer);
        var contentLengthExists = headerutils.getActualHeaderName(response.headers, 'Content-Length') !== null;
        if (!contentLengthExists) {
            response.headers['Content-Length'] =  contentBuffer.length;
        }
    } else {
        var multipart = flattenResponsesIntoMultipart(httpContext.responseQueue);
        response = HookContextResponse.createResponse(
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
 * Sets the function to invoke whenever there are no hooks that match the request.
 * @method
 * @param {function} cb The callback to invoke when there is no matching hook.
 */
HttpHooks.prototype.noMatchHandler = function (cb) {
    if (typeof cb !== 'function') {
        throw new Error('Invalid callback: expected a function');
    }

    this.noMatch = cb;
};

function inputStage(hooks, httpContext, chainCallback) {
    var hookType = 'request-listener';
    var requestListenerHooks = getRequestListenerHooks(hooks);
    debug('Executing ' + hookType + '[' + requestListenerHooks.length + '] hooks');
    if (requestListenerHooks.length > 0) {
        executeListenerHooks(requestListenerHooks, httpContext);
    }

    chainCallback(null, hookType);
}

function preProcessingResponderStage(hooks, httpContext, chainCallback) {
    var hookType = 'pre-responder';
    var preResponderHooks = getPreResponderHooks(hooks);
    debug('Executing ' + hookType + '[' + preResponderHooks.length + '] hooks');
    if (preResponderHooks.length > 0) {
        executeResponderHooks(preResponderHooks, httpContext, hookType, chainCallback);
    } else {
        chainCallback(null, hookType);
    }
}

function preProcessingListenerStage(hooks, httpContext, chainCallback) {
    var hookType = 'pre-listener';
    var preListenerHooks = getPreListenerHooks(hooks);
    debug('Executing ' + hookType + '[' + preListenerHooks.length + '] hooks');
    if (preListenerHooks.length > 0) {
        executeListenerHooks(preListenerHooks, httpContext);
    }

    chainCallback(null, hookType);
}

function preProcessingStage(hooks, httpContext, chainCallback) {
    preProcessingResponderStage(
        hooks,
        httpContext,
        function (responderError, responderResult) {
            preProcessingListenerStage(
                hooks,
                httpContext,
                function (listenerError, listenerResult) {
                    // We ignore any error or result provided by the
                    // processing of the pre-listeners and instead use those
                    // of the pre-responder since they determine whether or not
                    // we cancel the execution chain
                    chainCallback(responderError, responderResult);
                });
        });
}

function processingStage(defaultResponder, hooks, httpContext, chainCallback) {
    var type = 'responder';
    var responderHooks = getResponderHooks(hooks);
    debug('Executing ' + type + '[' + responderHooks.length + '] hooks');
    if (responderHooks.length > 0) {
        executeResponderHooks(responderHooks, httpContext, type, chainCallback);
    } else if (typeof defaultResponder === 'function') {
        debug('Executing default responder');
        var defaultResponderHook = {
            identifier: 'defaultResponder',
            urlPatternString: httpContext.request.url,
            method: httpContext.request.method,
            urlPattern: httpContext.request.url,
            type: type,
            callback: defaultResponder
        };
        executeResponderHooks([defaultResponderHook], httpContext, type, chainCallback);
    } else {
        chainCallback(null, type);
    }
}

function postProcessingResponderStage(hooks, httpContext, chainCallback) {
    var hookType = 'post-responder';
    var postResponderHooks = getPostResponderHooks(hooks);
    debug('Executing ' + hookType + '[' + postResponderHooks.length + '] hooks');
    if (postResponderHooks.length > 0) {
        executeResponderHooks(postResponderHooks, httpContext, hookType, chainCallback);
    } else {
        chainCallback(null, hookType);
    }
}

function postProcessingListenerStage(hooks, httpContext, chainCallback) {
    var hookType = 'post-listener';
    var postListenerHooks = getPostListenerHooks(hooks);
    debug('Executing ' + hookType + '[' + postListenerHooks.length + '] hooks');
    if (postListenerHooks.length > 0) {
        executeListenerHooks(postListenerHooks, httpContext);
    }

    chainCallback(null, hookType);
}

function postProcessingStage(hooks, httpContext, chainCallback) {
    postProcessingListenerStage(
        hooks,
        httpContext,
        function (listenerError, listenerResult) {
            postProcessingResponderStage(
                hooks,
                httpContext,
                function (responderError, responderResult) {
                    // We ignore any error or result provided by the
                    // processing of the post-listeners and instead use those
                    // of the post-responder since they determine whether or not
                    // we cancel the execution chain
                    chainCallback(responderError, responderResult);
                });
        });
}

function outputStage(hooks, httpContext, chainCallback) {
    var hookType = 'response-listener';
    var responseListenerHooks = getResponseListenerHooks(hooks);
    debug('Executing ' + hookType + '[' + responseListenerHooks.length + '] hooks');
    if (responseListenerHooks.length > 0) {
        executeListenerHooks(responseListenerHooks, httpContext);
    }

    chainCallback(null, hookType);
}

function getHookTypes(hookTypesList) {
    var hookTypes = hookTypesList;
    if (hookTypesList && hookTypesList !== '*') {
        var hookTypes = hookTypesList.split(',');
        hookTypes = hookTypes.map(function (element) {
            return element.toLowerCase().trim();
        }).filter(function (element) {
            return validate.isValidHookType(element);
        });
    }

    return hookTypes;
}

function getHooks(httpContext) {
    // Retrieve any hooks that have a matching method and url
    var hooks = getHooksWithMatchingMethodAndUrl.call(
        this,
        httpContext.request.method.toLowerCase(),
        httpContext.request.url);
    debug(
        'Found ' + hooks.length + ' matching hooks for method=\'' +
        httpContext.request.method + '\' and url=\'' +
        httpContext.request.url + '\'');

    // If the incoming request limits the hook types to execute,
    // we filter the hooks to only return the ones with matching types
    var hookTypesList = httpContext.request.headers['x-httphooks-hook-type-filter'];
    var hookTypes = getHookTypes(hookTypesList);
    if (hookTypes && hookTypes !== '*') {
        debug('Filtering hooks with the following type list: ' + hookTypesList);
        hooks = hooks.filter(function (hook) {
            return hookTypes.indexOf(hook.type) >= 0;
        });
    }

    return hooks;
}

function processHttpRequest(httpContext) {
    try {
        normalizeHttpContext(httpContext);
    } catch (error) {
        debug('Unable to normalize http context due to: ' + error);
        debug('Sending bad request back to client...');
        respondWithBadRequestStatusCode(httpContext);
        return;
    }

    var hooks = getHooks.call(this, httpContext);
    if (hooks.length > 0 || typeof this.defaultResponder === 'function') {
        debug('Processing ' + hooks.length + ' hooks');
        var defaultResponder = this.defaultResponder;
        async.series([
            function (cb) {
                debug('Stage: Input');
                inputStage(hooks, httpContext, cb);
            },
            function (cb) {
                debug('Stage: Pre-processing');
                preProcessingStage(hooks, httpContext, cb);
            },
            function (cb) {
                debug('Stage: Processing');
                processingStage(defaultResponder, hooks, httpContext, cb);
            },
            function (cb) {
                debug('Stage: Post-processing');
                postProcessingStage(hooks, httpContext, cb);
            }],
            function (error, result) {
                debug('Stage: Output');
                if (error) {
                    debug('Execution chain cancelled');
                } else {
                    debug('Execution chain completed');
                }

                var response = normalizeIntoSingleResponse(httpContext);
                sendResponse(httpContext, response);

                // Set the context response properties
                httpContext.response.statusCode = response.statusCode;
                httpContext.response.headers = response.headers;
                httpContext.response.content = response.content.toString();
                outputStage(hooks, httpContext, function () {});
            });
    } else {
        debug(
            'No hooks matched for method=\'' + httpContext.request.method +
            '\' and url=\'' + httpContext.request.url + '\'');
        this.noMatch(httpContext);
    }
}

function dispatchHttpRequest(httpContext) {
    if (isValidHttpRequest(httpContext)) {
        httpContext.request.chunks = [];
        httpContext.responseQueue = [];
        httpContext.request.on('data', function (chunk) {
            debug('Starting to receive data for request');
            httpContext.request.chunks.push(chunk.toString());
        });

        var that = this;
        httpContext.request.on('end', function () {
            debug('Finished receiving data for request');
            httpContext.request.content = httpContext.request.chunks.join('');
            processHttpRequest.call(that, httpContext);
        });
    } else {
        debug('Skipping HTTP request dispatching since its invalid');
    }
}

function isValidSocketRequest(request) {
    var valid = validate.isValidRequestMethod(request.method);
    if (valid) {
        valid = typeof request.url === 'string' && typeof request.headers === 'object'
                && typeof request.content !== 'undefined';
    }

    return valid;
}

function dispatchSocketRequest(context) {
    var that = this;
    context.socket.on('request', function (request, responseCallback) {
        if (isValidSocketRequest(request)) {
            var httpContext = socketIoHelper.createHttpContextFromSocketIo(context.socket, request, responseCallback);
            httpContext.responseQueue = [];
            processHttpRequest.call(that, httpContext);
        } else {
            debug('Skipping Socket request dispatching since its invalid');
        }
    });
    context.socket.on('disconnect', function () {
        debug('Socket connection terminated');
    });
}

function dispatchRequest(context) {
    if (context.request && context.response) {
        debug('Incoming HTTP request');
        dispatchHttpRequest.call(this, context);
    } else if (context.socket) {
        debug('Incoming Socket request');
        dispatchSocketRequest.call(this, context);
    } else {
        throw new TypeError('Invalid context type');
    }
}

/**
 * Dispatches the context to the corresponding matching hooks.
 * @method
 * @param {HttpContext | SocketContext} context The context that contains the request.
 */
HttpHooks.prototype.dispatch = function (context) {
    dispatchRequest.call(this, context);
};

module.exports = HttpHooks;
