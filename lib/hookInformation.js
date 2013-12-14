/**
 * @title HookInformation Reference
 * @author Elmar Langholz
 */

var clone = require('clone');

/**
 * Create an HookInformation object
 * @class HookInformation
 * @member {string} identifier The hook's unique identifier.
 * @member {string} urlPattern The url pattern (in the form [route-pattern](https://github.com/bjoerge/route-pattern)) corresponding to the hook.
 * @member {string} type The lower-cased hook type corresponding to the hook: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`
 */
var createHookInformation = function (hook) {
    return {
        identifier: clone(hook.identifier),
        urlPattern: clone(hook.urlPatternString),
        type: clone(hook.type)
    };
};

module.exports = {
    createHookInformation: createHookInformation
};
