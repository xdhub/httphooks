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
