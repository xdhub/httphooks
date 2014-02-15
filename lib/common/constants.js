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

var requestMethods = [
    // http://www.ietf.org/rfc/rfc2616.txt
    'GET',
    'POST',
    'PUT',
    'DELETE',
    // http://www.ietf.org/rfc/rfc5789.txt
    // 'PATCH'
].map(function (method) {
    return method.toLowerCase();
});

var hookListenerPrefixes = [
    'REQUEST',
    'PRE',
    'POST',
    'RESPONSE'
].map(function (order) {
    return order.toLowerCase();
});

var hookListenerTypes = hookListenerPrefixes.map(function (prefix) {
    return ((prefix !== '' ? prefix + '-' : '') + 'LISTENER').toLowerCase();
});

var hookResponderPrefixes = [
    'PRE',
    '',
    'POST'
].map(function (prefix) {
    return prefix.toLowerCase();
});

var hookResponderTypes = hookResponderPrefixes.map(function (prefix) {
    return ((prefix !== '' ? prefix + '-' : '') + 'RESPONDER').toLowerCase();
});

var hookTypes = hookListenerTypes.concat(hookResponderTypes);

module.exports = {
    requestMethods: requestMethods,
    hookListenerPrefixes: hookListenerPrefixes,
    hookResponderPrefixes: hookResponderPrefixes,
    hookListenerTypes: hookListenerTypes,
    hookResponderTypes: hookResponderTypes,
    hookTypes: hookTypes
};
