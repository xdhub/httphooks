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

var debug = require('debug')('validate');
var constants = require('./constants.js');

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

var isValidHookType = function (type) {
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
};

module.exports = {
    isValidRequestMethod: isValidRequestMethod,
    isValidHookType: isValidHookType
};