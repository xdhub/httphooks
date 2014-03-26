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

var should = require('should');
var HookContext = require('../lib/hookContext.js');
var uuid = require('node-uuid');
var validHttpContexts = [
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        },
        responseQueue: []
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        },
        responseQueue: [ {} ]
    },
    {
        request: {
            url: '/my/:bar',
            method: 'get',
            headers: {
                'Content-Length': 1
            },
            content: ' '
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        },
        responseQueue: [ {} ]
    }
];
var invalidHttpContexts = [
    null,
    undefined,
    {},
    {
        request: { }
    },
    {
        request: null
    },
    {
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        response: null
    },
    {
        request: null,
        response: null
    },
    {
        request: null,
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: { },
        response: null
    },
    {
        request: { },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            url: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            method: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            headers: {}
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            content: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            url: '',
            method: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            url: '',
            headers: {}
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            url: '',
            content: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            method: '',
            headers: {}
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            method: '',
            content: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            headers: {},
            content: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            url: '',
            method: '',
            headers: {}
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            url: '',
            method: '',
            content: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            url: '',
            headers: {},
            content: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            method: '',
            headers: {},
            content: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: null
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    },
    {
        request: null,
        response: {
            statusCode: 200,
            headers: {},
            content: ''
        }
    }
];
var validHooks = [
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'request-listener'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'pre-responder'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'pre-listener'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'request'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'post-listener'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'post-resonder'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'response-listener'
    }
];

describe('HookContext', function () {
    describe('#Constructor(value1, value2)', function () {
        it('should not throw an error whenever the first and second value is valid', function () {
            validHttpContexts.forEach(function (httpContext) {
                validHooks.forEach(function (hook) {
                    var error = false;
                    try {
                        new HookContext(httpContext, hook);
                    } catch (e) {
                        throw e;
                        error = true;
                    }

                    error.should.equal(false, 'Expected no error being thrown for item: ' + httpContext ? JSON.stringify(httpContext) : typeof httpContext);
                });
            });
        });

        it('should throw an error whenever the second value is valid but the first is not', function () {
            invalidHttpContexts.forEach(function (httpContext) {
                validHooks.forEach(function (hook) {
                    var error = false;
                    try {
                        new HookContext(httpContext, hook);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(
                        true,
                        'Expected error being thrown for: \r\n httpContext - ' + httpContext ? JSON.stringify(httpContext) : typeof httpContext +
                        '\r\nhook - ' + hook ? JSON.stringify(hook) : typeof hook);
                });
            });
        });

        it('should have the corresponding instance properties accessible after initializing an instance', function () {
            validHttpContexts.forEach(function (httpContext) {
                validHooks.forEach(function (hook) {
                    var hookContext = new HookContext(httpContext, hook);
                    (typeof hookContext.hook).should.equal('object').should.not.be.empty;
                    (typeof hookContext.hook.identifier).should.equal('string');
                    (typeof hookContext.hook.urlPattern).should.equal('string');
                    (typeof hookContext.hook.type).should.equal('string');
                    (typeof hookContext.request).should.equal('object').should.not.be.empty;
                    (typeof hookContext.request.method).should.equal('string');
                    (typeof hookContext.request.url).should.equal('object').should.not.be.empty;
                    (typeof hookContext.request.query).should.equal('object');
                    (typeof hookContext.request.headers).should.equal('object');
                    (typeof hookContext.request.content).should.equal('string');
                    (typeof hookContext.request.json).should.equal('function');
                    var isResponder = hook.type.indexOf('responder') !== -1;
                    if (isResponder || hook.type === 'response-listener') {
                        (typeof hookContext.response).should.equal('object').should.not.be.empty;
                        if (isResponder) {
                            (typeof hookContext.setResponse).should.equal('function');
                            (typeof hookContext.response.statusCode).should.equal('number');
                            (typeof hookContext.response.headers).should.equal('object');
                            (typeof hookContext.response.content).should.equal('string');
                            (typeof hookContext.response.isSuccess).should.equal('function');
                        }
                    } else {
                        (typeof hookContext.response).should.equal('undefined');
                    }
                });
            });
        });
    });
});
