//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
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