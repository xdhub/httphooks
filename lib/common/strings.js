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
