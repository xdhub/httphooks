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
 * @title HookInformation Reference
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
