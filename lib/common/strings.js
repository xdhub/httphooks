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

var endsWith = function (str, terminator) {
    if (typeof str !== 'string') {
        throw new TypeError('Invalid string type: expected a string');
    }

    if (typeof terminator !== 'string') {
        throw new TypeError('Invalid terminator type: expected a string');
    }

    return str.indexOf(terminator, str.length - terminator.length) !== -1;
};

module.exports = {
    endsWith: endsWith
};
