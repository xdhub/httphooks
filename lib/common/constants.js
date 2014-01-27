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
